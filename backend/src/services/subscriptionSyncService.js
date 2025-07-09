// src/services/subscriptionSyncService.js
const db = require('../db');

/**
 * Check if the user has any active or trialing subscription,
 * and update users.is_subscribed accordingly.
 */
async function syncUserSubscriptionFlag(userId) {
  // Count any non‑expired subscriptions
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) AS count
       FROM subscriptions
      WHERE user_id = ?
        AND status IN ('active','trialing')`,
    [userId]
  );

  const isSubscribed = count > 0 ? 1 : 0;

  await db.query(
    `UPDATE users
        SET is_subscribed = ?
      WHERE id = ?`,
    [isSubscribed, userId]
  );

  return Boolean(isSubscribed);
}

/**
 * Fetch the full user record by ID.
 */
async function fetchUserById(userId) {
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
       user_roles
     FROM users
     WHERE id = ?
       AND deleted_at IS NULL`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = { syncUserSubscriptionFlag, fetchUserById };
