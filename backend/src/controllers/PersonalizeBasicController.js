// controllers/personalizeBasicController.js
const db = require('../db');
const { sendPersonalizeBasicEmails } = require('../server/mail/emailService');

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

    const [result] = await db.query(
      `INSERT INTO personalize_basic_requests (name, email, mobile, notes, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [name, email, mobile, notes]
    );
    const id = result.insertId;

    const adminBase = process.env.ADMIN_BASE_URL || 'http://localhost:3000';
    const adminUrl  = `${adminBase.replace(/\/+$/,'')}/admin/basic-personalize/${id}`;

    // send emails (admin + user)
    await sendPersonalizeBasicEmails({
      id,
      name,
      email,
      mobile,
      notes,
      adminUrl,
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

exports.ping = (req, res) => res.json({ ok: true });
