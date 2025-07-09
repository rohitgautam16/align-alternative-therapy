// src/services/subscriptionService.js
'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db     = require('../db');

/**
 * Create or upgrade a subscription via Stripe Checkout or API.
 */
async function createOrUpdateSubscriptionSession(userId, plan, trial = false) {
  const priceIds = {
    monthly: process.env.STRIPE_PRICE_MONTHLY_ID,
    annual:  process.env.STRIPE_PRICE_ANNUAL_ID,
  };
  if (!priceIds[plan]) throw new Error(`Unknown plan: ${plan}`);

  // 1) Look for an existing active/trialing subscription
  const [rows] = await db.query(
    `SELECT stripe_subscription_id, id AS row_id
       FROM subscriptions
      WHERE user_id = ?
        AND status IN ('active','trialing')
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId]
  );

  // ─── UPGRADE PATH ────────────────────────────────────────────────────────
  if (rows.length) {
    const { stripe_subscription_id: stripeSubId, row_id } = rows[0];
    const subscription = await stripe.subscriptions.retrieve(stripeSubId);
    const itemId       = subscription.items.data[0].id;

    // Swap the price immediately
    const updated = await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: false,
      proration_behavior:   'create_prorations',
      items: [{ id: itemId, price: priceIds[plan] }],
      trial_end:            trial ? undefined : 'now',  // optional immediate activation
    });

    // Immediately update the **existing** row if it’s still trialing
    // or the upcoming period hasn’t been invoiced yet.
    const item = updated.items.data.find(i => i.id === itemId);
    await db.query(
      `UPDATE subscriptions
          SET subscription_type = ?,
              status            = ?,
              updated_at        = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [plan, updated.status, row_id]
    );

    return { type: 'upgrade', subscription: updated };
  }

  // ─── NEW SUBSCRIPTION VIA CHECKOUT (insert trial row) ─────────────────
  const sessionParams = {
    mode: 'subscription',
    customer_email:    await getUserEmail(userId),
    client_reference_id: String(userId),
    metadata:          { plan },
    line_items:        [{ price: priceIds[plan], quantity: 1 }],
    success_url:       `${process.env.FRONTEND_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:        `${process.env.FRONTEND_URL}/subscribe/cancel`,
  };
  if (trial) {
    sessionParams.subscription_data = { trial_period_days: 30 };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { type: 'new', session };
}

/**
 * Record a **trial** subscription row on checkout complete.
 */
async function recordTrial(userId, subscription, plan) {
  const trialStart = subscription.trial_start;
  const trialEnd   = subscription.trial_end;

  await db.query(
    `INSERT INTO subscriptions
       (user_id, stripe_subscription_id, subscription_type, status,
        started_at, expires_at, trial_start_at, trial_end_at,
        created_at, updated_at)
     VALUES (?, ?, 'free_trial', 'trialing',
             FROM_UNIXTIME(?), FROM_UNIXTIME(?),
             FROM_UNIXTIME(?), FROM_UNIXTIME(?),
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [ userId, subscription.id, trialStart, trialEnd, trialStart, trialEnd ]
  );
}

/**
 * Record a **paid** subscription row on each invoice.paid.
 */
async function recordPaidCycle(userId, subscriptionId, plan, periodStart, periodEnd) {
  await db.query(
    `INSERT INTO subscriptions
       (user_id, stripe_subscription_id, subscription_type, status,
        started_at, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, 'active',
             FROM_UNIXTIME(?), FROM_UNIXTIME(?),
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [ userId, subscriptionId, plan, periodStart, periodEnd ]
  );
}

/**
 * Handle incoming Stripe webhooks.
 */

// src/services/subscriptionService.js
async function handleStripeWebhook(event) {
  const type = event.type;
  console.log('🎯 Stripe Webhook Event:', type);

  // 1) Checkout – always insert
  if (type === 'checkout.session.completed') {
    const sess   = event.data.object;
    const userId = sess.client_reference_id;
    const plan   = sess.metadata?.plan;
    const subId  = sess.subscription;

    if (!userId || !plan || !subId) {
      console.warn('⚠️ Missing checkout data:', { userId, plan, subId });
      return;
    }

    // fetch the full subscription
    const subscription = await stripe.subscriptions.retrieve(subId);

    const item = subscription.items.data[0];
    const periodStart = item.current_period_start;
    const periodEnd   = item.current_period_end;

    if (subscription.status === 'trialing' && subscription.trial_start && subscription.trial_end) {
      // true trial
      await recordTrial(userId, subscription, plan);
      console.log('✅ Recorded trial for user:', userId);
    } else {
      // no trial: insert active/pending row immediately
      await recordPaidCycle(userId, subId, plan, periodStart, periodEnd);
      console.log(`✅ Recorded paid-cycle for user: ${userId}`);
    }

    return;
  }

  // 2) invoice.paid → subsequent cycles
  if (type === 'invoice.paid') {
    const inv   = event.data.object;
    const subId = inv.subscription;
    const line  = inv.lines.data.find(l => l.plan && l.period);
    const start = line?.period?.start;
    const end   = line?.period?.end;
    if (!subId || !start || !end) return;

    const [rows] = await db.query(
      `SELECT user_id, subscription_type
         FROM subscriptions
        WHERE stripe_subscription_id = ?
        ORDER BY created_at DESC
        LIMIT 1`,
      [subId]
    );
    if (!rows.length) {
      console.warn(`⚠️ invoice.paid: no existing subscription for ${subId}, skipping`);
      return;
    }
    const { user_id: userId, subscription_type: originalPlan } = rows[0];
    const plan = existingPlanIsRecurring(line.plan) || originalPlan;
    await recordPaidCycle(userId, subId, plan, start, end);
    console.log(`💵 Recorded subsequent paid-cycle for ${subId}`);
    return;
  }

  // 3) subscription.updated / deleted → sync status
  if (
    type === 'customer.subscription.updated' ||
    type === 'customer.subscription.deleted'
  ) {
    const sub = event.data.object;
    await db.query(
      `UPDATE subscriptions
          SET status     = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = ?`,
      [sub.status, sub.id]
    );
    console.log(`🔄 Synced status ${sub.id} → ${sub.status}`);
    return;
  }

  console.log('⚪ Unhandled event type:', type);
}



async function getUserEmail(userId) {
  const [rows] = await db.query(`SELECT email FROM users WHERE id = ?`, [userId]);
  return rows[0]?.email;
}

/**
 * Helper: true if Stripe line item is a recurring price
 */
function existingPlanIsRecurring(planObj) {
  if (planObj.interval === 'month' && planObj.interval_count === 1) return 'monthly';
  if (planObj.interval === 'year'  && planObj.interval_count === 1) return 'annual';
  return null;
}

module.exports = {
  createOrUpdateSubscriptionSession,
  handleStripeWebhook,
};
