// server/mail/emailTemplates.js
'use strict';

const BRAND_NAME = process.env.MAIL_FROM_NAME || 'YourApp';
const BRAND_COLOR = process.env.MAIL_BRAND_COLOR || '#000000';

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function baseLayout({ title, bodyHtml }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title || BRAND_NAME)}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND_COLOR};padding:16px 20px;color:#fff;font-size:18px;font-weight:600;">
                ${escapeHtml(BRAND_NAME)}
              </td>
            </tr>
            <tr>
              <td style="padding:20px;font-size:15px;color:#333;line-height:1.5;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#f9f9f9;padding:14px;font-size:12px;color:#777;text-align:center;">
                © ${new Date().getFullYear()} ${escapeHtml(BRAND_NAME)}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

/* ---------- 1) Personalization basic: admin ---------- */
function personalizeBasicAdminTemplate({ id, name, email, mobile, notes, adminUrl }) {
  const subject = `New Personalize Request: ${name || email || `ID #${id}`}`;

  const bodyHtml = `
    <p>You have received a new personalization request.</p>

    <h3>Request details</h3>
    <p><strong>ID:</strong> ${escapeHtml(String(id))}</p>
    <p><strong>Name:</strong> ${escapeHtml(name || 'Not provided')}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Mobile:</strong> ${escapeHtml(mobile || '-')}</p>

    <p><strong>Notes:</strong></p>
    <p>${escapeHtml(notes || '-')}</p>

    ${adminUrl ? `
      <p style="margin-top:16px;">
        <a href="${adminUrl}" style="display:inline-block;padding:8px 14px;background:${BRAND_COLOR};color:#fff;text-decoration:none;border-radius:4px;">
          Open in admin
        </a>
      </p>
      <p style="font-size:12px;color:#666;">Admin URL: ${escapeHtml(adminUrl)}</p>
    ` : ''}
  `;

  const text = [
    'New personalization request',
    `ID:     ${id}`,
    `Name:   ${name || 'Not provided'}`,
    `Email:  ${email}`,
    `Mobile: ${mobile || '-'}`,
    '',
    'Notes:',
    notes || '-',
    '',
    adminUrl ? `Admin URL: ${adminUrl}` : null,
  ].filter(Boolean).join('\n');

  return {
    subject,
    html: baseLayout({ title: subject, bodyHtml }),
    text,
  };
}

/* ---------- 2) Personalization basic: user acknowledgement ---------- */
function personalizeBasicUserAckTemplate({ name }) {
  const safeName = name || 'there';
  const subject = 'We’ve received your personalization request';

  const bodyHtml = `
    <p>Hi ${escapeHtml(safeName)},</p>
    <p>Thank you for requesting a personalized music plan with ${escapeHtml(BRAND_NAME)}.</p>
    <p>We’ve received your details and our team will review your request and get back to you shortly.</p>
    <p>You can reply to this email if you’d like to share anything else.</p>
    <p>Warm regards,<br/>${escapeHtml(BRAND_NAME)}</p>
  `;

  const text = `
Hi ${safeName},

Thank you for requesting a personalized music plan with ${BRAND_NAME}.
We’ve received your details and will get back to you shortly.

You can reply to this email if you’d like to share anything else.

Warm regards,
${BRAND_NAME}
  `.trim();

  return {
    subject,
    html: baseLayout({ title: subject, bodyHtml }),
    text,
  };
}

/* ---------- 3) Password reset token email ---------- */
function passwordResetTemplate({ name, resetLink }) {
  const safeName = name || 'there';
  const subject = 'Reset your password';

  const bodyHtml = `
    <p>Hi ${escapeHtml(safeName)},</p>
    <p>We received a request to reset your password.</p>
    <p>Click the button below to choose a new password:</p>
    <p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:${BRAND_COLOR};color:#fff;text-decoration:none;border-radius:4px;">
        Reset password
      </a>
    </p>
    <p>If the button doesn’t work, use this link:</p>
    <p style="word-break:break-all;">${escapeHtml(resetLink)}</p>
    <p>This link will expire soon. If you didn’t request this, you can safely ignore this email.</p>
  `;

  const text = `
Hi ${safeName},

We received a request to reset your password.

Open this link to choose a new password:
${resetLink}

If you didn’t request this, you can ignore this email.
  `.trim();

  return {
    subject,
    html: baseLayout({ title: subject, bodyHtml }),
    text,
  };
}

/* ---------- 4) Password changed confirmation ---------- */
function passwordChangedTemplate({ name }) {
  const safeName = name || 'there';
  const subject = 'Your password has been changed';

  const bodyHtml = `
    <p>Hi ${escapeHtml(safeName)},</p>
    <p>This is a confirmation that your password has been successfully changed.</p>
    <p>If you did not make this change, please contact us immediately.</p>
  `;

  const text = `
Hi ${safeName},

This is a confirmation that your password has been successfully changed.

If you did not make this change, please contact us immediately.
  `.trim();

  return {
    subject,
    html: baseLayout({ title: subject, bodyHtml }),
    text,
  };
}

/* ---------- 5) Welcome on signup ---------- */
function welcomeSignupTemplate({ name }) {
  const safeName = name || 'there';
  const subject = `Welcome to ${BRAND_NAME}`;

  const bodyHtml = `
    <p>Hi ${escapeHtml(safeName)},</p>
    <p>Welcome to ${escapeHtml(BRAND_NAME)}!</p>
    <p>We’re excited to have you with us. You can log in anytime and start exploring your personalized music journey.</p>
  `;

  const text = `
Hi ${safeName},

Welcome to ${BRAND_NAME}!
We’re excited to have you with us.
  `.trim();

  return {
    subject,
    html: baseLayout({ title: subject, bodyHtml }),
    text,
  };
}

/* ---------- 6) Welcome on subscription ---------- */
function welcomeSubscriptionTemplate({ name, planName }) {
  const safeName = name || 'there';
  const subject = `Your ${planName || 'subscription'} is active`;

  const bodyHtml = `
    <p>Hi ${escapeHtml(safeName)},</p>
    <p>Thank you for subscribing to ${escapeHtml(planName || 'our plan')} at ${escapeHtml(BRAND_NAME)}.</p>
    <p>Your subscription is now active. You can manage it from your account dashboard.</p>
  `;

  const text = `
Hi ${safeName},

Thank you for subscribing to ${planName || 'our plan'} at ${BRAND_NAME}.
Your subscription is now active.
  `.trim();

  return {
    subject,
    html: baseLayout({ title: subject, bodyHtml }),
    text,
  };
}

module.exports = {
  personalizeBasicAdminTemplate,
  personalizeBasicUserAckTemplate,
  passwordResetTemplate,
  passwordChangedTemplate,
  welcomeSignupTemplate,
  welcomeSubscriptionTemplate,
};
