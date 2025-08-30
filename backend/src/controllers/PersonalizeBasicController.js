//controllers/personalizeBasicController.js
const db = require('../db');
const { sendMail } = require('../mail/mailer');

function trimOrNull(v) {
  const s = (v ?? '').toString().trim();
  return s.length ? s : null;
}

exports.createBasicPersonalizeRequest = async function createBasicPersonalizeRequest(req, res) {
  try {
    const name   = trimOrNull(req.body.name);
    const email  = trimOrNull(req.body.email);
    const mobile = trimOrNull(req.body.mobile);
    const notes  = trimOrNull(req.body.notes);

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    // Insert into DB (backup log of the lead)
    const [result] = await db.query(
      `INSERT INTO personalize_basic_requests (name, email, mobile, notes, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [name, email, mobile, notes]
    );
    const id = result.insertId;

    const adminBase = process.env.ADMIN_BASE_URL || 'http://localhost:3000';
    const adminUrl  = `${adminBase.replace(/\/+$/,'')}/admin/basic-personalize/${id}`;

    // Build a text body (mailer will wrap it in your branded HTML template)
    const text = [
      'New personalize request',
      `ID:     ${id}`,
      `Name:   ${name}`,
      `Email:  ${email}`,
      `Mobile: ${mobile || '-'}`,
      `Notes:  ${notes || '-'}`,
      '',
      `Open in Admin: ${adminUrl}`,
    ].join('\n');

    // Send to admins (reply-to the user)
    const toAdmins = process.env.PERSONALIZE_ADMIN_TO || process.env.MAIL_FROM_EMAIL || 'admin@example.com';

    await sendMail({
      to: toAdmins,                     // can be comma-separated list
      subject: `New Personalize Request: ${name}`,
      text,                             // <-- text only; mailer wraps with branded HTML
      replyTo: { email, name },
      tags: ['personalize-basic', 'lead'],
    });

    return res.status(201).json({
      ok: true,
      id,
      message: 'Request received. Our team will reach out shortly.',
    });
  } catch (err) {
    console.error('personalize-basic /request error:', err);
    return res.status(500).json({ error: 'Failed to submit request' });
  }
};

// (Optional) Simple health check used earlier
exports.ping = (req, res) => res.json({ ok: true });
