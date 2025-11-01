'use strict';
const Brevo = require('@getbrevo/brevo');
const {
  createPasswordResetToken,
  resetPassword
} = require('../services/passwordResetService');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// Step 1 — Request Reset
async function requestResetController(req, res, next) {
  try {
    const { email } = req.body;
    const result = await createPasswordResetToken(email);

    // Always respond success to prevent enumeration
    if (!result) {
      return res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.'
      });
    }

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(result.rawToken)}`;

    const sendSmtpEmail = {
      sender: {
        name: process.env.APP_NAME,
        email: process.env.SMTP_USER
      },
      to: [{ email }],
      subject: `${process.env.APP_NAME} — Password Reset Request`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;padding:20px;background:#f7f7f7;">
          <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">
            <h2 style="color:#4f46e5;">Password Reset Request</h2>
            <p>We received a request to reset your password for your ${process.env.APP_NAME} account.</p>
            <p>Click the button below to reset your password. This link is valid for 1 hour:</p>
            <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;margin-top:10px;">Reset Password</a>
            <p style="margin-top:20px;color:#666;">If you didn’t request this, you can safely ignore this email.</p>
          </div>
        </div>
      `
    };

    try {
        if (process.env.NODE_ENV === 'production') {
          await apiInstance.sendTransacEmail(sendSmtpEmail);
          console.log('✅ Brevo email sent to:', email);
        } else {
          console.log('⚙️ Local dev mode: skipping Brevo send.');
          console.log('🔗 Reset link (for testing):', resetUrl);
        }
      } catch (mailErr) {
        console.error('⚠️ Brevo send failed:', mailErr.message);
        console.log('🔗 Reset link (fallback):', resetUrl);
      }


    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.'
    });
  } catch (err) {
    next(err);
  }
}

// Step 2 — Reset Password
async function resetPasswordController(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPassword(token, newPassword);

    if (!result) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    return res.json({
      success: true,
      message: 'Password reset successful. Please log in again.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requestResetController,
  resetPasswordController
};
