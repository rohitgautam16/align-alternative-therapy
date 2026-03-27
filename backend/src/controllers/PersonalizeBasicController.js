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
      `INSERT INTO personalize_basic_requests (name, email, mobile, notes, created_at, admin_email_status, user_email_status)
       VALUES (?, ?, ?, ?, NOW(), 'pending', 'pending')`,
      [name, email, mobile, notes]
    );
    const id = result.insertId;

    const adminBase = process.env.ADMIN_BASE_URL || 'http://localhost:3000';
    const adminUrl  = `${adminBase.replace(/\/+$/,'')}/admin/basic-personalize/${id}`;

    // send emails (admin + user) asynchronously so request returns quickly
    sendPersonalizeBasicEmails({
      id,
      name,
      email,
      mobile,
      notes,
      adminUrl,
    })
      .then(async ({ adminEmailStatus, userEmailStatus, emailsError }) => {
        try {
          await db.query(
            `UPDATE personalize_basic_requests
             SET admin_email_status = ?, user_email_status = ?, email_error = ?, email_sent_at = NOW()
             WHERE id = ?`,
            [adminEmailStatus, userEmailStatus, emailsError, id]
          );
        } catch (dbErr) {
          console.error('Failed to update personalize_basic_requests email status:', dbErr);
        }
      })
      .catch(async (err) => {
        console.error('personalize-basic email failed:', err);
        try {
          await db.query(
            `UPDATE personalize_basic_requests
             SET admin_email_status = 'failed', user_email_status = 'failed', email_error = ?, email_sent_at = NOW()
             WHERE id = ?`,
            [String(err), id]
          );
        } catch (dbErr) {
          console.error('Failed to update personalize_basic_requests on email error:', dbErr);
        }
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

exports.listBasicPersonalizeSubmissions = async function listBasicPersonalizeSubmissions(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const status = trimOrNull(req.query.status);
    const q = trimOrNull(req.query.q);

    const whereClauses = [];
    const params = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (q) {
      whereClauses.push('(name LIKE ? OR email LIKE ? OR mobile LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM personalize_basic_requests ${where}`;
    const [[countRow]] = await db.query(countSql, params);
    const total = Number(countRow?.total || 0);

    const dataSql = `SELECT id, name, email, mobile, notes, status, handled_by_admin_id, contacted_at, created_at, updated_at, admin_email_status, user_email_status, email_error, email_sent_at
      FROM personalize_basic_requests ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`;

    const [rows] = await db.query(dataSql, [...params, pageSize, (page - 1) * pageSize]);

    return res.json({ data: rows, total, page, pageSize });
  } catch (err) {
    console.error('personalize-basic submissions error:', err);
    return res.status(500).json({ error: 'Failed to load submissions' });
  }
};

exports.updateBasicPersonalizeStatus = async function updateBasicPersonalizeStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const status = trimOrNull(req.body.status);

    if (!id || !['new', 'contacted', 'converted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid id or status' });
    }

    const handledBy = req.user?.id || null;
    const contactedAtSql = status === 'contacted' ? ', contacted_at = NOW()' : '';

    const [result] = await db.query(
      `UPDATE personalize_basic_requests
       SET status = ?, handled_by_admin_id = ?, updated_at = NOW()${contactedAtSql}
       WHERE id = ?`,
      [status, handledBy, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json({ ok: true, id, status });
  } catch (err) {
    console.error('personalize-basic status update error:', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
};

exports.ping = (req, res) => res.json({ ok: true });
