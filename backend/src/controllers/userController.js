// src/controllers/userController.js
const db = require('../db');

async function getProfile(req, res) {
  const userId = req.user.id;

  const [rows] = await db.query(
    `SELECT
       id,
       email,
       full_name,
       user_roles,
       status_message,
       created_at
     FROM users
     WHERE id = ?
       AND deleted_at IS NULL
     LIMIT 1`,
    [userId]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(rows[0]);
}


async function updateProfile(req, res) {
  const userId = req.user.id;
  const { full_name, status_message } = req.body;

  await db.query(
    `UPDATE users SET full_name = ?, status_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [full_name, status_message, userId]
  );

  res.json({ success: true });
}

async function deleteAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const ip     = req.ip;

    // 1) mark deleted
    await db.query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [userId]
    );
    // 2) log deletion
    await db.query(
      `INSERT INTO user_deletion_requests (user_id, request_ip) VALUES (?, ?)`,
      [userId, ip]
    );

    // clear refresh cookie
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'Strict' });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Restore within retention window
async function restoreAccount(req, res, next) {
  try {
    const userId = req.user.id;
    // Check deletion request exists and not yet restored
    const [rows] = await db.query(
      `SELECT * FROM user_deletion_requests
         WHERE user_id = ? AND restored_at IS NULL
           AND requested_at >= NOW() - INTERVAL 30 DAY`,
      [userId]
    );
    if (!rows.length) {
      return res.status(400).json({ error: 'Cannot restore: retention window passed or not deleted' });
    }

    // 1) clear deleted_at
    await db.query(
      `UPDATE users SET deleted_at = NULL WHERE id = ?`,
      [userId]
    );
    // 2) mark restored_at
    await db.query(
      `UPDATE user_deletion_requests
         SET restored_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      [rows[0].id]
    );
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  restoreAccount,
};
