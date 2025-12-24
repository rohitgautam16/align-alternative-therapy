// server/mail/mailer.js
'use strict';

const Brevo = require('@getbrevo/brevo');
const nodemailer = require('nodemailer');
const validator = require('validator'); 

// ---------- Helpers ----------
function parseAddress(addr) {
  if (!addr) return null;
  if (typeof addr === 'string') {
    const m = addr.match(/^\s*(?:"?([^"]*)"?\s*)?<(.+@.+\..+)>\s*$/);
    if (m) return { name: m[1] || undefined, email: m[2] };
    return { email: addr };
  }
  if (addr.email) return { email: addr.email, name: addr.name };
  return null;
}

function toAddressArray(v) {
  const arr = Array.isArray(v)
    ? v
    : typeof v === 'string'
    ? v.split(',')
    : v
    ? [v]
    : [];
  return arr.map(parseAddress).filter(Boolean);
}

function validateAddresses(arr = []) {
  return arr.every(a => a && typeof a.email === 'string' && validator.isEmail(a.email));
}

function sanitizeHtml(html = '') {
  // Light sanitization: strip script/style tags to avoid accidental malicious payloads.
  // For heavy sanitization consider DOMPurify on server or a whitelist approach.
  return String(html).replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
                     .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '');
}

// ---------- Email Template ----------
function buildHtmlTemplate({ subject, bodyHtml, bodyText }) {
  const brandColor = process.env.MAIL_BRAND_COLOR || "#000000";
  const brandName = process.env.MAIL_FROM_NAME || "YourApp";

  const safeBody = sanitizeHtml(bodyHtml || (bodyText ? `<pre style="white-space:pre-wrap;">${escapeHtml(bodyText)}</pre>` : ''));

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(subject || '')}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:${brandColor};padding:18px 20px;color:#fff;font-size:18px;font-weight:600;">
              ${escapeHtml(brandName)}
            </td>
          </tr>
          <tr>
            <td style="padding:20px;font-size:15px;color:#333;line-height:1.5;">
              ${safeBody}
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9f9;padding:15px;font-size:12px;color:#777;text-align:center;">
              © ${new Date().getFullYear()} ${escapeHtml(brandName)}. All rights reserved.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------- Normalize ----------
function normalizePayload({ to, cc, bcc, subject, html, text, replyTo, tags, attachments }) {
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'no-reply@example.com';
  const fromName = process.env.MAIL_FROM_NAME || 'YourApp';

  const norm = {
    from: { email: fromEmail, name: fromName },
    to: toAddressArray(to),
    cc: toAddressArray(cc),
    bcc: toAddressArray(bcc),
    replyTo: parseAddress(replyTo),
    subject: subject || '(no subject)',
    html,
    text,
    tags: Array.isArray(tags) ? tags : undefined,
    attachments: Array.isArray(attachments) ? attachments : undefined,
  };

  // auto-wrap if no custom HTML provided
  if (!norm.html) {
    norm.html = buildHtmlTemplate({ subject: norm.subject, bodyHtml: null, bodyText: norm.text });
  }

  // Basic validation
  if (!norm.to.length) throw new Error('No recipient: "to" is required');
  if (!validateAddresses(norm.to.concat(norm.cc || [], norm.bcc || []))) throw new Error('Invalid email address in recipients');

  // enforce max html length to avoid provider rejections
  if (norm.html && norm.html.length > 200_000) throw new Error('Email html too large');

  return norm;
}

// ---------- Brevo driver ----------
async function sendViaBrevo(norm) {
  const api = new Brevo.TransactionalEmailsApi();
  api.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

  const payload = new Brevo.SendSmtpEmail();
  payload.sender = norm.from;
  payload.to = norm.to;
  if (norm.cc?.length) payload.cc = norm.cc;
  if (norm.bcc?.length) payload.bcc = norm.bcc;
  if (norm.replyTo) payload.replyTo = norm.replyTo;
  payload.subject = norm.subject;
  if (norm.html) payload.htmlContent = norm.html;
  if (norm.text) payload.textContent = norm.text;
  if (norm.tags?.length) payload.tags = norm.tags;
  if (norm.attachments) payload.attachment = norm.attachments; // map if needed by Brevo SDK

  try {
    const res = await api.sendTransacEmail(payload);
    return { ok: true, provider: 'brevo', res };
  } catch (err) {
    const detail = err?.response?.body || err?.response?.data || err?.message || err;
    const e = new Error('Brevo send failed');
    e.provider = 'brevo';
    e.detail = detail;
    throw e;
  }
}

// ---------- Generic SMTP (Google Workspace) driver with transporter caching ----------
let cachedTransporter = null;

function getSmtpTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // Prefer explicit SMTP config; fallback to google workspace smtp.gmail.com
  const host = process.env.MAIL_SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
  const secure = (process.env.MAIL_SMTP_SECURE || 'false').toLowerCase() === 'true'; // true for 465
  const user = process.env.MAIL_SMTP_USER;
  const pass = process.env.MAIL_SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP credentials missing (MAIL_SMTP_USER / MAIL_SMTP_PASS)');
  }

  const opts = {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    pool: true,
    maxConnections: Number(process.env.MAIL_SMTP_MAX_CONNECTIONS || 5),
    maxMessages: Number(process.env.MAIL_SMTP_MAX_MESSAGES || 100),
  };

  console.log('SMTP_USER =', process.env.SMTP_USER);
console.log('SMTP_PASS length =', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);


  cachedTransporter = nodemailer.createTransport(opts);

  // Optional verify in startup (non-blocking)
  cachedTransporter.verify(err => {
    if (err) {
      console.error('SMTP verify failed:', err.message || err);
    } else {
      console.info('SMTP transporter verified');
    }
  });

  return cachedTransporter;
}

async function sendViaSmtp(norm) {
  const transporter = getSmtpTransporter();

  const mailOptions = {
    from: norm.from.name ? `"${norm.from.name}" <${norm.from.email}>` : norm.from.email,
    to: norm.to.map(({ email, name }) => (name ? `"${name}" <${email}>` : email)).join(', '),
    cc: norm.cc?.length ? norm.cc.map(a => a.name ? `"${a.name}" <${a.email}>` : a.email).join(', ') : undefined,
    bcc: norm.bcc?.length ? norm.bcc.map(a => a.name ? `"${a.name}" <${a.email}>` : a.email).join(', ') : undefined,
    subject: norm.subject,
    text: norm.text,
    html: norm.html,
    replyTo: norm.replyTo?.name ? `"${norm.replyTo.name}" <${norm.replyTo.email}>` : norm.replyTo?.email,
    headers: norm.tags?.length ? { 'X-Tags': norm.tags.join(',') } : undefined,
    attachments: norm.attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  return { ok: true, provider: 'smtp', res: info };
}

// ---------- Retry wrapper ----------
async function withRetries(fn, args = [], attempts = 3) {
  let attempt = 0;
  let lastErr;
  while (attempt < attempts) {
    try {
      return await fn(...args);
    } catch (err) {
      lastErr = err;
      attempt++;
      const backoff = Math.pow(2, attempt) * 100; // exponential backoff: 200ms, 400ms, 800ms...
      // log minimal error info; don't leak secrets
      console.warn(`Mail driver attempt ${attempt} failed:`, err.provider || err.message || err.toString());
      if (attempt < attempts) await new Promise(r => setTimeout(r, backoff));
    }
  }
  // preserve last error details
  lastErr.attempts = attempts;
  throw lastErr;
}

// ---------- Console driver (useful for local/dev) ----------
async function sendViaConsole(norm) {
  console.info('--- CONSOLE MAIL DRIVER ---');
  console.info('FROM:', norm.from);
  console.info('TO:', norm.to);
  if (norm.cc?.length) console.info('CC:', norm.cc);
  if (norm.bcc?.length) console.info('BCC:', norm.bcc);
  if (norm.replyTo) console.info('Reply-To:', norm.replyTo);
  console.info('SUBJECT:', norm.subject);
  console.info('HTML length:', norm.html ? norm.html.length : 0);
  console.info('TAGS:', norm.tags);
  console.info('---------------------------');
  return { ok: true, provider: 'console' };
}

// ---------- Public API ----------
async function sendMail(opts = {}) {
  const norm = normalizePayload(opts);
  const driver = (process.env.MAIL_DRIVER || 'smtp').toLowerCase();

  if (driver === 'console') return sendViaConsole(norm);
  if (driver === 'brevo') return withRetries(sendViaBrevo, [norm], Number(process.env.MAIL_RETRIES || 3));
  if (driver === 'smtp') return withRetries(sendViaSmtp, [norm], Number(process.env.MAIL_RETRIES || 3));

  // fallback: try smtp then brevo
  try {
    return await withRetries(sendViaSmtp, [norm], Number(process.env.MAIL_RETRIES || 2));
  } catch (err) {
    console.warn('SMTP failed, falling back to Brevo', err.message || err);
    return withRetries(sendViaBrevo, [norm], Number(process.env.MAIL_RETRIES || 2));
  }
}

module.exports = { sendMail };
