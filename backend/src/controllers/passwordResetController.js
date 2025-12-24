'use strict';

const db = require('../db');
const {
  createPasswordResetToken,
  resetPassword,
} = require('../services/passwordResetService');
const {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} = require('../server/mail/emailService');

function getFrontendBaseUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173'
  );
}

// Step 1 — Request Reset
async function requestResetController(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await createPasswordResetToken(email);

    if (result) {
      try {
        // load user for name + email
        const [[user]] = await db.query(
          `SELECT id, email, full_name AS full_name
             FROM users
            WHERE id = ?
            LIMIT 1`,
          [result.userId]
        );

        if (user && user.email) {
          const baseUrl = getFrontendBaseUrl().replace(/\/+$/, '');
          const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(
            result.rawToken
          )}`;

          await sendPasswordResetEmail({ user, resetLink });
        } else {
          console.warn(
            `Password reset: token created but user not found or email missing for id=${result.userId}`
          );
        }
      } catch (mailErr) {
        console.error('Password reset email send failed:', mailErr);
      }
    }

    // Always respond success to prevent enumeration
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
}

// Step 2 — Reset Password
async function resetPasswordController(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: 'token and newPassword are required' });
    }

    const result = await resetPassword(token, newPassword);

    if (!result) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    // Fire-and-forget confirmation email
    try {
      const [[user]] = await db.query(
        `SELECT id, email, full_name AS full_name
           FROM users
          WHERE id = ?
          LIMIT 1`,
        [result.userId]
      );

      if (user && user.email) {
        sendPasswordChangedEmail({ user }).catch(err =>
          console.error('Password changed email failed:', err)
        );
      } else {
        console.warn(
          `Password changed: user not found or email missing for id=${result.userId}`
        );
      }
    } catch (mailErr) {
      console.error(
        'Password changed: failed to load user or send email:',
        mailErr
      );
    }

    return res.json({
      success: true,
      message: 'Password reset successful. Please log in again.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requestResetController,
  resetPasswordController,
};
