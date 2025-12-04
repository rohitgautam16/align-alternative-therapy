// server/mail/mailClient.js
'use strict';

const nodemailer = require('nodemailer');

let cachedTransporter = null;

function getTransporter() {
  if (process.env.MAIL_DRIVER === 'console') {
    // no real transporter needed
    return null;
  }

  if (cachedTransporter) return cachedTransporter;

  const host = process.env.MAIL_SMTP_HOST;
  const port = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
  const secure = (process.env.MAIL_SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.MAIL_SMTP_USER;
  const pass = process.env.MAIL_SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP config missing: MAIL_SMTP_HOST/USER/PASS');
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: Number(process.env.MAIL_SMTP_MAX_CONNECTIONS || 5),
    maxMessages: Number(process.env.MAIL_SMTP_MAX_MESSAGES || 100),
  });

  // optional verify
  cachedTransporter.verify(err => {
    if (err) {
      console.error('SMTP verify failed:', err.message || err);
    } else {
      console.info('SMTP transporter verified');
    }
  });

  return cachedTransporter;
}

/**
 * Low-level raw email sender (no business logic).
 * @param {Object} opts
 *  - to (string | string[])
 *  - subject, html, text, cc, bcc, replyTo, headers
 */
async function sendRawEmail(opts) {
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  const fromName = process.env.MAIL_FROM_NAME || 'YourApp';

  if (!fromEmail) throw new Error('MAIL_FROM_EMAIL not configured');

  const { to, subject, html, text, cc, bcc, replyTo, headers } = opts;
  if (!to) throw new Error('sendRawEmail: "to" is required');

  const toList = Array.isArray(to) ? to.join(', ') : to;
  const ccList = cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined;
  const bccList = bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined;

  const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

  if (process.env.MAIL_DRIVER === 'console') {
    console.log('--- CONSOLE EMAIL ---');
    console.log('FROM:', from);
    console.log('TO:', toList);
    if (ccList) console.log('CC:', ccList);
    if (bccList) console.log('BCC:', bccList);
    console.log('SUBJECT:', subject);
    console.log('TEXT:', text);
    console.log('HTML length:', html ? html.length : 0);
    console.log('---------------------');
    return { ok: true, provider: 'console' };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from,
    to: toList,
    cc: ccList,
    bcc: bccList,
    subject,
    text,
    html,
    replyTo,
    headers,
  };

  const info = await transporter.sendMail(mailOptions);
  return { ok: true, provider: 'smtp', res: info };
}

module.exports = { sendRawEmail };
