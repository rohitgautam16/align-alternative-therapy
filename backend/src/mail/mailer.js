// server/mail/mailer.js
const Brevo = require('@getbrevo/brevo');
const nodemailer = require('nodemailer');

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

// ---------- Email Template ----------
function buildHtmlTemplate({ subject, bodyHtml, bodyText }) {
  const brandColor = "#000000"; 
  const brandName = process.env.MAIL_FROM_NAME || "YourApp";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:${brandColor};padding:20px;color:#fff;font-size:20px;font-weight:bold;">
                ${brandName}
              </td>
            </tr>
            <tr>
              <td style="padding:20px;font-size:15px;color:#333;line-height:1.5;">
                ${bodyHtml || (bodyText ? `<pre>${bodyText}</pre>` : "")}
              </td>
            </tr>
            <tr>
              <td style="background:#f9f9f9;padding:15px;font-size:12px;color:#777;text-align:center;">
                © ${new Date().getFullYear()} ${brandName}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// ---------- Normalize ----------
function normalizePayload({ to, cc, bcc, subject, html, text, replyTo, tags }) {
  const fromEmail =
    process.env.MAIL_FROM_EMAIL ||
    process.env.MAILTRAP_FROM_EMAIL ||
    'no-reply@example.com';
  const fromName =
    process.env.MAIL_FROM_NAME ||
    process.env.MAILTRAP_FROM_NAME ||
    'YourApp';

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
  };

  // auto-wrap if no custom HTML provided
  if (!norm.html) {
    norm.html = buildHtmlTemplate({ subject: norm.subject, bodyHtml: null, bodyText: norm.text });
  }

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

  try {
    const res = await api.sendTransacEmail(payload);
    return { ok: true, provider: 'brevo', res };
  } catch (err) {
    const detail = err?.response?.body || err?.response?.data || err?.message || err;
    throw Object.assign(new Error('Brevo send failed'), { provider: 'brevo', detail });
  }
}

// ---------- Mailtrap driver ----------
async function sendViaMailtrap(norm) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: Number(process.env.MAILTRAP_PORT || 2525),
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const to = norm.to?.map(({ email, name }) => (name ? `"${name}" <${email}>` : email)).join(', ');
  const cc = norm.cc?.map(({ email, name }) => (name ? `"${name}" <${email}>` : email)).join(', ');
  const bcc = norm.bcc?.map(({ email, name }) => (name ? `"${name}" <${email}>` : email)).join(', ');

  const info = await transporter.sendMail({
    from: norm.from.name ? `"${norm.from.name}" <${norm.from.email}>` : norm.from.email,
    to, cc, bcc,
    subject: norm.subject,
    text: norm.text,
    html: norm.html,
    replyTo: norm.replyTo?.name
      ? `"${norm.replyTo.name}" <${norm.replyTo.email}>`
      : norm.replyTo?.email,
    headers: norm.tags?.length ? { 'X-Tags': norm.tags.join(',') } : undefined,
  });

  return { ok: true, provider: 'mailtrap', res: info };
}

// ---------- Console driver ----------
async function sendViaConsole(norm) {
  console.log('--- CONSOLE MAIL DRIVER ---');
  console.log('FROM:', norm.from);
  console.log('TO:', norm.to);
  if (norm.cc?.length) console.log('CC:', norm.cc);
  if (norm.bcc?.length) console.log('BCC:', norm.bcc);
  if (norm.replyTo) console.log('Reply-To:', norm.replyTo);
  console.log('SUBJECT:', norm.subject);
  console.log('HTML:\n', norm.html);
  console.log('TAGS:', norm.tags);
  console.log('---------------------------');
  return { ok: true, provider: 'console' };
}

// ---------- Public API ----------
async function sendMail(opts) {
  const norm = normalizePayload(opts);
  const driver = (process.env.MAIL_DRIVER || 'brevo').toLowerCase();

  if (driver === 'console') return sendViaConsole(norm);
  if (driver === 'mailtrap') return sendViaMailtrap(norm);
  return sendViaBrevo(norm);
}

module.exports = { sendMail };
