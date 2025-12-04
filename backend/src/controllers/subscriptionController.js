'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

const {
  createOrUpdateSubscriptionSession,
  handleStripeWebhook,
  subscriptionHasBase,
  findUserIdFromSubscriptionObject,
} = require('../services/subscriptionService');
const { sendWelcomeOnSubscription } = require('../server/mail/emailService');
const { getProductPriceMap } = require('../services/stripePriceCache');
const { syncUserSubscriptionFlag } = require('../services/subscriptionSyncService');


async function checkoutController(req, res) {
  try {
    const { plan, trial, promoCode } = req.body;  // ← pick up promoCode from UI
    const userId = req.user.id;

    const result = await createOrUpdateSubscriptionSession(
      userId,
      plan,
      Boolean(trial),
      promoCode ? promoCode.trim() : null  // ← send promo to backend service
    );

    // If this triggered a new checkout session → return session URL
    if (result.type && String(result.type).startsWith("new")) {
      return res.json({ url: result.session.url });
    }

    console.log(
      `✅ Subscription handled for user=${userId}, type=${result.type}, promoCode=${promoCode || "none"}`
    );

    return res.json({
      subscription: result.subscription,
      type: result.type,
    });

  } catch (err) {
    console.error("checkoutController error:", err);
    return res.status(500).json({ error: err.message || "Checkout failed" });
  }
}



async function webhookController(req, res) {
  console.log('⚡ Webhook hit at', new Date().toISOString());
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Constructed Stripe event:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency
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
    await handleStripeWebhook(event);

    await db.query(
      `UPDATE webhook_events SET processed = 1, processed_at = NOW() WHERE event_id = ?`,
      [event.id]
    );

    return res.status(200).send('ok');
  } catch (handlerErr) {
    console.error('Webhook handling error:', handlerErr);
    await db.query(
      `UPDATE webhook_events SET attempt_count = attempt_count + 1, error = ? WHERE event_id = ?`,
      [String(handlerErr.message || handlerErr), event.id]
    );
    return res.status(500).send('error');
  }
}

async function cancelSubscriptionController(req, res) {
  try {
    const userId = req.user.id;
    const { subscriptionId, immediate = false } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });

    // Verify ownership
    const [rows] = await db.query(
      `SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ? ORDER BY created_at DESC LIMIT 1`,
      [subscriptionId]
    );
    let ownerRow = rows[0];

    if (!ownerRow) {
      const subForOwner = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['customer'] });
      const resolvedUserId = await findUserIdFromSubscriptionObject(subForOwner);
      if (!resolvedUserId || resolvedUserId !== userId) {
        return res.status(403).json({ error: 'Subscription not found for user' });
      }
    } else if (ownerRow.user_id !== userId) {
      return res.status(403).json({ error: 'Subscription not found for user' });
    }

    // Retrieve live subscription
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
    } catch (err) {
      console.warn('Failed to retrieve subscription for cancel operation:', err.message);
    }

    const hadBase = subscription ? await subscriptionHasBase(subscription) : false;
    let stripeResult;

    if (immediate) {
      try {
        if (typeof stripe.subscriptions.del === 'function') {
          stripeResult = await stripe.subscriptions.del(subscriptionId);
        } else if (typeof stripe.subscriptions.cancel === 'function') {
          stripeResult = await stripe.subscriptions.cancel(subscriptionId);
        } else {
          const nowUnix = Math.floor(Date.now() / 1000);
          stripeResult = await stripe.subscriptions.update(subscriptionId, { cancel_at: nowUnix });
        }
      } catch (err) {
        console.error('Immediate cancel via Stripe failed:', err);
        return res.status(500).json({ error: 'Stripe cancel failed' });
      }

      const returnedStatus = stripeResult?.status || 'canceled';
      await db.query(
        `UPDATE subscriptions
           SET status = ?, expires_at = NOW(), updated_at = CURRENT_TIMESTAMP
         WHERE stripe_subscription_id = ?`,
        [returnedStatus, subscriptionId]
      );
    } else {
      let updated;
      try {
        updated = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      } catch (err) {
        console.error('Scheduled cancel via Stripe failed:', err);
        return res.status(500).json({ error: 'Stripe scheduled cancel failed' });
      }

      const cancelAt = updated.cancel_at || null;
      const currentPeriodEnd = updated.current_period_end || null;

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

    // Update user subscription flag
    await syncUserSubscriptionFlag(userId);

    return res.json({ ok: true, subscription: stripeResult });
  } catch (err) {
    console.error('cancelSubscriptionController error:', err);
    return res.status(500).json({ error: err.message || 'Cancel failed' });
  }
}

/**
 * GET /api/subscribe/summary
 */
async function subscriptionSummaryController(req, res) {
  try {
    const userId = req.user.id;

    // Always fetch base user info (for tier + profile_type)
    const [[userRow]] = await db.query(
      `SELECT id, user_tier_id, profile_type FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    // Set strict no-cache headers
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Vary', 'Cookie');

    // -------------------------------------------------------
    // 🟣 Fetch user_tier info safely (for all cases)
    // -------------------------------------------------------
    let tier = null;
    if (userRow?.user_tier_id) {
      const [[tierRow]] = await db.query(
        `SELECT id AS tier_id, name AS tier_name, is_paid, permissions
           FROM user_tiers
          WHERE id = ? LIMIT 1`,
        [userRow.user_tier_id]
      );
      if (tierRow) {
        let parsedPermissions = {};
        try {
          parsedPermissions =
            typeof tierRow.permissions === 'string'
              ? JSON.parse(tierRow.permissions)
              : tierRow.permissions || {};
        } catch (err) {
          console.warn('⚠️ Failed to parse user_tiers.permissions JSON:', err.message);
          parsedPermissions = {};
        }

        tier = {
          id: tierRow.tier_id,
          name: tierRow.tier_name,
          is_paid: Boolean(tierRow.is_paid),
          permissions: parsedPermissions,
        };
      }
    }

    // -------------------------------------------------------
    // 🟣 No active Stripe subscription
    // -------------------------------------------------------
    const [[row]] = await db.query(
      `SELECT id, stripe_subscription_id, status, cancel_at
         FROM subscriptions
        WHERE user_id = ?
        ORDER BY 
          CASE WHEN status IN ('active','trialing','past_due') THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT 1`,
      [userId]
    );

    if (!row || !row.stripe_subscription_id) {
      return res.json({
        hasSubscription: false,
        status: 'none',
        plan: null,
        subscriptionId: null,
        isEntitled: false,
        baseEntitled: false,
        profile_type: userRow?.profile_type ?? 'free',
        user_tier_id: userRow?.user_tier_id ?? null,
        user_tier: tier,
        summaryRetrievedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------
    // 🟢 Active Stripe subscription
    // -------------------------------------------------------
    const priceMap = await getProductPriceMap();
    const basePriceIds = new Set(Object.values(priceMap.base.prices).filter(Boolean));

    let sub;
    try {
      sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id, {
        expand: ['items.data.price.product'],
      });
    } catch (err) {
      if (err.code === 'resource_missing' || err.statusCode === 404) {
        await db.query(
          `UPDATE subscriptions
             SET status = 'deleted', stripe_subscription_id = NULL, updated_at = NOW()
           WHERE id = ?`,
          [row.id]
        );

        return res.json({
          hasSubscription: false,
          status: 'none',
          plan: null,
          subscriptionId: null,
          isEntitled: false,
          baseEntitled: false,
          profile_type: userRow?.profile_type ?? 'free',
          user_tier_id: userRow?.user_tier_id ?? null,
          user_tier: tier,
          summaryRetrievedAt: new Date().toISOString(),
        });
      }
      throw err;
    }

    // Extract data from Stripe
    const items = Array.isArray(sub.items?.data) ? sub.items.data : [];
    const baseItem = items.find((i) => basePriceIds.has(i.price?.id));

    const plan =
      baseItem?.price?.recurring?.interval === 'month'
        ? 'monthly'
        : baseItem?.price?.recurring?.interval === 'year'
        ? 'annual'
        : null;

    const currency = items[0]?.price?.currency?.toUpperCase?.() || 'USD';
    const totalUnit = items.reduce((sum, i) => sum + (i.price?.unit_amount ?? 0), 0);

    const nowSec = Math.floor(Date.now() / 1000);
    const entitledStatuses = new Set(['active', 'trialing', 'past_due']);
    const stripeCPE = Number(sub.current_period_end) || null;
    const dbCancelAtSec = row.cancel_at ? Math.floor(new Date(row.cancel_at).getTime() / 1000) : null;

    const stillWithinPaidPeriod =
      (typeof stripeCPE === 'number' && stripeCPE > nowSec) ||
      (typeof dbCancelAtSec === 'number' && dbCancelAtSec > nowSec);

    const isEntitled =
      entitledStatuses.has(sub.status) || (sub.status === 'canceled' && stillWithinPaidPeriod);

    const baseEntitled = Boolean(isEntitled && baseItem);

    // -------------------------------------------------------
    // ✅ Final Response
    // -------------------------------------------------------
    res.json({
      hasSubscription: true,
      subscriptionId: sub.id,
      status: sub.status,
      plan,
      isEntitled,
      baseEntitled,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      cancelAt: sub.cancel_at
        ? new Date(sub.cancel_at * 1000).toISOString()
        : row.cancel_at || null,
      currentPeriodEnd: stripeCPE
        ? new Date(stripeCPE * 1000).toISOString()
        : row.cancel_at || null,
      currency,
      totalUnitAmount: totalUnit,
      totalFormatted: `${(totalUnit / 100).toFixed(2)} ${currency}`,
      lineItems: items.map((i) => ({
        id: i.id,
        priceId: i.price?.id,
        product: i.price?.product,
        product_name:
          i.price?.product && typeof i.price.product === 'object'
            ? i.price.product.name
            : null,
        nickname: i.price?.nickname,
        interval: i.price?.recurring?.interval,
        amount: i.price?.unit_amount,
      })),
      // 🆕 User + tier details
      profile_type: userRow?.profile_type ?? 'free',
      user_tier_id: userRow?.user_tier_id ?? null,
      user_tier: tier,
      summaryRetrievedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('subscriptionSummaryController error:', err);
    res.status(500).json({ error: err.message || 'Failed to load subscription summary' });
  }
}



async function createBillingPortalSession(req, res) {
  try {
    const userId = req.user.id;

    const [[user]] = await db.query(
      `SELECT stripe_customer_id, stripe_subscription_id FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    let customerId = user?.stripe_customer_id;

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

async function repairStripeLinksController(req, res) {
  try {
    if (!req.user || req.user.user_roles !== 1) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [subs] = await db.query(`
      SELECT id, user_id, stripe_subscription_id, status
      FROM subscriptions
      WHERE stripe_subscription_id IS NOT NULL
    `);

    let repaired = 0;
    let markedInactive = 0;
    let customerFixed = 0;
    const report = [];

    for (const sub of subs) {
      const { id, user_id, stripe_subscription_id } = sub;

      try {
        const stripeSub = await stripe.subscriptions.retrieve(stripe_subscription_id);
        const stripeCustomer = stripeSub.customer;

        // Ensure customer is linked to user table
        const [[user]] = await db.query(
          `SELECT stripe_customer_id FROM users WHERE id = ?`,
          [user_id]
        );
        if (!user?.stripe_customer_id && stripeCustomer) {
          await db.query(
            `UPDATE users SET stripe_customer_id = ? WHERE id = ?`,
            [stripeCustomer, user_id]
          );
          customerFixed++;
        }

        // Ensure subscription status matches Stripe
        await db.query(
          `UPDATE subscriptions SET status = ?, cancel_at = ?, updated_at = NOW() WHERE id = ?`,
          [
            stripeSub.status,
            stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000) : null,
            id
          ]
        );

        repaired++;
      } catch (err) {
        if (err.code === 'resource_missing') {
          // Subscription no longer exists on Stripe — mark inactive
          await db.query(
            `UPDATE subscriptions SET status = 'deleted', updated_at = NOW() WHERE id = ?`,
            [id]
          );
          markedInactive++;
          report.push({
            user_id,
            stripe_subscription_id,
            reason: 'Not found on Stripe (resource_missing)'
          });
        } else {
          console.error('Stripe API error:', err);
          report.push({
            user_id,
            stripe_subscription_id,
            reason: err.message
          });
        }
      }
    }

    res.json({
      ok: true,
      summary: {
        totalChecked: subs.length,
        repaired,
        markedInactive,
        customerFixed,
      },
      report
    });
  } catch (err) {
    console.error('repairStripeLinksController error:', err);
    res.status(500).json({ error: 'Repair operation failed' });
  }
}

module.exports = {
  checkoutController,
  webhookController,
  cancelSubscriptionController,
  subscriptionSummaryController,
  createBillingPortalSession,
  repairStripeLinksController
};
