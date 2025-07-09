// src/controllers/r2Controller.js
const { listObjects } = require('../../services/admin services/r2Service');

async function listR2Controller(req, res, next) {
  try {
    // allow front end to pass prefix, default to root
    const prefix = req.query.prefix || '';
    const result = await listObjects(prefix);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listR2Controller };
