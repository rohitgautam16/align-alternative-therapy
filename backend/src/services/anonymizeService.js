#!/usr/bin/env node
// src/services/anonymizeService.js
'use strict';
const db = require('../db');

/**
 * Anonymize users who were soft‑deleted over 30 days ago
 * and whose emails don’t already start with "deleted+"
 * @returns {Promise<number>} number of users anonymized
 */
async function anonymizeOldUsers() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Find candidate users
    const [users] = await conn.query(
      `SELECT id 
         FROM users
        WHERE deleted_at < NOW() - INTERVAL 30 DAY
          AND email NOT LIKE 'deleted+%'`
    );
    let count = 0;

    for (let { id } of users) {
      const anonymEmail = `deleted+${id}@example.com`;
      await conn.query(
        `UPDATE users
            SET email          = ?,
                full_name      = 'Deleted User',
                status_message = NULL,
                active         = 0
          WHERE id = ?`,
        [anonymEmail, id]
      );
      count++;
    }

    await conn.commit();
    return count;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { anonymizeOldUsers };
