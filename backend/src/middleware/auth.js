// src/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload; 
    next();
  } catch (err) {
    try {
      const decoded = jwt.decode(token);
      console.log('Token decode:', decoded, 'serverNow:', Math.floor(Date.now()/1000));
    } catch(e){}
    console.warn('Token verify failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


/**
 * Requires that user is authenticated **and** has user_roles === 1
 */
function requireAdmin(req, res, next) {
   console.log('🔐 requireAdmin payload:', req.user);
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Then enforce the role
  if (req.user.user_roles !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
