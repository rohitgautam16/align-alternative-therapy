#!/usr/bin/env node
// src/cli/purgeDeletedUsers.js
'use strict';
const db = require('../db');
const { anonymizeOldUsers } = require('../services/anonymizeService');

async function purge() {
  const conn = await db.getConnection();
  try {
    console.log('🔒 Anonymizing users deleted >30 days…');
    const anonCount = await anonymizeOldUsers();
    console.log(`✅ Anonymized ${anonCount} user${anonCount !== 1 ? 's' : ''}.`);

    await conn.beginTransaction();

    console.log('🗑️  Purging users deleted >60 days…');
    // Delete from user_deletion_requests, user_refresh_tokens, then users
    const [delReq] = await conn.query(
      `DELETE r 
         FROM user_deletion_requests r
         JOIN users u ON u.id = r.user_id
        WHERE u.deleted_at < NOW() - INTERVAL 60 DAY`
    );
    console.log(`✅ Deleted ${delReq.affectedRows} deletion-log entries.`);

    const [tokens] = await conn.query(
      `DELETE t
         FROM user_refresh_tokens t
         JOIN users u ON u.id = t.user_id
        WHERE u.deleted_at < NOW() - INTERVAL 60 DAY`
    );
    console.log(`✅ Deleted ${tokens.affectedRows} refresh tokens.`);

    const [users] = await conn.query(
      `DELETE 
         FROM users
        WHERE deleted_at < NOW() - INTERVAL 60 DAY`
    );
    console.log(`✅ Hard-deleted ${users.affectedRows} user${users.affectedRows !== 1 ? 's' : ''}.`);

    await conn.commit();
  } catch (err) {
    console.error('❌ Purge failed:', err);
    await conn.rollback();
    process.exit(1);
  } finally {
    conn.release();
  }
  process.exit(0);
}

purge();
