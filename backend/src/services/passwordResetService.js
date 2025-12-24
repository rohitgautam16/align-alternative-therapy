'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../db');

// Helper to hash the reset token
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Create a password reset token (and store hash in DB)
 * @param {string} email - The user email requesting reset
 */
async function createPasswordResetToken(email) {
  const [users] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  const user = users[0];
  if (!user) return null; // Silent fail to prevent email enumeration

  const rawToken = crypto.randomBytes(32).toString('hex'); // random token
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, tokenHash, expiresAt]
  );

  return { rawToken, userId: user.id, expiresAt };
}

/**
 * Verify a token and return the associated user (if valid)
 * @param {string} rawToken - The token from URL
 */
async function verifyResetToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const [rows] = await db.query(
    `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

/**
 * Reset user password after verifying token
 * @param {string} rawToken
 * @param {string} newPassword
 */
async function resetPassword(rawToken, newPassword) {
  const valid = await verifyResetToken(rawToken);
  if (!valid) return null;

  const hash = await bcrypt.hash(newPassword, 10);

  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [
    hash,
    valid.user_id,
  ]);

  // Mark token as used
  const tokenHash = hashToken(rawToken);
  await db.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?', [
    tokenHash,
  ]);

  return { success: true, userId: valid.user_id };
}

module.exports = {
  createPasswordResetToken,
  verifyResetToken,
  resetPassword,
};
