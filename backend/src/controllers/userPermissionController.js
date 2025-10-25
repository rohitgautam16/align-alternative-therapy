'use strict';

const db = require('../db');

async function userPermissionController(req, res) {
  try {
    const userId = req.user.id;

    const [[user]] = await db.query(
      `SELECT id, user_tier_id, profile_type, is_subscribed
         FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    const [[tier]] = await db.query(
      `SELECT id AS tier_id, name AS tier_name, is_paid, permissions
         FROM user_tiers WHERE id = ? LIMIT 1`,
      [user.user_tier_id]
    );

    let parsedPermissions = {};
    try {
      // handle cases where it's a JSON string, object, or null
      if (typeof tier?.permissions === 'string') {
        parsedPermissions = JSON.parse(tier.permissions);
      } else if (typeof tier?.permissions === 'object' && tier?.permissions !== null) {
        parsedPermissions = tier.permissions;
      }
    } catch (err) {
      console.warn(`⚠️ Failed to parse permissions for tier ${tier?.tier_name}:`, err.message);
    }

    const effectivePermissions = {
      ...parsedPermissions,
      is_subscribed: Boolean(user.is_subscribed),
      profile_type: user.profile_type,
      tier_name: tier?.tier_name || 'unknown',
      is_paid_tier: Boolean(tier?.is_paid),
    };

    res.json({
      user_id: user.id,
      user_tier_id: user.user_tier_id,
      user_tier_name: tier?.tier_name || null,
      profile_type: user.profile_type,
      permissions: effectivePermissions,
      last_synced: new Date().toISOString(),
    });
  } catch (err) {
    console.error('userPermissionController error:', err);
    res.status(500).json({ error: err.message || 'Failed to load permissions' });
  }
}

module.exports = { userPermissionController };
