// src/controllers/authController.js
const bcrypt = require('bcrypt');
const db     = require('../db');
const { 
  createUser,
  validateUser,
  saveRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokensForUser,
  findRefreshToken,
  enforceSessionLimit,
  createSession,
  rotateSession
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
const crypto = require('crypto');




function hashRefreshToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}


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
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    database: process.env.DB_NAME,
  });

  const conn = await db.getConnection();

  try {
    const { email, password } = req.body;
    const user = await validateUser(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.deleted) {
      return res.status(403).json({
        error: 'Account deleted',
        code: 'ACCOUNT_DELETED',
        message: 'You have requested deletion. You can restore your account.',
        userId: user.id,
      });
    }

    const payload = {
      id:         user.id,
      email:      user.email,
      full_name:  user.full_name,
      user_roles: user.user_roles,
    };

    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const { exp } = verifyRefreshToken(refreshToken);
    const expiresAt = new Date(exp * 1000);

    const userAgent = req.get('User-Agent') || null;
    const ipAddress = req.ip || null;

    await conn.beginTransaction();

    // 🔐 Auto-logout oldest devices if limit exceeded
    await enforceSessionLimit(user.id, conn);

    // 🔐 Create new session
    await createSession({
      userId: user.id,
      token: refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
      conn,
    });

    await conn.commit();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires:  expiresAt,
      path: '/api',
    });

    // IMPORTANT: do NOT sync subscription state here.
    const fullUser = await fetchUserById(user.id);

    return res.json({ accessToken, user: fullUser });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}


async function adminLoginController(req, res, next) {
  const conn = await db.getConnection();

  try {
    const { email, password } = req.body;

    const [rows] = await conn.query(
      `SELECT id, email, full_name, password_hash, user_roles
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

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.user_roles !== 1) {
      return res.status(403).json({ error: 'Not an admin' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_roles: user.user_roles,
    };

    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const { exp } = verifyRefreshToken(refreshToken);
    const expiresAt = new Date(exp * 1000);

    const userAgent = req.get('User-Agent') || null;
    const ipAddress = req.ip || null;

    await conn.beginTransaction();

    // 🔐 Same session enforcement as users
    await enforceSessionLimit(user.id, conn);

    await createSession({
      userId: user.id,
      token: refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
      conn,
    });

    await conn.commit();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires: expiresAt,
      path: '/api',
    });

    // (_auth cookie can stay if you still rely on it)
    res.cookie('_auth', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({ accessToken, user: payload });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function refreshController(req, res) {
  const conn = await db.getConnection();

  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    // 1️⃣ Verify refresh JWT
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const userId = payload.id;
    const userAgent = req.get('User-Agent') || null;
    const ipAddress = req.ip || null;

    await conn.beginTransaction();

    // 2️⃣ Generate new tokens
    const newAccessToken = generateAccessToken({
      id: payload.id,
      email: payload.email,
      full_name: payload.full_name,
      user_roles: payload.user_roles,
    });

    const newRefreshToken = generateRefreshToken({
      id: payload.id,
      email: payload.email,
      full_name: payload.full_name,
      user_roles: payload.user_roles,
    });

    const { exp } = verifyRefreshToken(newRefreshToken);
    const expiresAt = new Date(exp * 1000);

    // 3️⃣ Rotate session atomically
    await rotateSession({
      oldToken: token,
      userId,
      newToken: newRefreshToken,
      expiresAt,
      userAgent,
      ipAddress,
      conn,
    });

    await conn.commit();

    // 4️⃣ Sync subscription + fetch latest user
    await syncUserSubscriptionFlag(userId);
    const fullUser = await fetchUserById(userId);

    // 5️⃣ Set cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires: expiresAt,
      path: '/api',
    });

    return res.json({
      accessToken: newAccessToken,
      user: fullUser,
    });
  } catch (err) {
    await conn.rollback();

    if (err.message === 'REFRESH_TOKEN_REVOKED') {
      return res.status(401).json({ error: 'Session expired' });
    }

    console.error('refreshController error:', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
}

async function logoutController(req, res) {
  const token = req.cookies.refreshToken;

  if (token) {
    await db.query(
      `UPDATE user_refresh_tokens
       SET revoked_at = NOW()
       WHERE token = ?
         AND revoked_at IS NULL`,
      [token]
    );
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'Strict',
    path: '/api',
  });

  return res.json({ success: true });
}

async function listSessionsController(req, res) {
  const rawToken = req.cookies.refreshToken || null;
  const currentTokenHash = rawToken ? hashRefreshToken(rawToken) : null;

  const [rows] = await db.query(
    `SELECT
       id,
       user_agent,
       ip_address,
       created_at,
       last_used_at,
       token_hash,
       token   -- legacy, temporary
     FROM user_refresh_tokens
     WHERE user_id = ?
       AND revoked_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [req.user.id]
  );

  const sessions = rows.map(s => {
    const isCurrent =
      (s.token_hash && currentTokenHash === s.token_hash) ||
      (!s.token_hash && rawToken && rawToken === s.token); 

    return {
      id: s.id,
      userAgent: s.user_agent,
      ipAddress: s.ip_address,
      createdAt: s.created_at,
      lastUsedAt: s.last_used_at,
      isCurrent,
    };
  });

  return res.json({ sessions });
}

async function revokeSessionController(req, res) {
  const sessionId = req.params.id;

  const [result] = await db.query(
    `UPDATE user_refresh_tokens
     SET revoked_at = NOW()
     WHERE id = ?
       AND user_id = ?
       AND revoked_at IS NULL`,
    [sessionId, req.user.id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Session not found' });
  }

  return res.json({ success: true });
}

async function revokeOtherSessionsController(req, res) {
  const token = req.cookies.refreshToken;

  await db.query(
    `UPDATE user_refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = ?
       AND token != ?
       AND revoked_at IS NULL`,
    [req.user.id, token]
  );

  return res.json({ success: true });
}

module.exports = {
  registerController,
  loginController,
  refreshController,
  logoutController,
  adminLoginController,
  listSessionsController,
  revokeSessionController,
  revokeOtherSessionsController
};
