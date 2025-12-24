'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { syncUserSubscriptionFlag } = require('./subscriptionSyncService');
const { getProductPriceMap } = require('./stripePriceCache');
const { sendWelcomeOnSubscription } = require('../server/mail/emailService');

let cachedPriceMap = null;
let lastPriceMapLoad = 0;
const PRICE_MAP_CACHE_TTL_MS = 1000 * 60 * 15; 

const YEARLY_PROMO_COUPON_ID = process.env.STRIPE_ANNUAL_PROMO_COUPON_ID || null;

const { resolveTrialDays } = require("./promoTrialEngine");

function isAnnualPromoActive(plan) {
  return plan === 'annual' && !!YEARLY_PROMO_COUPON_ID;
}

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
    basePriceIds: new Set(Object.values(priceMap.base.prices).filter(Boolean))
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


async function createOrUpdateSubscriptionSession(userId, plan, trial = false, promoCode = null) {
  if (!['monthly', 'annual'].includes(plan)) {
    throw new Error(`Unknown plan: ${plan}`);
  }

  console.log(`▶️ Creating or updating subscription session for user=${userId}, plan=${plan}, trial=${trial}`);

  let basePriceId = null;
  let source = 'cache';
  try {
    const { getProductPriceMap } = require('./stripePriceCache');
    const priceMap = await getProductPriceMap();
    const baseInfo = priceMap.base;

    if (!baseInfo?.productId) throw new Error('Base product not found in cache');
    basePriceId = baseInfo.prices?.[plan];
    if (!basePriceId) throw new Error(`No ${plan} price found for cached base product "${baseInfo.name}"`);
    console.log(`🧾 Using cached price ${basePriceId} for base product ${baseInfo.productId}`);
  } catch (err) {
    source = 'env';
    basePriceId = plan === 'annual'
      ? process.env.STRIPE_PRICE_ANNUAL_ID
      : process.env.STRIPE_PRICE_MONTHLY_ID;

    if (!basePriceId) throw new Error(`No Stripe price found for plan=${plan}`);
    console.warn(`⚠️ Price map fallback: using ${source}-based ID ${basePriceId}`);
  }


  const [[existing]] = await db.query(
    `SELECT stripe_subscription_id, id AS row_id
       FROM subscriptions
      WHERE user_id = ? AND status IN ('active','trialing')
      ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (existing) {
    const sub = await stripe.subscriptions.retrieve(existing.stripe_subscription_id, {
      expand: ['items.data.price'],
    });

    const hasSamePrice = sub.items.data.some(it => it.price?.id === basePriceId);
    if (hasSamePrice) {
      console.log(`🟢 Existing active subscription already matches ${plan}`);
      return { type: 'no_change', subscription: sub };
    }

    // const baseItem = sub.items.data[0];
    // const updated = await stripe.subscriptions.update(existing.stripe_subscription_id, {
    //   cancel_at_period_end: false,
    //   proration_behavior: 'create_prorations',
    //   items: [{ id: baseItem.id, price: basePriceId }],
    // });


    const baseItem = sub.items.data[0];

    const applyAnnualPromo = isAnnualPromoActive(plan);

    const updatePayload = {
      cancel_at_period_end: false,
      proration_behavior: 'create_prorations',
      items: [{ id: baseItem.id, price: basePriceId }],
    };

    if (applyAnnualPromo) {
      updatePayload.coupon = YEARLY_PROMO_COUPON_ID;
    }

    const updated = await stripe.subscriptions.update(
      existing.stripe_subscription_id,
      updatePayload
    );


    await db.query(
      `UPDATE subscriptions
         SET subscription_type = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [plan, updated.status, existing.row_id]
    );

    await db.query(`UPDATE users SET has_addon = 0 WHERE id = ?`, [userId]);
    await syncUserSubscriptionFlag(userId);

 
    await db.query(
      `UPDATE users
         SET profile_type = 'premium_full',
             user_tier_id = 3,
             updated_at = NOW()
       WHERE id = ?`,
      [userId]
    );

    console.log(`✅ Updated existing subscription for user=${userId} to plan=${plan}`);
    return { type: 'update_existing', subscription: updated };
  }

  // const userEmail = await getUserEmail(userId);

  // const session = await stripe.checkout.sessions.create({
  //   mode: 'subscription',
  //   customer_email: userEmail,
  //   client_reference_id: String(userId),
  //   line_items: [{ price: basePriceId, quantity: 1 }],
  //   metadata: { user_id: String(userId), plan, purpose: 'premium_subscription' },
  //   success_url: `${process.env.FRONTEND_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url: `${process.env.FRONTEND_URL}/subscribe/cancel`,
  //   ...(trial ? { subscription_data: { trial_period_days: 30 } } : {}),
  // });

  const userEmail = await getUserEmail(userId);

  const applyAnnualPromo = isAnnualPromoActive(plan);

  const trialDays = await resolveTrialDays({
    trial,           
    plan,            
    promoCode,
  });

  console.log("DEBUG BACKEND → trialDays after resolveTrialDays:", { promoCode, trialDays });

  const sessionPayload = {
    mode: 'subscription',
    customer_email: userEmail,
    client_reference_id: String(userId),
    line_items: [{ price: basePriceId, quantity: 1 }],
    metadata: { user_id: String(userId), plan, purpose: 'premium_subscription', promo_code_used: promoCode || "none" },
    success_url: `${process.env.FRONTEND_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/subscribe/cancel`,
    //...(trial ? { subscription_data: { trial_period_days: 30 } } : {}),
  };

  console.log("TRIAL DAYS BEING SENT TO STRIPE =", trialDays);
console.log("FINAL sessionPayload =", sessionPayload);

  if (trialDays > 0) {
    sessionPayload.subscription_data = {
      trial_period_days: trialDays,
    };
  }

  if (promoCode) {
  const promo = await stripe.promotionCodes.list({
    code: promoCode,
    active: true,
    limit: 1,
  });

  if (promo.data.length > 0) {
    sessionPayload.discounts = [{
      promotion_code: promo.data[0].id
    }];
  }
}

  const ENABLE_ANNUAL_PROMO = false; // temporary off

  if (ENABLE_ANNUAL_PROMO && applyAnnualPromo) {
    sessionPayload.discounts = [{ coupon: YEARLY_PROMO_COUPON_ID }];
  }


  const session = await stripe.checkout.sessions.create(sessionPayload);


  await db.query(
    `UPDATE users
       SET profile_type = 'premium_full',
           user_tier_id = 3,
           is_subscribed = 1,
           updated_at = NOW()
     WHERE id = ?`,
    [userId]
  );

  console.log(`🪄 Created new ${source}-based checkout session for user=${userId}, plan=${plan}`);
  return { type: 'new_checkout', session };
}


async function getBaseProductPrice(type = 'premium_full', plan = 'monthly') {
  const { getProductPriceMap } = require('./stripePriceCache');
  const priceMap = await getProductPriceMap();
  const baseInfo = priceMap.base;

  if (!baseInfo?.productId) {
    throw new Error('Base product not found in Stripe cache');
  }

  const priceId = baseInfo.prices?.[plan];
  if (!priceId) {
    throw new Error(`No ${plan} price found for base product "${baseInfo.name}"`);
  }

  return {
    productId: baseInfo.productId,
    priceId,
    productName: baseInfo.name,
  };
}


async function cancelStripeSubscriptionByUser(userId) {
  const [[row]] = await db.query(
    `SELECT stripe_subscription_id FROM subscriptions
     WHERE user_id = ? AND status IN ('active','trialing')
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (!row?.stripe_subscription_id) return;

  try {
    await stripe.subscriptions.cancel(row.stripe_subscription_id);
    await db.query(
      `UPDATE subscriptions
         SET status = 'canceled', updated_at = NOW()
       WHERE stripe_subscription_id = ?`,
      [row.stripe_subscription_id]
    );
    console.log(`✅ Canceled subscription ${row.stripe_subscription_id}`);
  } catch (err) {
    console.warn('⚠️ Failed to cancel subscription:', err.message);
  }
}

async function getUserEmail(userId) {
  const [[row]] = await db.query(`SELECT email FROM users WHERE id = ? LIMIT 1`, [userId]);
  return row?.email;
}

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


async function handleSubscriptionUpsert(subscription) {
  const userId = await findUserIdFromSubscriptionObject(subscription);
  if (!userId) return;

  const { basePriceIds } = await getPriceSets();

  const items = Array.isArray(subscription.items?.data) ? subscription.items.data : [];
  const baseItem = items.find(it => basePriceIds.has(it.price?.id));
  const hasBase = Boolean(baseItem);

  const toType = (interval) => {
    if (interval === 'month') return 'monthly';
    if (interval === 'year') return 'annual';
    return null;
  };

  let planType = toType(baseItem?.price?.recurring?.interval);
  if (!planType) {
    const [[prev]] = await db.query(
      `SELECT subscription_type FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1`,
      [subscription.id]
    );
    planType = prev?.subscription_type || 'monthly'; 
  }

  const startedAtUnix = subscription.current_period_start || Math.floor(Date.now() / 1000);
  const expiresAtUnix = subscription.current_period_end || startedAtUnix + 30 * 24 * 60 * 60;

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
        planType,
        subscription.status,
        startedAtUnix,
        expiresAtUnix,
      ]
    );
  } catch (err) {
    console.error('handleSubscriptionUpsert DB error for subscription', subscription.id, err);
    throw err;
  }

  // Update user flags — addon always 0 now
  try {
    await db.query(
      `UPDATE users SET is_subscribed = ?, has_addon = 0 WHERE id = ?`,
      [hasBase ? 1 : 0, userId]
    );
  } catch (err) {
    console.error('Failed updating user flags for', userId, err);
    throw err;
  }

  console.log(
    `✅ Subscription ${subscription.id} synced for user ${userId}: base=${hasBase}, type=${planType}, status=${subscription.status}`
  );
}


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

async function handleOneTimePaymentCompleted(session) {
  try {
    const userId = Number(session.metadata?.user_id);
    if (!userId) {
      console.warn('⚠️ No user_id in one-time payment metadata');
      return;
    }

    if (session.metadata?.purpose !== 'recommendation_joining_fee') {
      console.log(`Skipping non-one-time session for user ${userId}`);
      return;
    }

    const paymentIntentId = session.payment_intent || null;

    await db.query(
      `UPDATE users
         SET one_time_payment_status = 'paid',
             stripe_payment_intent_id = ?,
             is_subscribed = 1,
             updated_at = NOW()
       WHERE id = ?`,
      [paymentIntentId, userId]
    );

    console.log(`✅ One-time payment marked as paid for user ${userId}`);
  } catch (err) {
    console.error('❌ Error in handleOneTimePaymentCompleted:', err);
  }
}


async function cancelStripeSubscriptionByUser(userId) {
  const [[row]] = await db.query(
    `SELECT stripe_subscription_id FROM subscriptions
      WHERE user_id = ? AND status IN ('active','trialing')
      ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (!row?.stripe_subscription_id) return;

  try {
    await stripe.subscriptions.cancel(row.stripe_subscription_id);
    await db.query(
      `UPDATE subscriptions
         SET status = 'canceled', updated_at = NOW()
       WHERE stripe_subscription_id = ?`,
      [row.stripe_subscription_id]
    );
    console.log(`🛑 Cancelled sub ${row.stripe_subscription_id} for user ${userId}`);
  } catch (err) {
    console.warn('⚠️ cancelStripeSubscriptionByUser failed:', err.message);
  }
}

async function ensureStripeCustomer(userId, email) {
  const [[existing]] = await db.query(
    'SELECT stripe_customer_id FROM users WHERE id = ?',
    [userId]
  );
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({ email });
  await db.query('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [
    customer.id,
    userId,
  ]);
  return customer.id;
}


async function handleStripeWebhook(event) {
  console.log('▶︎ Stripe event:', event.type);

  switch (event.type) {

    case 'checkout.session.completed': {
      const sess = event.data.object;

      if (sess.metadata?.purpose === 'recommendation_joining_fee') {
        await handleOneTimePaymentCompleted(sess);
        return;
      }

      const recId = sess.metadata?.recommendation_id;
      if (recId) {
        console.log(`PB Recommendation payment success for rec_id=${recId}`);

        try {
          await db.query(
            `UPDATE pb_recommendations
             SET payment_status = 'paid',
                 paid_at = NOW()
             WHERE id = ?`,
            [recId]
          );
          console.log(`✅ Marked recommendation #${recId} as paid`);
        } catch (dbErr) {
          console.error(`❌ Failed to mark PB recommendation #${recId} paid:`, dbErr);
        }

        return;
      }

      const subId = sess.subscription;
      const plan = sess.metadata?.plan;

      let userId = sess.client_reference_id ? Number(sess.client_reference_id) : null;
      if (!userId && sess.customer_email) {
        const [[u]] = await db.query(
          `SELECT id FROM users WHERE email = ? LIMIT 1`,
          [sess.customer_email]
        );
        if (u?.id) userId = u.id;
      }
      if (!userId || !subId) {
        console.warn('checkout.session.completed missing userId or subscription id', sess.id);
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(subId, {
        expand: ['items.data.price'],
      });
      const firstItem = subscription.items?.data?.[0];
      const start =
        firstItem?.current_period_start ||
        subscription.current_period_start ||
        null;
      const end =
        firstItem?.current_period_end ||
        subscription.current_period_end ||
        null;

      if (subscription.status === 'trialing') {
        await recordTrial(
          userId,
          subscription,
          plan ||
            mapStripeIntervalToPlan(firstItem?.price?.recurring?.interval) ||
            'monthly'
        );
      } else if (start && end) {
        await recordPaidCycle(
          userId,
          subscription.id,
          plan ||
            mapStripeIntervalToPlan(firstItem?.price?.recurring?.interval) ||
            'monthly',
          start,
          end
        );
      }

      await db.query(
        `UPDATE users SET is_subscribed = 1, has_addon = 0 WHERE id = ?`,
        [userId]
      );

      await syncUserSubscriptionFlag(userId);
      console.log(
        `Processed checkout.session.completed for user ${userId}, sub ${subId}`
      );

      try {
        const [[user]] = await db.query(
          `SELECT id, email, full_name AS name
             FROM users
            WHERE id = ?
            LIMIT 1`,
          [userId]
        );

        if (user && user.email) {
          const planName =
            plan ||
            mapStripeIntervalToPlan(firstItem?.price?.recurring?.interval) ||
            'monthly';

          await sendWelcomeOnSubscription({
            user,
            planName,
          });
        } else {
          console.warn(
            `Stripe webhook: could not load user ${userId} for welcome email`
          );
        }
      } catch (mailErr) {
        console.error(
          `Stripe webhook: failed to send welcome subscription email for user ${userId}:`,
          mailErr
        );
      }

      return;
    }

    case 'invoice.paid': {
      const inv = event.data.object;
      const subId = inv.subscription;
      const line = inv.lines.data.find((l) => l.plan && l.period);
      if (!subId || !line) return;

      const start = line.period.start;
      const end = line.period.end;

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

      await recordPaidCycle(
        row.user_id,
        subId,
        row.subscription_type,
        start,
        end
      );
      await syncUserSubscriptionFlag(row.user_id);
      console.log(
        `Recorded paid cycle for user ${row.user_id}, sub ${subId}`
      );
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

    case 'payment_link.completed':
    case 'checkout.session.async_payment_succeeded': {
      const recId = event.data.object?.metadata?.recommendation_id;
      if (recId) {
        try {
          await db.query(
            `UPDATE pb_recommendations
             SET payment_status = 'paid',
                 paid_at = NOW()
             WHERE id = ?`,
            [recId]
          );
          console.log(`✅ (async) marked recommendation #${recId} as paid`);
        } catch (err) {
          console.error(`❌ Failed async update for rec_id=${recId}:`, err);
        }
      }
      return;
    }
         // ✅ Handle successful one-time payments
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      const userId = intent.metadata?.user_id;

      if (userId) {
        try {
          await db.query(
            `UPDATE users
               SET one_time_payment_status = 'paid',
                   is_subscribed = 1,
                   updated_at = NOW()
             WHERE id = ?`,
            [userId]
          );
          console.log(`✅ Marked user ${userId} one-time payment as PAID`);
        } catch (err) {
          console.error('❌ DB update failed for payment_intent.succeeded:', err);
        }
      } else {
        console.warn('⚠️ payment_intent.succeeded missing user_id metadata');
      }
      return;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      const userId = intent.metadata?.user_id;

      if (userId) {
        try {
          await db.query(
            `UPDATE users
               SET one_time_payment_status = 'failed',
                   updated_at = NOW()
             WHERE id = ?`,
            [userId]
          );
          console.log(`⚠️ Marked user ${userId} one-time payment as FAILED`);
        } catch (err) {
          console.error('❌ DB update failed for payment_intent.payment_failed:', err);
        }
      } else {
        console.warn('⚠️ payment_intent.payment_failed missing user_id metadata');
      }
      return;
    }

    default:
      console.log('Ignored Stripe event type:', event.type);
      return;
  }
}



module.exports = {
  createOrUpdateSubscriptionSession,
  getBaseProductPrice,
  cancelStripeSubscriptionByUser,
  subscriptionHasBase,
  handleStripeWebhook,
  findUserIdFromSubscriptionObject,
  recordTrial,
  recordPaidCycle,
  ensureStripeCustomer
};
