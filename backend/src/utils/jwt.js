// src/utils/jwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

function generateAccessToken(user) {
  // 8 hours = 8 * 60 * 60 = 28800 seconds
  return jwt.sign(user, ACCESS_SECRET, { expiresIn: 60 * 60 * 8 }); // 8h
}

function generateRefreshToken(user) {
  // 7 days = 7 * 24 * 60 * 60
  return jwt.sign(user, REFRESH_SECRET, { expiresIn: 7 * 24 * 60 * 60 }); // 7d
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
