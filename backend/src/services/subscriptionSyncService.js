'use strict';
const db = require('../db');

/**
 * Determine whether a user should be treated as subscribed.
 * Rules:
 * - Counts active, trialing, past_due, or cancel_at_period_end subscriptions
 *   that are currently valid (not expired).
 *
 * Updates users.is_subscribed only when it actually changes.
 *
 * Returns: boolean (true = subscribed).
 */
async function syncUserSubscriptionFlag(userId) {
  if (!userId) throw new Error('syncUserSubscriptionFlag requires userId');

  try {
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM subscriptions
       WHERE user_id = ?
         AND (
           (status IN ('active','trialing','past_due') AND (expires_at IS NULL OR expires_at > NOW()))
           OR (cancel_at_period_end = 1 AND (expires_at IS NULL OR expires_at > NOW()))
         )`,
      [userId]
    );

    const count = Number(countRows?.[0]?.cnt || 0);
    const computedFlag = count > 0 ? 1 : 0;

    const [userRows] = await db.query(
      `SELECT is_subscribed FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    const currentFlag = userRows?.[0]?.is_subscribed ? 1 : 0;

    if (currentFlag !== computedFlag) {
      await db.query(
        `UPDATE users SET is_subscribed = ? WHERE id = ?`,
        [computedFlag, userId]
      );
    }

    return Boolean(computedFlag);
  } catch (err) {
    err.message = `syncUserSubscriptionFlag failed for user ${userId}: ${err.message}`;
    throw err;
  }
}

/**
 * Fetch full user record by ID.
 */
async function fetchUserById(userId) {
  if (!userId) return null;
  const [rows] = await db.query(
    `SELECT
       id,
       email,
       full_name,
       status_message,
       active,
       created_at,
       updated_at,
       deleted_at,
       is_subscribed,
       user_roles,
       has_addon
     FROM users
     WHERE id = ?
       AND deleted_at IS NULL`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = { syncUserSubscriptionFlag, fetchUserById };
