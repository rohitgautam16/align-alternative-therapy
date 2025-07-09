// src/services/authService.js
const bcrypt = require('bcrypt');
const db     = require('../db');

async function createUser({ email, password, full_name }) {
  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
     `INSERT INTO users (email, password_hash, full_name, user_roles)
     VALUES (?, ?, ?, 0)`,
    [email, hash, full_name]
  );
  return { id: result.insertId, email, full_name, user_roles: 0 };
}

async function validateUser(email, password) {
  const [rows] = await db.query(
    `SELECT * FROM users
       WHERE email = ? 
       LIMIT 1`,
    [email]
  );
  const user = rows[0];
  if (!user) return null;

  if (user.deleted_at) {
  return { deleted: true, id: user.id, email: user.email };
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return { id: user.id, email: user.email, full_name: user.full_name, user_roles: user.user_roles };
}

/**
 * Store a refresh token in the DB.
 * @param {number} userId 
 * @param {string} token 
 * @param {Date} expiresAt 
 */
async function saveRefreshToken(userId, token, expiresAt) {
  console.log('Attempting DB INSERT into user_refresh_tokens for user:', userId);
  const [result] = await db.query(
    `INSERT INTO user_refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)`,
    [userId, token, expiresAt]
  );
  console.log('DB INSERT result:', result);
}

/**
 * Delete a refresh token from the DB.
 * @param {string} token 
 */
async function deleteRefreshToken(token) {
  await db.query(
    `DELETE FROM user_refresh_tokens WHERE token = ?`,
    [token]
  );
}

/**
 * Find and verify a refresh token.
 * @param {string} token 
 * @returns {object|null} the DB row if found and not expired, otherwise null.
 */
async function findRefreshToken(token) {
  const [rows] = await db.query(
    `SELECT * FROM user_refresh_tokens
       WHERE token = ? 
         AND expires_at > NOW()
       LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

module.exports = {
  createUser,
  validateUser,
  saveRefreshToken,
  deleteRefreshToken,
  findRefreshToken,
};
