// src/controllers/authController.js
const bcrypt = require('bcrypt');
const db     = require('../db');
const { 
  createUser,
  validateUser,
  saveRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokensForUser,
  findRefreshToken
} = require('../services/authService');
const {
  syncUserSubscriptionFlag,
  fetchUserById
} = require('../services/subscriptionSyncService');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const { sendWelcomeOnSignup } = require('../server/mail/emailService');



async function registerController(req, res, next) {
  try {
    const { email, password, full_name } = req.body;
    const user = await createUser({ email, password, full_name });
    sendWelcomeOnSignup({ user }).catch(err => {
      console.error('Welcome signup email failed:', err);
    });
    return res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function loginController(req, res, next) {
  console.log('DB config:', {
    host:    process.env.DB_HOST,
    port:    process.env.DB_PORT,
    user:    process.env.DB_USER,
    database: process.env.DB_NAME,
  });

  try {
    const { email, password } = req.body;
    const user = await validateUser(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.deleted) {
      return res
        .status(403)
        .json({
          error: 'Account deleted',
          code:  'ACCOUNT_DELETED',
          message: 'You have requested deletion. You can restore your account.',
          userId: user.id
        });
    }

    const accessToken  = generateAccessToken({
      id:         user.id,
      email:      user.email,
      full_name:  user.full_name,
      user_roles: user.user_roles
    });

    const refreshToken = generateRefreshToken({
      id:         user.id,
      email:      user.email,
      full_name:  user.full_name,
      user_roles: user.user_roles
    });

    // Persist refresh token with expiry date
    const { exp } = verifyRefreshToken(refreshToken);
    const expiresAt = new Date(exp * 1000);
    await saveRefreshToken(user.id, refreshToken, expiresAt);

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires:  expiresAt,
      path: '/api', 
    });

    // IMPORTANT: do NOT sync subscription state here.
    // Subscription state is authoritative from webhooks and explicit endpoints only.

    // Return the stored user record (read-only)
    const { fetchUserById } = require('../services/subscriptionSyncService');
    const fullUser = await fetchUserById(user.id);

    return res.json({ accessToken, user: fullUser });
  } catch (err) {
    next(err);
  }
}


async function adminLoginController(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1) Fetch the user row directly (including password_hash and roles)
    const [rows] = await db.query(
      `SELECT
         id,
         email,
         full_name,
         password_hash,
         user_roles
       FROM users
       WHERE email = ?
         AND deleted_at IS NULL
         AND active = 1
       LIMIT 1`,
      [email]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2) Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3) Enforce admin role
    if (user.user_roles !== 1) {
      return res.status(403).json({ error: 'Not an admin' });
    }

    // 4) Issue tokens exactly like normal login
    const payload = {
      id:         user.id,
      email:      user.email,
      full_name:  user.full_name,
      user_roles: user.user_roles,
    };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set HttpOnly refresh cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    // 5) Return the admin user object (including roles)
    return res.json({ accessToken, user: payload });
  } catch (err) {
    next(err);
  }
}

async function refreshController(req, res) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    // 1) Validate JWT signature & expiry
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // 2) Ensure it exists in DB (not revoked / expired in DB)
    const dbToken = await findRefreshToken(token);
    if (!dbToken) {
      return res.status(401).json({ error: 'Refresh token not recognized' });
    }

    // 3) OPTIONAL: rotate refresh token (delete old token row)
    await deleteRefreshToken(token);

    // 4) Sync subscription + fetch latest user
    await syncUserSubscriptionFlag(payload.id);
    const fullUser = await fetchUserById(payload.id);

    // 5) Issue new access token
    const userPayload = {
      id:         payload.id,
      email:      payload.email,
      full_name:  payload.full_name,
      user_roles: payload.user_roles,
    };
    const newAccessToken  = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken(userPayload);

    // 6) Persist new refresh token with correct expiry
    const { exp }   = verifyRefreshToken(newRefreshToken);
    const expiresAt = new Date(exp * 1000);
    await saveRefreshToken(payload.id, newRefreshToken, expiresAt);

    // 7) Set rotated refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires:  expiresAt,
      path: '/api', 
    });

    // 8) Send new access token + user to client
    return res.json({ accessToken: newAccessToken, user: fullUser });
  } catch (err) {
    console.error('refreshController error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function logoutController(req, res) {
  const token = req.cookies.refreshToken;
  if (token) {
    // Remove from DB
    await deleteRefreshToken(token);
  }
  // Clear cookie
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'Strict' });
  return res.json({ success: true });
}

module.exports = {
  registerController,
  loginController,
  refreshController,
  logoutController,
  adminLoginController,
};
