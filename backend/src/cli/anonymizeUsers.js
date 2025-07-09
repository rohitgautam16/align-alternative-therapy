#!/usr/bin/env node
// src/cli/anonymizeUsers.js

const { anonymizeOldUsers } = require('../services/anonymizeService');

async function run() {
  console.log('🔒 Starting anonymization of old users…');
  const count = await anonymizeOldUsers();
  console.log(`✅ Anonymized ${count} user${count !== 1 ? 's' : ''}.`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error in anonymization:', err);
  process.exit(1);
});
