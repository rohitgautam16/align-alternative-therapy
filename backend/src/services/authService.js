// src/services/authService.js
const bcrypt = require('bcrypt');
const db     = require('../db');
const crypto = require('crypto');


const MAX_ACTIVE_SESSIONS = Number(process.env.MAX_ACTIVE_SESSIONS || 2);

function hashRefreshToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}


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
async function saveRefreshToken(userId, token, expiresAt = null) {
  if (!expiresAt) {
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const [result] = await db.query(
    `INSERT INTO user_refresh_tokens (user_id, token, expires_at)
     VALUES (?, ?, ?)`,
    [userId, token, expiresAt]
  );
  return result;
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
 * Delete *all* refresh tokens for a user (used on token reuse detection)
 * @param {number} userId
 */
async function deleteRefreshTokensForUser(userId) {
  return db.query(
    `DELETE FROM user_refresh_tokens WHERE user_id = ?`,
    [userId]
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


/**
 * Get active sessions for a user (oldest first)
 */
async function getActiveSessions(userId) {
  const [rows] = await db.query(
    `SELECT id
     FROM user_refresh_tokens
     WHERE user_id = ?
       AND revoked_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at ASC`,
    [userId]
  );
  return rows;
}

/**
 * Soft revoke sessions by ids
 */
async function revokeSessionsByIds(ids, conn = db) {
  if (!ids.length) return;
  await conn.query(
    `UPDATE user_refresh_tokens
     SET revoked_at = NOW()
     WHERE id IN (?)`,
    [ids]
  );
}


/**
 * Enforce max active sessions per user
 * Auto-revokes oldest sessions if limit exceeded
 */
async function enforceSessionLimit(userId, conn = db) {
  const sessions = await getActiveSessions(userId);

  if (sessions.length < MAX_ACTIVE_SESSIONS) return;

  const excessCount = sessions.length - (MAX_ACTIVE_SESSIONS - 1);
  const idsToRevoke = sessions
    .slice(0, excessCount)
    .map(s => s.id);

  await revokeSessionsByIds(idsToRevoke, conn);
}


/**
 * Create a new refresh-token session (HASHED)
 */
async function createSession({
  userId,
  token,
  expiresAt,
  userAgent = null,
  ipAddress = null,
  conn = db,
}) {
  const tokenHash = hashRefreshToken(token);

  await conn.query(
    `INSERT INTO user_refresh_tokens
      (user_id, token_hash, expires_at, user_agent, ip_address, last_used_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [userId, tokenHash, expiresAt, userAgent, ipAddress]
  );
}




/**
 * Rotate refresh token:
 * - revoke old token (by hash)
 * - fallback to legacy token if needed
 * - insert new hashed token
 */
async function rotateSession({
  oldToken,
  userId,
  newToken,
  expiresAt,
  userAgent = null,
  ipAddress = null,
  conn = db,
}) {
  const oldTokenHash = hashRefreshToken(oldToken);

  let [result] = await conn.query(
    `UPDATE user_refresh_tokens
     SET revoked_at = NOW(),
         last_used_at = NOW()
     WHERE token_hash = ?
       AND revoked_at IS NULL`,
    [oldTokenHash]
  );

  if (result.affectedRows === 0) {
    [result] = await conn.query(
      `UPDATE user_refresh_tokens
       SET revoked_at = NOW(),
           last_used_at = NOW()
       WHERE token = ?
         AND revoked_at IS NULL`,
      [oldToken]
    );
  }

  if (result.affectedRows === 0) {
    throw new Error('REFRESH_TOKEN_REVOKED');
  }


  await createSession({
    userId,
    token: newToken,
    expiresAt,
    userAgent,
    ipAddress,
    conn,
  });
}



module.exports = {
  createUser,
  validateUser,
  saveRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokensForUser,
  findRefreshToken,
  getActiveSessions,
  enforceSessionLimit,
  createSession,
  rotateSession,
};
