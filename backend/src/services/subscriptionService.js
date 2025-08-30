'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { syncUserSubscriptionFlag } = require('./subscriptionSyncService');
const { getProductPriceMap } = require('./stripePriceCache');

let cachedPriceMap = null;
let lastPriceMapLoad = 0;
const PRICE_MAP_CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

async function ensureCachedPriceMap(force = false) {
  if (!cachedPriceMap || force || Date.now() - lastPriceMapLoad > PRICE_MAP_CACHE_TTL_MS) {
    cachedPriceMap = await getProductPriceMap();
    lastPriceMapLoad = Date.now();
  }
  return cachedPriceMap;
}

async function getPriceSets() {
  const priceMap = await ensureCachedPriceMap();
  return {
    basePriceIds: new Set(Object.values(priceMap.base.prices).filter(Boolean)),
    addonPriceIds: new Set(Object.values(priceMap.addon.prices).filter(Boolean)),
  };
}

function mapStripeIntervalToPlan(interval) {
  if (!interval) return null;
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'annual';
  return null;
}

async function subscriptionHasBase(subscription) {
  if (!subscription || !subscription.items || !Array.isArray(subscription.items.data)) return false;
  const { basePriceIds } = await getPriceSets();
  return subscription.items.data.some(item => basePriceIds.has(item.price?.id));
}

async function subscriptionHasAddon(subscription) {
  if (!subscription || !subscription.items || !Array.isArray(subscription.items.data)) return false;
  const { addonPriceIds } = await getPriceSets();
  return subscription.items.data.some(item => addonPriceIds.has(item.price?.id));
}

/**
 * Create or update subscription session (Strategy A).
 */
async function createOrUpdateSubscriptionSession(userId, plan, trial = false, includeAddon = false) {
  // plan must be 'monthly' or 'annual'
  if (!['monthly','annual'].includes(plan)) {
    throw new Error(`Unknown plan: ${plan}`);
  }

  const priceMap = await ensureCachedPriceMap();

  const basePriceId_target  = priceMap.base.prices[plan];   // target interval for base
  const addonPriceId_target = priceMap.addon.prices[plan];  // target interval for addon

  if (!basePriceId_target && !includeAddon) {
    throw new Error(`No base price found for ${plan}`);
  }
  if (includeAddon && !addonPriceId_target) {
    throw new Error(`No addon price found for ${plan}`);
  }

  // Find an existing active/trialing subscription
  const [[existing]] = await db.query(
    `SELECT stripe_subscription_id, id AS row_id
       FROM subscriptions
      WHERE user_id = ?
        AND status IN ('active','trialing')
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId]
  );

  if (existing) {
    const stripeSubId = existing.stripe_subscription_id;

    // Load the live subscription, expanded to see price ids
    const sub = await stripe.subscriptions.retrieve(stripeSubId, { expand: ['items.data.price'] });

    // Build quick sets for detecting which item is base vs addon (any interval)
    const basePriceSet  = new Set(Object.values(priceMap.base.prices).filter(Boolean));
    const addonPriceSet = new Set(Object.values(priceMap.addon.prices).filter(Boolean));

    const items = Array.isArray(sub.items?.data) ? sub.items.data : [];
    const baseItemExisting  = items.find(it => basePriceSet.has(it.price?.id));
    const addonItemExisting = items.find(it => addonPriceSet.has(it.price?.id));

    // We must keep all items on the same interval to satisfy Stripe’s rule.
    // So when we change base to 'plan', we must ALSO change the addon (if present) to the same 'plan'.
    const itemsOps = [];

    // Base: swap to target interval (or add if missing)
    if (basePriceId_target) {
      if (baseItemExisting) {
        if (baseItemExisting.price.id !== basePriceId_target) {
          itemsOps.push({ id: baseItemExisting.id, price: basePriceId_target });
        }
      } else {
        itemsOps.push({ price: basePriceId_target, quantity: 1 });
      }
    }

    // Addon handling:
    // - If the user wants addon now, ensure it exists and matches target interval
    // - If the user does NOT explicitly add addon, but an addon already exists, we STILL must align its interval
    if (addonItemExisting) {
      if (!addonPriceId_target) {
        // Safety: if for some reason target addon price is missing for this interval, delete addon to satisfy Stripe rule.
        itemsOps.push({ id: addonItemExisting.id, deleted: true });
      } else if (addonItemExisting.price.id !== addonPriceId_target) {
        itemsOps.push({ id: addonItemExisting.id, price: addonPriceId_target });
      }
    } else if (includeAddon && addonPriceId_target) {
      itemsOps.push({ price: addonPriceId_target, quantity: 1 });
    }

    // If nothing to change, short-circuit
    if (itemsOps.length === 0) {
      return { type: 'no_change', subscription: sub };
    }

    const updated = await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: false,
      proration_behavior: 'create_prorations',
      items: itemsOps,
      // We’re not changing trial here during mid-cycle swaps
    });

    // Decide has_addon AFTER update
    const hasAddonAfter = updated.items.data.some(it => addonPriceSet.has(it.price?.id));

    // Reflect in DB
    await db.query(
      `UPDATE subscriptions
          SET subscription_type = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [plan, updated.status, existing.row_id]
    );
    await db.query(`UPDATE users SET has_addon = ? WHERE id = ?`, [hasAddonAfter ? 1 : 0, userId]);

    await syncUserSubscriptionFlag(userId);
    return { type: 'update_existing', subscription: updated };
  }

  // No existing subscription → create Checkout session for base (+ optional addon) in the SAME interval
  const lineItems = [];
  if (basePriceId_target) lineItems.push({ price: basePriceId_target, quantity: 1 });
  if (includeAddon && addonPriceId_target) lineItems.push({ price: addonPriceId_target, quantity: 1 });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: await getUserEmail(userId),
    client_reference_id: String(userId),
    metadata: { plan, includeAddon: includeAddon ? '1' : '0' },
    line_items: lineItems,
    success_url: `${process.env.FRONTEND_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.FRONTEND_URL}/subscribe/cancel`,
    ...(trial ? { subscription_data: { trial_period_days: 30 } } : {}),
  });

  return { type: 'new_checkout', session };
}


// services/subscriptionService.js
async function createAddonOnlyCheckoutSession(userId, plan = null) {
  const priceMap = await ensureCachedPriceMap();

  // Helper to pick a sensible plan if not provided
  const pickAddonPlanFallback = () => {
    if (priceMap.addon.prices.monthly) return 'monthly';
    if (priceMap.addon.prices.annual)  return 'annual';
    throw new Error('No addon prices configured');
  };

  // Find current active/trialing subscription (if any)
  const [[existing]] = await db.query(
    `SELECT stripe_subscription_id, id AS row_id
       FROM subscriptions
      WHERE user_id = ?
        AND status IN ('active','trialing')
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId]
  );

  if (existing) {
    const stripeSubId = existing.stripe_subscription_id;
    const sub = await stripe.subscriptions.retrieve(stripeSubId, { expand: ['items.data.price'] });

    // Build sets to detect base / addon items
    const basePriceSet  = new Set(Object.values(priceMap.base.prices).filter(Boolean));
    const addonPriceSet = new Set(Object.values(priceMap.addon.prices).filter(Boolean));

    const items = Array.isArray(sub.items?.data) ? sub.items.data : [];
    const baseItem   = items.find(it => basePriceSet.has(it.price?.id));
    const addonItem  = items.find(it => addonPriceSet.has(it.price?.id));

    // Decide target plan:
    // - If base exists, inherit its interval (keeps Stripe happy)
    // - Else, use provided plan, else fallback
    let effectivePlan =
      (baseItem?.price?.recurring?.interval === 'month') ? 'monthly'
      : (baseItem?.price?.recurring?.interval === 'year') ? 'annual'
      : (plan && ['monthly','annual'].includes(plan)) ? plan
      : pickAddonPlanFallback();

    const addonPriceIdTarget = priceMap.addon.prices[effectivePlan];
    if (!addonPriceIdTarget) throw new Error(`Add-on price not configured for ${effectivePlan}`);

    // Build item ops: ONLY touch the add-on; leave base untouched
    const itemsOps = [];
    if (addonItem) {
      if (addonItem.price.id !== addonPriceIdTarget) {
        itemsOps.push({ id: addonItem.id, price: addonPriceIdTarget });
      }
    } else {
      itemsOps.push({ price: addonPriceIdTarget, quantity: 1 });
    }

    if (itemsOps.length === 0) {
      // Nothing to change
      return { type: 'no_change', subscription: sub };
    }

    const updated = await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: false,
      proration_behavior: 'create_prorations',
      items: itemsOps,
    });

    // Update flags
    const nowHasAddon = updated.items.data.some(it => addonPriceSet.has(it.price?.id));
    await db.query(`UPDATE users SET has_addon = ? WHERE id = ?`, [nowHasAddon ? 1 : 0, userId]);
    await db.query(`UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [existing.row_id]);
    await syncUserSubscriptionFlag(userId);

    return { type: 'update_existing', subscription: updated };
  }

  // No existing subscription → Checkout session with ONLY the add-on line item
  let effectivePlan =
    (plan && ['monthly','annual'].includes(plan)) ? plan : (
      priceMap.addon.prices.monthly ? 'monthly'
      : priceMap.addon.prices.annual ? 'annual'
      : null
    );
  if (!effectivePlan) throw new Error('No addon prices configured');

  const addonPriceIdTarget = priceMap.addon.prices[effectivePlan];
  if (!addonPriceIdTarget) throw new Error(`Add-on price not configured for ${effectivePlan}`);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: await getUserEmail(userId),
    client_reference_id: String(userId),
    metadata: { plan: effectivePlan, includeAddon: '1', addonOnly: '1' },
    line_items: [{ price: addonPriceIdTarget, quantity: 1 }], // ONLY ADD-ON
    success_url: `${process.env.FRONTEND_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.FRONTEND_URL}/subscribe/cancel`,
  });

  return { type: 'new_checkout', session };
}



async function getUserEmail(userId) {
  const [[row]] = await db.query(`SELECT email FROM users WHERE id = ? LIMIT 1`, [userId]);
  return row?.email;
}

/**
 * Record trial/subscription start or paid cycles (used by webhooks).
 */
async function recordTrial(userId, subscription, plan) {
  // Use subscription.trial_start and trial_end (unix timestamps)
  const ts = subscription.trial_start || null;
  const te = subscription.trial_end || null;

  const fields = [
    'user_id',
    'stripe_subscription_id',
    'subscription_type',
    'status',
    'started_at',
    'expires_at',
    'trial_start_at',
    'trial_end_at',
    'created_at',
    'updated_at'
  ];

  const values = [userId, subscription.id, 'free_trial', 'trialing'];
  const placeholders = ['?', '?', '?', '?'];

  // started_at & expires_at: convert from subscription.current_period_start/end if available,
  // else use trial timestamps (safer to set something)
  const startedAtUnix = subscription.current_period_start || ts;
  const expiresAtUnix = subscription.current_period_end || te;

  if (startedAtUnix) {
    placeholders.push('FROM_UNIXTIME(?)');
    values.push(startedAtUnix);
  } else {
    placeholders.push('NULL');
  }

  if (expiresAtUnix) {
    placeholders.push('FROM_UNIXTIME(?)');
    values.push(expiresAtUnix);
  } else {
    placeholders.push('NULL');
  }

  // trial start/end
  if (ts) {
    placeholders.push('FROM_UNIXTIME(?)');
    values.push(ts);
  } else {
    placeholders.push('NULL');
  }
  if (te) {
    placeholders.push('FROM_UNIXTIME(?)');
    values.push(te);
  } else {
    placeholders.push('NULL');
  }

  // created_at, updated_at
  placeholders.push('CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP');

  const sql = `INSERT INTO subscriptions (${fields.join(',')}) VALUES (${placeholders.join(',')})`;
  await db.query(sql, values);
}

async function recordPaidCycle(userId, subId, plan, start, end) {
  // start, end are unix timestamps from invoice lines
  await db.query(
    `INSERT INTO subscriptions
       (user_id, stripe_subscription_id, subscription_type, status,
        started_at, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, 'active',
             FROM_UNIXTIME(?), FROM_UNIXTIME(?),
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [userId, subId, plan, start, end]
  );
}

/**
 * Resolve local userId for a Stripe subscription object or subscriptionId.
 */
async function findUserIdFromSubscriptionObject(subscription) {
  // 1) Direct metadata on subscription
  if (subscription.metadata && subscription.metadata.userId) {
    const n = Number(subscription.metadata.userId);
    if (Number.isFinite(n)) return n;
  }

  // 2) Invoice metadata (no invalid expands)
  if (subscription.latest_invoice) {
    try {
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
      if (invoice && invoice.metadata && invoice.metadata.userId) {
        const n = Number(invoice.metadata.userId);
        if (Number.isFinite(n)) return n;
      }
    } catch (err) {
      console.warn('Could not retrieve invoice for metadata lookup:', err.message);
    }
  }

  // 3) Customer email lookup
  if (subscription.customer) {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer);
      const email = customer && customer.email;
      if (email) {
        const [[u]] = await db.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
        if (u && u.id) return u.id;
      }
    } catch (err) {
      console.warn('Could not retrieve customer for email lookup:', err.message);
    }
  }

  console.warn('No userId found for subscription', subscription.id);
  return null;
}


/**
 * Handle subscription created/updated: upsert with started_at/expires_at mapping
 */
async function handleSubscriptionUpsert(subscription) {
  const userId = await findUserIdFromSubscriptionObject(subscription);
  if (!userId) return;

  // Determine base/addon presence by price ids
  const { basePriceIds, addonPriceIds } = await getPriceSets();

  const items = Array.isArray(subscription.items?.data) ? subscription.items.data : [];
  const baseItem  = items.find(it => basePriceIds.has(it.price?.id));
  const addonItem = items.find(it => addonPriceIds.has(it.price?.id));

  const hasBase  = Boolean(baseItem);
  const hasAddon = Boolean(addonItem);

  // Map Stripe interval -> your enum ('monthly' | 'annual')
  const toType = (interval) => {
    if (interval === 'month') return 'monthly';
    if (interval === 'year')  return 'annual';
    return null;
  };

  // Prefer base interval; else fall back to addon interval; else prior DB value; else safe default
  let planType =
    toType(baseItem?.price?.recurring?.interval) ||
    toType(addonItem?.price?.recurring?.interval);

  if (!planType) {
    // try prior DB value for this subscription
    const [[prev]] = await db.query(
      `SELECT subscription_type FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1`,
      [subscription.id]
    );
    planType = prev?.subscription_type || 'monthly'; // last-resort default to satisfy NOT NULL
  }

  // Timestamps: use subscription-level period
  const startedAtUnix = subscription.current_period_start || null;
  const expiresAtUnix = subscription.current_period_end   || null;

  try {
    await db.query(
      `
      INSERT INTO subscriptions (
        user_id,
        stripe_subscription_id,
        subscription_type,
        status,
        started_at,
        expires_at,
        created_at,
        updated_at
      )
      VALUES (
        ?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?), NOW(), NOW()
      )
      ON DUPLICATE KEY UPDATE
        subscription_type = COALESCE(VALUES(subscription_type), subscription_type),
        status            = VALUES(status),
        started_at        = COALESCE(VALUES(started_at), started_at),
        expires_at        = COALESCE(VALUES(expires_at), expires_at),
        updated_at        = NOW()
      `,
      [
        userId,
        subscription.id,
        planType,                          // never null here (we ensured fallback)
        subscription.status,
        startedAtUnix,
        expiresAtUnix
      ]
    );
  } catch (err) {
    console.error('handleSubscriptionUpsert DB error for subscription', subscription.id, err);
    throw err;
  }

  // Update user flags
  try {
    await db.query(
      `UPDATE users SET is_subscribed = ?, has_addon = ? WHERE id = ?`,
      [hasBase ? 1 : 0, hasAddon ? 1 : 0, userId]
    );
  } catch (err) {
    console.error('Failed updating user flags for', userId, err);
    throw err;
  }

  console.log(
    `✅ Subscription ${subscription.id} synced for user ${userId}: ` +
    `base=${hasBase}, addon=${hasAddon}, type=${planType}, status=${subscription.status}`
  );
}



/**
 * Handle subscription deletion event.
 */
async function handleSubscriptionDelete(subscription) {
  const userId = await findUserIdFromSubscriptionObject(subscription);
  if (!userId) {
    console.warn('handleSubscriptionDelete: no userId for', subscription.id);
    return;
  }

  const expiresAtUnix = subscription.current_period_end || Math.floor(Date.now() / 1000);

  await db.query(`UPDATE subscriptions SET status = 'canceled', updated_at = NOW(), expires_at = FROM_UNIXTIME(?) WHERE stripe_subscription_id = ?`, [expiresAtUnix, subscription.id]);

  // Re-evaluate overall user flags (there may be other subs)
  await syncUserSubscriptionFlag(userId);

  console.log(`Subscription canceled: ${subscription.id} user=${userId}`);
}

async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  const [[subRow]] = await db.query(`SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1`, [subscriptionId]);
  if (!subRow) return;
  console.warn(`Payment failed for user ${subRow.user_id} subscription ${subscriptionId}`);
  // optional: notify user
}

async function removeBaseKeepAddon(userId, subscriptionId) {
  if (!subscriptionId) throw new Error('subscriptionId required');

  // Load current subscription with price info
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });

  // Determine which items are "base"
  const priceMap = await ensureCachedPriceMap();
  const basePriceIds = new Set(
    Object.values(priceMap.base.prices).filter(Boolean)
  );

  // Build item operations: delete base, keep everything else as-is
  const itemsOps = [];
  let foundBase = false;

  for (const it of subscription.items.data) {
    const priceId = it.price?.id;
    if (basePriceIds.has(priceId)) {
      itemsOps.push({ id: it.id, deleted: true });
      foundBase = true;
    } else {
      // keep non-base items unchanged
      itemsOps.push({ id: it.id, price: priceId });
    }
  }

  if (!foundBase) {
    return { type: 'no_base_found', subscription };
  }

  // Apply update (with proration)
  const updated = await stripe.subscriptions.update(subscriptionId, {
    proration_behavior: 'create_prorations',
    items: itemsOps,
  });

  // Recompute addon flag and sync user flags
  const stillHasAddon = await subscriptionHasAddon(updated);

  await db.query(
    `UPDATE subscriptions SET updated_at = NOW() WHERE stripe_subscription_id = ?`,
    [subscriptionId]
  );
  await db.query(
    `UPDATE users SET has_addon = ? WHERE id = ?`,
    [stillHasAddon ? 1 : 0, userId]
  );
  await syncUserSubscriptionFlag(userId);

  return { type: 'updated', subscription: updated };
}

async function handleStripeWebhook(event) {
  console.log('▶︎ Stripe event:', event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const sess = event.data.object;
      const subId = sess.subscription;
      const plan  = sess.metadata?.plan;
      const includeAddon = sess.metadata?.includeAddon === '1';

      let userId = sess.client_reference_id ? Number(sess.client_reference_id) : null;
      if (!userId && sess.customer_email) {
        const [[u]] = await db.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [sess.customer_email]);
        if (u?.id) userId = u.id;
      }
      if (!userId || !subId) {
        console.warn('checkout.session.completed missing userId or subscription id', sess.id);
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price'] });
      const firstItem = subscription.items?.data?.[0];
      const start = firstItem?.current_period_start || subscription.current_period_start || null;
      const end   = firstItem?.current_period_end   || subscription.current_period_end   || null;

      if (subscription.status === 'trialing') {
        await recordTrial(userId, subscription, plan || mapStripeIntervalToPlan(firstItem?.price?.recurring?.interval) || 'monthly');
      } else if (start && end) {
        await recordPaidCycle(
          userId,
          subscription.id,
          plan || mapStripeIntervalToPlan(firstItem?.price?.recurring?.interval) || 'monthly',
          start,
          end
        );
      }

      if (includeAddon) {
        await db.query(`UPDATE users SET has_addon = 1 WHERE id = ?`, [userId]);
      }
      await syncUserSubscriptionFlag(userId);
      console.log(`Processed checkout.session.completed for user ${userId}, sub ${subId}`);
      return;
    }

    case 'invoice.paid': {
      const inv   = event.data.object;
      const subId = inv.subscription;
      const line  = inv.lines.data.find(l => l.plan && l.period);
      if (!subId || !line) return;

      const start = line.period.start;
      const end   = line.period.end;

      const [[row]] = await db.query(
        `SELECT user_id, subscription_type
           FROM subscriptions
          WHERE stripe_subscription_id = ?
          ORDER BY created_at DESC
          LIMIT 1`,
        [subId]
      );
      if (!row) {
        console.warn('invoice.paid: no local subscription row for', subId);
        return;
      }

      await recordPaidCycle(row.user_id, subId, row.subscription_type, start, end);
      await syncUserSubscriptionFlag(row.user_id);
      console.log(`Recorded paid cycle for user ${row.user_id}, sub ${subId}`);
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpsert(event.data.object);
      return;

    case 'customer.subscription.deleted':
      await handleSubscriptionDelete(event.data.object);
      return;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      return;

    default:
      console.log('Ignored Stripe event type:', event.type);
      return;
  }
}


module.exports = {
  createOrUpdateSubscriptionSession,
  createAddonOnlyCheckoutSession,
  subscriptionHasBase,
  subscriptionHasAddon,
  handleStripeWebhook,
  findUserIdFromSubscriptionObject,
  // exposed for tests/debug if desired:
  recordTrial,
  recordPaidCycle,
  removeBaseKeepAddon
};
