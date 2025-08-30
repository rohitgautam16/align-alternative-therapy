'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

const {
  createOrUpdateSubscriptionSession,
  createAddonOnlyCheckoutSession,
  handleStripeWebhook,
  subscriptionHasAddon,
  subscriptionHasBase,
  findUserIdFromSubscriptionObject,
  removeBaseKeepAddon
} = require('../services/subscriptionService');

const { getProductPriceMap } = require('../services/stripePriceCache');
const { syncUserSubscriptionFlag } = require('../services/subscriptionSyncService');

/**
 * POST /api/subscribe/checkout
 */
async function checkoutController(req, res) {
  try {
    const { plan, trial, includeAddon } = req.body;
    const userId = req.user.id;

    const result = await createOrUpdateSubscriptionSession(
      userId,
      plan,
      Boolean(trial),
      Boolean(includeAddon)
    );

    if (result.type && String(result.type).startsWith('new')) {
      // New Checkout session created → return redirect URL
      return res.json({ url: result.session.url });
    }

    // Updated existing subscription (or no change)
    return res.json({ subscription: result.subscription, type: result.type });
  } catch (err) {
    console.error('checkoutController error:', err);
    return res.status(500).json({ error: err.message || 'Checkout failed' });
  }
}

async function checkoutAddonController(req, res) {
  try {
    const userId = req.user.id;
    const { plan } = req.body || {}; // optional: 'monthly' | 'annual'
    const result = await createAddonOnlyCheckoutSession(userId, plan);

    if (result.type && String(result.type).startsWith('new')) {
      return res.json({ url: result.session.url });
    }
    return res.json({ subscription: result.subscription, type: result.type });
  } catch (err) {
    console.error('checkoutAddonController error:', err);
    return res.status(500).json({ error: err.message || 'Checkout add-on failed' });
  }
}

/**
 * POST /api/webhooks/stripe
 *
 * NOTE: route must use express.raw({ type: 'application/json' }) middleware so req.body is Buffer
 */
async function webhookController(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency: insert event; ignore duplicates
  try {
    await db.query(
      `INSERT INTO webhook_events (event_id, event_type, payload, created_at)
       VALUES (?, ?, ?, NOW())`,
      [event.id, event.type, JSON.stringify(event)]
    );
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      console.log('Duplicate webhook event ignored:', event.id);
      return res.status(200).send('ok');
    }
    console.error('Failed to insert webhook event row:', err);
    return res.status(500).send('error');
  }

  try {
    // Delegate to service-level handler (already implemented)
    await handleStripeWebhook(event);

    // Mark processed
    try {
      await db.query(
        `UPDATE webhook_events SET processed = 1, processed_at = NOW() WHERE event_id = ?`,
        [event.id]
      );
    } catch (uerr) {
      console.warn('Failed to mark webhook event processed:', uerr);
    }

    return res.status(200).send('ok');
  } catch (handlerErr) {
    console.error('Webhook handling error:', handlerErr);
    try {
      await db.query(
        `UPDATE webhook_events SET attempt_count = attempt_count + 1, error = ? WHERE event_id = ?`,
        [String(handlerErr.message || handlerErr), event.id]
      );
    } catch (uerr) {
      console.warn('Failed to update webhook_events error/attempt_count:', uerr);
    }
    return res.status(500).send('error');
  }
}

/**
 * POST /api/subscribe/cancel
 * body: { subscriptionId: string, immediate?: boolean }
 */
async function cancelSubscriptionController(req, res) {
  try {
    const userId = req.user.id;
    const { subscriptionId, immediate = false } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });

    // Verify ownership using subscriptions table first
    const [rows] = await db.query(
      `SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ? ORDER BY created_at DESC LIMIT 1`,
      [subscriptionId]
    );
    let ownerRow = rows[0];

    // If not in DB, attempt to resolve via Stripe -> user email/customer or metadata
    if (!ownerRow) {
      try {
        const subForOwner = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['customer'] });
        const resolvedUserId = await findUserIdFromSubscriptionObject(subForOwner);
        if (!resolvedUserId || resolvedUserId !== userId) {
          return res.status(403).json({ error: 'Subscription not found for user' });
        }
      } catch (err) {
        console.warn('Could not retrieve subscription to verify ownership:', err.message);
        return res.status(403).json({ error: 'Subscription not found for user' });
      }
    } else {
      if (ownerRow.user_id !== userId) return res.status(403).json({ error: 'Subscription not found for user' });
    }

    // Retrieve live subscription to inspect items
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
    } catch (err) {
      console.warn('Failed to retrieve subscription for cancel operation:', err.message);
      // continue with best-effort (but we need items to know addon/base)
    }

    const hadAddon = subscription ? await subscriptionHasAddon(subscription) : false;
    const hadBase = subscription ? await subscriptionHasBase(subscription) : false;

    let stripeResult;
    if (immediate) {
      // Prefer `del`/`cancel` if available, else update cancel_at to now
      try {
        if (typeof stripe.subscriptions.del === 'function') {
          stripeResult = await stripe.subscriptions.del(subscriptionId);
        } else if (typeof stripe.subscriptions.cancel === 'function') {
          stripeResult = await stripe.subscriptions.cancel(subscriptionId);
        } else {
          // fallback: set cancel_at = now
          const nowUnix = Math.floor(Date.now() / 1000);
          stripeResult = await stripe.subscriptions.update(subscriptionId, { cancel_at: nowUnix });
        }
      } catch (err) {
        console.error('Immediate cancel via Stripe failed:', err);
        return res.status(500).json({ error: 'Stripe cancel failed' });
      }

      // Update DB: set status and expires_at NOW
      const returnedStatus = (stripeResult && stripeResult.status) ? String(stripeResult.status) : 'canceled';
      await db.query(
        `UPDATE subscriptions
           SET status = ?, expires_at = NOW(), updated_at = CURRENT_TIMESTAMP
         WHERE stripe_subscription_id = ?`,
        [returnedStatus, subscriptionId]
      );
    } else {
      // Scheduled cancel at period end
      let updated;
      try {
        updated = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      } catch (err) {
        console.error('Scheduled cancel via Stripe failed:', err);
        return res.status(500).json({ error: 'Stripe scheduled cancel failed' });
      }

      const cancelAt = updated.cancel_at || null;
      const currentPeriodEnd = updated.current_period_end || null;

      // Build dynamic SQL params to avoid FROM_UNIXTIME(NULL)
      const updates = ['cancel_at_period_end = 1'];
      const params = [];
      if (cancelAt) {
        updates.push('cancel_at = FROM_UNIXTIME(?)');
        params.push(cancelAt);
      } else {
        updates.push('cancel_at = NULL');
      }
      if (currentPeriodEnd) {
        updates.push('expires_at = FROM_UNIXTIME(?)');
        params.push(currentPeriodEnd);
      }

      // only set status if known/expected value (defensive)
      const ALLOWED = new Set(['trialing','active','past_due','canceled','incomplete','unpaid','incomplete_expired']);
      if (ALLOWED.has(updated.status)) {
        updates.unshift('status = ?');
        params.unshift(updated.status);
      }

      params.push(subscriptionId);
      const sql = `UPDATE subscriptions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = ?`;
      await db.query(sql, params);

      stripeResult = updated;
    }

    // Update user flags locally (we still call syncUserSubscriptionFlag to let DB be authoritative)
    if (hadAddon) {
      await db.query(`UPDATE users SET has_addon = 0 WHERE id = ?`, [userId]);
    }

    // Recompute is_subscribed from DB rows (authoritative)
    await syncUserSubscriptionFlag(userId);

    return res.json({ ok: true, subscription: stripeResult });
  } catch (err) {
    console.error('cancelSubscriptionController error:', err);
    return res.status(500).json({ error: err.message || 'Cancel failed' });
  }
}

/**
 * POST /api/subscribe/cancel-addon
 * body: { subscriptionId: string }
 */
async function cancelAddonController(req, res) {
  try {
    const userId = req.user.id;
    const { subscriptionId } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });

    // Verify ownership via subscriptions table first
    const [rows] = await db.query(
      `SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ? ORDER BY created_at DESC LIMIT 1`,
      [subscriptionId]
    );
    const owner = rows[0];
    if (!owner || owner.user_id !== userId) {
      // fallback: try to resolve via Stripe customer/metadata
      try {
        const subForOwner = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['customer'] });
        const resolved = await findUserIdFromSubscriptionObject(subForOwner);
        if (!resolved || resolved !== userId) {
          return res.status(403).json({ error: 'Subscription not found for user' });
        }
      } catch (err) {
        console.warn('Could not verify ownership via Stripe:', err.message);
        return res.status(403).json({ error: 'Subscription not found for user' });
      }
    }

    // Retrieve subscription and expanded prices
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
    } catch (err) {
      console.error('Failed to retrieve subscription:', err);
      return res.status(500).json({ error: 'Failed to retrieve subscription' });
    }

    // Determine addon item by comparing to cached price map
    const priceMap = await getProductPriceMap();
    const addonPriceIds = new Set(Object.values(priceMap.addon.prices).filter(Boolean));

    const addonItem = subscription.items.data.find(it => addonPriceIds.has(it.price?.id));
    if (!addonItem) {
      return res.status(404).json({ error: 'No add-on found on this subscription' });
    }

    // Delete that subscription item (no prorations)
    let updated;
    try {
      updated = await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: addonItem.id, deleted: true }],
        proration_behavior: 'none',
      });
    } catch (err) {
      console.error('Failed to remove addon item from subscription:', err);
      return res.status(500).json({ error: 'Failed to remove addon' });
    }

    // Update DB and flags
    await db.query(`UPDATE users SET has_addon = 0 WHERE id = ?`, [userId]);
    await db.query(`UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = ?`, [subscriptionId]);

    await syncUserSubscriptionFlag(userId);

    return res.json({ ok: true, subscription: updated });
  } catch (err) {
    console.error('cancelAddonController error:', err);
    return res.status(500).json({ error: err.message || 'Cancel addon failed' });
  }
}

async function removeBaseController(req, res) {
  try {
    const userId = req.user.id;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId required' });
    }

    // Verify ownership by resolving userId from the Stripe sub
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price'],
    });
    const ownerId = await findUserIdFromSubscriptionObject(sub);
    if (ownerId !== userId) {
      return res.status(403).json({ error: 'Subscription not found for user' });
    }

    // Perform mutation
    const result = await removeBaseKeepAddon(userId, subscriptionId);
    if (result.type === 'no_base_found') {
      return res.status(404).json({ error: 'No base item found on subscription' });
    }

    return res.json({ ok: true, subscription: result.subscription });
  } catch (err) {
    console.error('Remove base error:', err);
    return res.status(500).json({ error: err.message || 'Remove base failed' });
  }
}

async function subscriptionSummaryController(req, res) {
  try {
    const userId = req.user.id;

    // Find the most recent subscription row for this user
    const [[row]] = await db.query(
      `SELECT stripe_subscription_id, status, cancel_at
         FROM subscriptions
        WHERE user_id = ?
        ORDER BY 
          CASE WHEN status IN ('active','trialing','past_due') THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT 1`,
      [userId]
    );

    // Apply no-store headers on every response
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Vary', 'Cookie');

    if (!row || !row.stripe_subscription_id) {
      // No subscription found (or all fully canceled/expired)
      return res.json({
        hasSubscription: false,
        status: 'none',
        plan: null,
        hasAddon: false,
        subscriptionId: null,
        isEntitled: false,
        baseEntitled: false,
        addonEntitled: false,
      });
    }

    // Map of base + addon price IDs
    const priceMap = await getProductPriceMap();
    const basePriceIds  = new Set(Object.values(priceMap.base.prices).filter(Boolean));
    const addonPriceIds = new Set(Object.values(priceMap.addon.prices).filter(Boolean));

    // Retrieve the live subscription from Stripe
    const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id, {
      expand: ['items.data.price.product']
    });

    // Items
    const items = Array.isArray(sub.items?.data) ? sub.items.data : [];
    const hasAddon = items.some(i => addonPriceIds.has(i.price?.id));
    const baseItem = items.find(i => basePriceIds.has(i.price?.id));

    // Plan (monthly/annual) if base item present
    const plan =
      baseItem?.price?.recurring?.interval === 'month'
        ? 'monthly'
        : (baseItem?.price?.recurring?.interval === 'year' ? 'annual' : null);

    // Totals
    const currency = items[0]?.price?.currency?.toUpperCase?.() || 'USD';
    const totalUnit = items.reduce((sum, i) => sum + (i.price?.unit_amount ?? 0), 0);

    // ----- Entitlement logic (fixed) -----
    // Treat canceled as entitled until the current period actually ends.
    const nowSec = Math.floor(Date.now() / 1000);
    const entitledStatuses = new Set(['active', 'trialing', 'past_due']);
    const stripeCPE = Number(sub.current_period_end) || null;

    // Fallback to DB cancel_at if Stripe doesn't provide current_period_end
    const dbCancelAtSec = row.cancel_at ? Math.floor(new Date(row.cancel_at).getTime() / 1000) : null;

    const stillWithinPaidPeriod =
      (typeof stripeCPE === 'number' && stripeCPE > nowSec) ||
      (typeof dbCancelAtSec === 'number' && dbCancelAtSec > nowSec);

    const isEntitled =
      entitledStatuses.has(sub.status) ||
      (sub.status === 'canceled' && stillWithinPaidPeriod);

    const baseEntitled  = Boolean(isEntitled && baseItem);
    const addonEntitled = Boolean(isEntitled && hasAddon);

    // Response
    res.json({
      hasSubscription: true,
      subscriptionId: sub.id,
      status: sub.status,        // e.g. active | trialing | past_due | canceled | unpaid | ...
      plan,                      // monthly | annual | null
      hasAddon,

      // ✅ Explicit entitlement flags
      isEntitled,
      baseEntitled,
      addonEntitled,

      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      // Stripe timestamps are seconds; convert to ISO (ms)
      cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : (row.cancel_at || null),
      currentPeriodEnd: stripeCPE ? new Date(stripeCPE * 1000).toISOString() : (row.cancel_at || null),

      // Pricing display
      currency,
      totalUnitAmount: totalUnit, // in minor units (e.g. cents)
      totalFormatted: `${(totalUnit / 100).toFixed(2)} ${currency}`,
      lineItems: items.map(i => ({
        id: i.id,
        priceId: i.price?.id,
        product: i.price?.product,
        product_name:
          (i.price?.product && typeof i.price.product === 'object')
            ? i.price.product.name
            : null,
        nickname: i.price?.nickname,
        interval: i.price?.recurring?.interval,
        amount: i.price?.unit_amount
      })),
    });
  } catch (err) {
    console.error('subscriptionSummaryController error:', err);
    res.status(500).json({ error: err.message || 'Failed to load subscription summary' });
  }
}

module.exports = { subscriptionSummaryController };


async function createBillingPortalSession(req, res) {
  try {
    const userId = req.user.id;

    // 1) Ensure we have customer id
    const [[user]] = await db.query(
      `SELECT stripe_customer_id, stripe_subscription_id FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    let customerId = user?.stripe_customer_id;

    // Derive from subscription if missing
    if (!customerId && user?.stripe_subscription_id) {
      const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      customerId = sub.customer;
      if (customerId) {
        await db.query(`UPDATE users SET stripe_customer_id = ? WHERE id = ?`, [customerId, userId]);
      }
    }

    if (!customerId) {
      return res.status(400).json({ error: 'No Stripe customer found for this user.' });
    }

    // 2) Create Billing Portal session (Stripe-hosted)
    const returnUrl = process.env.STRIPE_PORTAL_RETURN_URL || `${process.env.APP_ORIGIN || ''}/account/billing`;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('createBillingPortalSession error:', err);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
}


module.exports = {
  checkoutController,
  checkoutAddonController,
  webhookController,
  cancelSubscriptionController,
  cancelAddonController,
  removeBaseController,
  subscriptionSummaryController,
  createBillingPortalSession
};
