'use strict';

const bcrypt = require('bcrypt');
const db = require('../.././db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ensureStripeCustomer, getBaseProductPrice, cancelStripeSubscriptionByUser, createOrUpdateSubscriptionSession } = require('../subscriptionService');
const { syncUserSubscriptionFlag } = require('../subscriptionSyncService');

// -----------------------------
// Helper: default currency
// -----------------------------
const DEFAULT_CURRENCY = (process.env.STRIPE_DEFAULT_CURRENCY || 'CAD').toLowerCase();

// -----------------------------
// Generate or reuse one-time Checkout Session
// - idempotent: reuse pending session if present
// - returns: { paymentLinkId, paymentIntentId, url }
// -----------------------------
async function generateOneTimePaymentLink(userId, amount) {
  if (!userId) throw new Error('userId required');
  if (!amount || Number(amount) <= 0) throw new Error('amount must be > 0');

  const priceInCents = Math.round(Number(amount) * 100);
  const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'cad';

  try {
    // Check for an existing pending Payment Link to reuse
    const [[existingRow]] = await db.query(
      `SELECT stripe_payment_link_id, one_time_payment_status
         FROM users
        WHERE id = ? LIMIT 1`,
      [userId]
    );

    const existingLinkId = existingRow?.stripe_payment_link_id;
    const existingStatus = existingRow?.one_time_payment_status;

    if (existingLinkId && existingStatus === 'pending') {
      try {
        const existingLink = await stripe.paymentLinks.retrieve(existingLinkId);
        if (existingLink && existingLink.url) {
          console.log(`♻️ Reusing existing pending Payment Link for user ${userId}: ${existingLinkId}`);
          return {
            paymentLinkId: existingLink.id,
            paymentIntentId: null,
            url: existingLink.url,
          };
        }
      } catch (err) {
        console.warn(`⚠️ Could not retrieve existing Payment Link ${existingLinkId}:`, err.message);
      }
    }

    const product = await stripe.products.create({
      name: `Recommendation Access for User ${userId}`,
      metadata: { type: 'recommendations_only', user_id: String(userId) },
    });

    const price = await stripe.prices.create({
      unit_amount: priceInCents,
      currency: DEFAULT_CURRENCY,
      product: product.id,
    });

    // Persistent Payment Link (never expires)
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: 'redirect',
        redirect: { url: `${process.env.FRONTEND_URL}/login` },
      },
      metadata: {
        user_id: String(userId),
        purpose: 'recommendation_joining_fee',
      },
    });

    console.log(`✅ Created new Payment Link ${paymentLink.id} for user ${userId}`);

    return {
      paymentLinkId: paymentLink.id,
      paymentIntentId: null,
      url: paymentLink.url,
    };
  } catch (err) {
    console.error('❌ generateOneTimePaymentLink error:', err);
    throw err;
  }
}


// -----------------------------
// Existing list/admin functions (unchanged behavior)
// -----------------------------
async function listAdmins({ page = 1, pageSize = 20 } = {}) {
  page = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  const countPromise = db.query(
    `SELECT COUNT(*) AS total
       FROM users
      WHERE deleted_at IS NULL
        AND user_roles = 1`
  );

  const dataPromise = db.query(
    `SELECT
       id, email, full_name, user_roles, active, status_message,
       created_at, updated_at, is_subscribed
     FROM users
     WHERE deleted_at IS NULL
       AND user_roles = 1
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );

  const [[{ total }], [rows]] = await Promise.all([countPromise, dataPromise]);
  return { data: rows, total, page, pageSize };
}

async function listUsers({ page = 1, pageSize = 20, search = '' } = {}) {
  page = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE deleted_at IS NULL';
  const queryParams = [];

  if (search && search.trim()) {
    whereClause += ` AND (full_name LIKE ? OR email LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    queryParams.push(searchPattern, searchPattern);
  }

  const countQuery = `SELECT COUNT(*) AS total FROM users ${whereClause}`;
  const countPromise = db.query(countQuery, queryParams);

  const dataPromise = db.query(
    `SELECT
       id, email, full_name, user_roles, active, status_message,
       created_at, updated_at, is_subscribed
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...queryParams, pageSize, offset]
  );

  const [countResult, dataResult] = await Promise.all([countPromise, dataPromise]);

  const total = countResult[0]?.[0]?.total || countResult[0]?.total || 0;
  const rows = dataResult[0] || dataResult;

  return { data: rows, total, page, pageSize };
}

async function listRecommendedUsers({ page = 1, pageSize = 20 } = {}) {
  page = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  const countPromise = db.query(
    `SELECT COUNT(DISTINCT user_id) AS total
       FROM pb_recommendations
      WHERE user_id IS NOT NULL`
  );

  const dataPromise = db.query(
    `SELECT 
       u.id,
       u.email,
       u.full_name,
       u.user_roles,
       u.active,
       u.status_message,
       u.created_at,
       u.updated_at,
       u.is_subscribed,
       COALESCE(r.recommendation_count, 0) AS recommendation_count
     FROM users u
     INNER JOIN (
       SELECT user_id, COUNT(*) AS recommendation_count
         FROM pb_recommendations
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        ORDER BY MAX(created_at) DESC
        LIMIT ? OFFSET ?
     ) r ON u.id = r.user_id
     WHERE u.deleted_at IS NULL
     ORDER BY u.created_at DESC`,
    [pageSize, offset]
  );

  const [[{ total }], [rows]] = await Promise.all([countPromise, dataPromise]);
  return { data: rows, total, page, pageSize };
}

// -----------------------------
// Get user by id (includes new columns)
// -----------------------------
async function getUserById(id) {
  const [rows] = await db.query(
    `SELECT id, email, full_name, user_roles, active, status_message,
            created_at, updated_at, deleted_at, is_subscribed,
            user_tier_id, profile_type, one_time_fee_amount,
            one_time_payment_status, stripe_payment_link_id
       FROM users
      WHERE id = ?`,
    [id]
  );
  return rows[0];
}

// -----------------------------
// Create user (with optional one-time link)
// -----------------------------
async function createUserAdmin({
  email,
  password,
  full_name,
  user_roles,
  active,
  status_message,
  profile_type = 'free',
  user_tier_id = null,
  one_time_fee_amount = null,
  premium_option = null, // 'checkout', 'trial', 'free_access'
  plan = 'monthly',      // used for premium upgrades (optional)
}) {
  console.log('🟡 Incoming payload:', {
    email,
    full_name,
    profile_type,
    one_time_fee_amount,
    premium_option,
    plan,
  });

  const password_hash = await bcrypt.hash(password, 10);

  // ✅ Auto-map tier IDs
  const tierMap = { free: 1, recommendations_only: 2, premium_full: 3 };
  const resolvedTierId = user_tier_id ?? tierMap[profile_type] ?? 1;

  // ✅ Create base user record
  const [result] = await db.query(
    `INSERT INTO users
       (email, password_hash, full_name, user_roles, active, status_message,
        profile_type, user_tier_id, one_time_fee_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      email,
      password_hash,
      full_name,
      user_roles || 0,
      active ?? 1,
      status_message || null,
      profile_type,
      resolvedTierId,
      one_time_fee_amount,
    ]
  );

  const userId = result.insertId;
  console.log(`✅ User created with ID: ${userId}, Tier: ${resolvedTierId}`);

  // ----------------------------------------------------------
  // 🟢 SPECIAL HANDLING for PREMIUM_FULL on creation
  // ----------------------------------------------------------
  // inside createUserAdmin()
if (profile_type === 'premium_full') {
  try {
    switch (premium_option) {
      // 1️⃣ Regular Stripe Checkout (base plan) – returns checkout URL
      case 'checkout': {
        console.log('💳 Creating Stripe checkout session for premium_full user (admin)...');
        const result = await createOrUpdateSubscriptionSession(userId, plan);
        if (result?.session?.url) {
          await db.query(
            `UPDATE users
               SET is_subscribed = 1,
                   one_time_payment_status = 'completed',
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [userId]
          );
          const user = await getUserById(userId);
          return { ...user, checkout_url: result.session.url };
        }
        break;
      }

      // 2️⃣ 30-day free trial (via checkout link with trial)
      case 'trial': {
  console.log('🎁 Creating 30-day trial checkout session for premium_full user...');

  // 1️⃣ Create Stripe checkout session for trial
  const result = await createOrUpdateSubscriptionSession(userId, plan, true);

  if (result?.session?.url) {
    // 2️⃣ Fetch user info (no immediate DB trial subscription update)
    const user = await getUserById(userId);

    console.log(`🎯 Trial checkout session created for admin user ${userId}. Waiting for Stripe webhook to finalize trial.`);

    // 3️⃣ Return user info + checkout URL so frontend/admin can redirect
    return { ...user, checkout_url: result.session.url };
  } else {
    console.warn(`❌ Failed to create trial checkout for admin user ${userId}`);
  }
  break;
}


      // 3️⃣ Admin-granted 0$ access (direct subscription)
      case 'free_access': {
        console.log('🏆 Granting free premium access for user:', userId);
        const FREE_PRICE_ID = process.env.STRIPE_FREE_PREMIUM_PRICE_ID;
        if (!FREE_PRICE_ID)
          throw new Error('Missing STRIPE_FREE_PREMIUM_PRICE_ID in env');

        const customerId = await ensureStripeCustomer(userId, email);
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: FREE_PRICE_ID }],
          metadata: { granted_by: 'admin', reason: 'free_access' },
        });

        await db.query(
          `UPDATE users
             SET is_subscribed = 1,
                 profile_type = 'premium_full',
                 user_tier_id = 3,
                 stripe_subscription_id = ?,
                 one_time_fee_amount = 0,
                 one_time_payment_status = 'granted',
                 updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [subscription.id, userId]
        );

        await syncUserSubscriptionFlag(userId);

        const user = await getUserById(userId);
        user.note = 'Free premium granted via $0 price subscription';
        return user;
      }

      default:
        console.log('ℹ️ No premium option selected; created as premium_full inactive.');
        break;
    }
  } catch (err) {
    console.error('❌ Premium setup failed:', err);
    const user = await getUserById(userId);
    user.error = err.message;
    return user;
  }
}


  // ----------------------------------------------------------
  // 🟣 Normal flow for Recommendations Only users
  // ----------------------------------------------------------
  if (profile_type === 'recommendations_only' && one_time_fee_amount) {
    try {
      console.log('🟢 Creating one-time Stripe payment link...');
      const paymentData = await generateOneTimePaymentLink(userId, one_time_fee_amount);

      await db.query(
        `UPDATE users
           SET one_time_fee_amount = ?,
               stripe_payment_link_id = ?,
               stripe_payment_intent_id = ?,
               one_time_payment_status = 'joining fee paid',
               updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          one_time_fee_amount,
          paymentData.paymentLinkId,
          paymentData.paymentIntentId,
          userId,
        ]
      );

      console.log('✅ Stripe payment link stored and joining fee marked as paid.');

      await syncUserSubscriptionFlag(userId);

      console.log('✅ Payment link stored in DB.');
      const user = await getUserById(userId);
      return { ...user, checkout_url: paymentData.url };

    } catch (err) {
      console.error('❌ Failed to generate Stripe link:', err);
      const user = await getUserById(userId);
      return user;
    }
  }

  // ----------------------------------------------------------
  // 🟣 Default (free or non-premium) path
  // ----------------------------------------------------------
  return getUserById(userId);
}



async function updateUserAdmin(
  id,
  {
    full_name,
    status_message,
    user_roles,
    active,
    is_subscribed,
    profile_type,
    user_tier_id,
    one_time_fee_amount,
    plan,             // 'monthly' | 'annual'
    premium_option,   // 'checkout' | 'trial' | 'free_access'
  }
) {
  const existing = await getUserById(id);
  if (!existing) throw new Error(`User not found (id=${id})`);

  const profileToTier = { free: 1, recommendations_only: 2, premium_full: 3 };
  const final_user_tier_id =
    user_tier_id ??
    profileToTier[profile_type || existing.profile_type] ??
    existing.user_tier_id;

  await db.query(
    `UPDATE users
       SET full_name = ?,
           status_message = ?,
           user_roles = ?,
           active = ?,
           is_subscribed = ?,
           profile_type = ?,
           user_tier_id = ?,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      full_name ?? existing.full_name,
      status_message ?? existing.status_message,
      user_roles ?? existing.user_roles,
      active ?? existing.active,
      is_subscribed ?? existing.is_subscribed,
      profile_type ?? existing.profile_type,
      final_user_tier_id,
      id,
    ]
  );

  const fromType = existing.profile_type;
  const toType = profile_type ?? existing.profile_type;
  let checkout_url = null;

  if (fromType !== toType) {
    console.log(`🔄 Tier change: ${fromType} → ${toType}`);

    switch (true) {
      // ⬆️ UPGRADE to premium_full
      case ['recommendations_only', 'free'].includes(fromType) &&
        toType === 'premium_full': {
        if (!plan) throw new Error('plan (monthly|annual) required for premium upgrade');
        if (!premium_option)
          throw new Error('premium_option (checkout | trial | free_access) required for upgrade');

        await db.query(
          `UPDATE users
             SET one_time_payment_status = 'converted',
                 stripe_payment_link_id = NULL,
                 stripe_payment_intent_id = NULL,
                 one_time_fee_amount = NULL
           WHERE id = ?`,
          [id]
        );

        try {
          switch (premium_option) {
            // 1️⃣ Normal paid checkout
            case 'checkout': {
              console.log('💳 Creating Stripe checkout session for premium upgrade...');
              const result = await createOrUpdateSubscriptionSession(id, plan);
              checkout_url = result?.session?.url || null;
              break;
            }

            // 2️⃣ 30-day free trial checkout
            case 'trial': {
              console.log('🎁 Creating 30-day free trial checkout session...');
              const result = await createOrUpdateSubscriptionSession(id, plan, true);
              checkout_url = result?.session?.url || null;
              break;
            }

            // 3️⃣ Admin-granted $0 subscription
            case 'free_access': {
              console.log('🏆 Granting free premium access...');
              const FREE_PRICE_ID = process.env.STRIPE_FREE_PREMIUM_PRICE_ID;
              if (!FREE_PRICE_ID)
                throw new Error('Missing STRIPE_FREE_PREMIUM_PRICE_ID in env');

              const customerId = await ensureStripeCustomer(id, existing.email);

              const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: FREE_PRICE_ID }],
                metadata: { granted_by: 'admin', reason: 'free_access' },
              });

              await db.query(
                `UPDATE users
                   SET is_subscribed = 1,
                       profile_type = 'premium_full',
                       user_tier_id = 3,
                       stripe_subscription_id = ?,
                       one_time_fee_amount = 0,
                       one_time_payment_status = 'granted',
                       updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [subscription.id, id]
              );

              await syncUserSubscriptionFlag(id);
              break;
            }

            default:
              throw new Error(`Unknown premium_option: ${premium_option}`);
          }

          await db.query(
            `UPDATE users
               SET is_subscribed = 1,
                   profile_type = 'premium_full',
                   user_tier_id = 3,
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
          );

          console.log(`✅ Premium upgrade (${premium_option}) successful for user=${id}`);
        } catch (err) {
          console.error('❌ Premium upgrade failed:', err.message);
          throw err;
        }
        break;
      }

      // ⬇️ Downgrade: premium → rec_only
      case fromType === 'premium_full' && toType === 'recommendations_only': {
        try {
          await cancelStripeSubscriptionByUser(id);

          const amount = one_time_fee_amount || existing.one_time_fee_amount || 499;
          const priceInCents = Math.round(Number(amount) * 100);
          const DEFAULT_CURRENCY = process.env.STRIPE_DEFAULT_CURRENCY || 'cad';

          const product = await stripe.products.create({
            name: `Recommendation Access for User ${id}`,
            metadata: { type: 'recommendations_only', user_id: String(id) },
          });

          const price = await stripe.prices.create({
            unit_amount: priceInCents,
            currency: DEFAULT_CURRENCY,
            product: product.id,
          });

          const paymentLink = await stripe.paymentLinks.create({
            line_items: [{ price: price.id, quantity: 1 }],
            after_completion: {
              type: 'redirect',
              redirect: { url: `${process.env.FRONTEND_URL}/payment/success` },
            },
            metadata: {
              user_id: String(id),
              purpose: 'recommendation_joining_fee',
            },
          });

          checkout_url = paymentLink.url;

          await db.query(
            `UPDATE users
               SET is_subscribed = 0,
                   one_time_fee_amount = ?,
                   stripe_payment_link_id = ?,
                   one_time_payment_status = 'joining fee paid',
                   user_tier_id = 2,
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [amount, paymentLink.id, id]
          );

          const isSubscribed = await syncUserSubscriptionFlag(id);
          console.log(`✅ Synced subscription flag for user=${id}, is_subscribed=${isSubscribed}`);

          console.log(`✅ Downgraded premium → rec_only using Payment Link for user=${id}`);
        } catch (err) {
          console.error('❌ Downgrade to rec_only failed:', err.message);
          throw err;
        }
        break;
      }

      // ⬇️ Downgrade: any paid → free
      case ['premium_full', 'recommendations_only'].includes(fromType) &&
        toType === 'free': {
        try {
          await cancelStripeSubscriptionByUser(id);
        } catch (err) {
          console.warn('⚠️ No active subscription to cancel:', err.message);
        }

        await db.query(
          `UPDATE users
             SET is_subscribed = 0,
                 one_time_fee_amount = NULL,
                 stripe_payment_link_id = NULL,
                 stripe_payment_intent_id = NULL,
                 one_time_payment_status = NULL,
                 user_tier_id = 1,
                 updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [id]
        );

        console.log(`✅ Downgraded to free for user=${id}`);
        break;
      }

      // ⬆️ Upgrade: free → recommendations_only
      case fromType === 'free' && toType === 'recommendations_only': {
        const amount = one_time_fee_amount || existing.one_time_fee_amount || 499;
        const priceInCents = Math.round(Number(amount) * 100);
        const DEFAULT_CURRENCY = process.env.STRIPE_DEFAULT_CURRENCY || 'cad';

        const product = await stripe.products.create({
          name: `Recommendation Access for User ${id}`,
          metadata: { type: 'recommendations_only', user_id: String(id) },
        });

        const price = await stripe.prices.create({
          unit_amount: priceInCents,
          currency: DEFAULT_CURRENCY,
          product: product.id,
        });

        const paymentLink = await stripe.paymentLinks.create({
          line_items: [{ price: price.id, quantity: 1 }],
          after_completion: {
            type: 'redirect',
            redirect: { url: `${process.env.FRONTEND_URL}/payment/success` },
          },
          metadata: {
            user_id: String(id),
            purpose: 'recommendation_joining_fee',
          },
        });

        await db.query(
          `UPDATE users
            SET is_subscribed = 0,
                one_time_fee_amount = ?,
                stripe_payment_link_id = ?,
                one_time_payment_status = 'joining fee paid',
                user_tier_id = 2,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [amount, paymentLink.id, id]
        );

        checkout_url = paymentLink.url;

        const isSubscribed = await syncUserSubscriptionFlag(id);
        console.log(`✅ Synced subscription flag for user=${id}, is_subscribed=${isSubscribed}`);

        console.log(`✅ Upgraded free → rec_only with Payment Link for user=${id}`);
        break;
      }


      default:
        break;
    }
  }

  const updatedUser = await getUserById(id);
  if (checkout_url) updatedUser.checkout_url = checkout_url;
  return updatedUser;
}




// -----------------------------
// Soft delete
// -----------------------------
async function deleteUserAdmin(id, requestIp) {
  await db.query(
    `UPDATE users
       SET deleted_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id]
  );

  await db.query(
    `INSERT INTO user_deletion_requests
       (user_id, request_ip)
     VALUES (?, ?)`,
    [id, requestIp]
  );
}

// -----------------------------
// Exports
// -----------------------------
module.exports = {
  listAdmins,
  listUsers,
  listRecommendedUsers,
  getUserById,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  // expose helper for tests if needed:
  generateOneTimePaymentLink,
};
