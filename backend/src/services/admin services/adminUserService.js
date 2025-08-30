const bcrypt = require('bcrypt');
const db     = require('../.././db');


async function listAdmins({ page = 1, pageSize = 20 } = {}) {
  page     = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  // total count of admins
  const countPromise = db.query(
    `SELECT COUNT(*) AS total
       FROM users
      WHERE deleted_at IS NULL
        AND user_roles = 1`
  );

  // page of admin rows
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

/**
 * List all users
 */
async function listUsers({ page = 1, pageSize = 20 } = {}) {
  page     = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  const countPromise = db.query(
    `SELECT COUNT(*) AS total
       FROM users
      WHERE deleted_at IS NULL`
  );
  const dataPromise = db.query(
    `SELECT
       id, email, full_name, user_roles, active, status_message,
       created_at, updated_at, is_subscribed
     FROM users
     WHERE deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );

  const [[{ total }], [rows]] = await Promise.all([countPromise, dataPromise]);
  return { data: rows, total, page, pageSize };
}

/**
 * Fetch one user by ID
 */
async function getUserById(id) {
  const [rows] = await db.query(
    `SELECT id, email, full_name, user_roles, active, status_message,
            created_at, updated_at, deleted_at, is_subscribed
       FROM users
      WHERE id = ?`,
    [id]
  );
  return rows[0];
}

/**
 * Create a new user
 */
async function createUserAdmin({ email, password, full_name, user_roles, active, status_message }) {
  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    `INSERT INTO users
       (email, password_hash, full_name, user_roles, active, status_message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [email, password_hash, full_name, user_roles||0, active??1, status_message||null]
  );
  return getUserById(result.insertId);
}

/**
 * Update an existing user
 */
async function updateUserAdmin(id, { full_name, status_message, user_roles, active, is_subscribed }) {
  await db.query(
    `UPDATE users
       SET full_name      = ?,
           status_message = ?,
           user_roles     = ?,
           active         = ?,
           is_subscribed  = ?,
           updated_at     = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [full_name, status_message, user_roles, active, is_subscribed, id]
  );
  return getUserById(id);
}


/**
 * Soft‑delete a user
 */
async function deleteUserAdmin(id, requestIp) {
  // 1) mark user deleted
  await db.query(
    `UPDATE users
       SET deleted_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id]
  );

  // 2) log into user_deletion_requests
  await db.query(
    `INSERT INTO user_deletion_requests
       (user_id, request_ip)
     VALUES (?, ?)`,
    [id, requestIp]
  );
}

module.exports = {
  listAdmins,
  listUsers,
  getUserById,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
};
