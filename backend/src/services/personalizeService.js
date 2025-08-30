// src/services/personalizeService.js
'use strict';

const db = require('../db');

/** =======================
 * ENUMs (single source of truth)
 * ======================= */
const ENUM = {
  CATEGORY: ['stress_relief','focus_study','sleep_aid','emotional_healing','other'],
  MOOD:     ['calm','anxious','sad','angry','tired','stressed','motivated','neutral','other'],
  URGENCY:  ['low','normal','high'],
  QSTATUS:  ['open','in_progress','awaiting_user','answered','closed'],
  RSTATUS:  ['draft','sent','updated','withdrawn'],
  SENDER:   ['user','admin'],
  FEEDBACK: ['helpful','needs_change'],
  FUSTAT:   ['pending','sent','skipped','done'],
  FURSP:    ['helped','not_helped','no_response'],
};

/** =======================
 * Helpers
 * ======================= */
function assertEnum(name, value, allowed) {
  if (value == null) return;
  if (!allowed.includes(value)) {
    throw new Error(`${name} must be one of: ${allowed.join(', ')}`);
  }
}

async function requireHasAddon(userId) {
  const [[u]] = await db.query(`SELECT has_addon FROM users WHERE id = ? LIMIT 1`, [userId]);
  if (!u) throw new Error('User not found');
  if (!u.has_addon) throw new Error('Addon required for this action');
}

function isAdminUser(user) {
  // Adjust mapping if needed: 1 = admin, 0 = normal
  return Boolean(user && Number(user.user_roles) === 1);
}

/** =======================
 * Questions
 * ======================= */

async function createQuestion({ userId, title, category, mood, mood_text, urgency, description }) {
  await requireHasAddon(userId);

  assertEnum('category', category, ENUM.CATEGORY);
  assertEnum('mood', mood, ENUM.MOOD);
  assertEnum('urgency', urgency, ENUM.URGENCY);

  const [res] = await db.query(
    `INSERT INTO personalize_questions
       (user_id, title, category, mood, mood_text, urgency, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'open', NOW(), NOW())`,
    [userId, title, category || 'other', mood || 'other', mood_text || null, urgency || 'normal', description || null]
  );
  return res.insertId;
}

async function listUserQuestions({ userId, page = 1, pageSize = 20 }) {
  const limit = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const offset = Math.max((Number(page) || 1) - 1, 0) * limit;

  const [rows] = await db.query(
    `SELECT q.*
       FROM personalize_questions q
      WHERE q.user_id = ?
        AND q.deleted_at IS NULL
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows;
}

async function listAdminQuestions({
  status, category, mood, urgency, assigned_admin_id, q, page = 1, pageSize = 20
}) {
  const limit = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const offset = Math.max((Number(page) || 1) - 1, 0) * limit;

  const where = [`q.deleted_at IS NULL`];
  const params = [];

  if (status)    { assertEnum('status', status, ENUM.QSTATUS); where.push(`q.status = ?`);    params.push(status); }
  if (category)  { assertEnum('category', category, ENUM.CATEGORY); where.push(`q.category = ?`); params.push(category); }
  if (mood)      { assertEnum('mood', mood, ENUM.MOOD); where.push(`q.mood = ?`); params.push(mood); }
  if (urgency)   { assertEnum('urgency', urgency, ENUM.URGENCY); where.push(`q.urgency = ?`); params.push(urgency); }
  if (assigned_admin_id) { where.push(`q.assigned_admin_id = ?`); params.push(Number(assigned_admin_id)); }
  if (q)         { where.push(`(q.title LIKE ? OR q.description LIKE ?)`); params.push(`%${q}%`, `%${q}%`); }

  const sql =
    `SELECT q.*, u.full_name AS user_name, u.email AS user_email, a.full_name AS admin_name
       FROM personalize_questions q
       JOIN users u ON u.id = q.user_id
  LEFT JOIN users a ON a.id = q.assigned_admin_id
      WHERE ${where.join(' AND ')}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?`;

  const [rows] = await db.query(sql, [...params, limit, offset]);
  return rows;
}

async function getQuestion({ questionId, forUserId = null, adminView = false }) {
  const [[q]] = await db.query(
    `SELECT * FROM personalize_questions WHERE id = ? AND deleted_at IS NULL`,
    [questionId]
  );
  if (!q) return null;

  if (!adminView && forUserId && q.user_id !== Number(forUserId)) {
    throw new Error('Forbidden');
  }

  const [msgs] = await db.query(
    `SELECT m.*, u.full_name AS sender_name
       FROM personalize_question_messages m
  LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.question_id = ?
        AND m.deleted_at IS NULL
      ORDER BY m.created_at ASC`,
    [questionId]
  );

  const [recs] = await db.query(
    `SELECT r.*
       FROM personalize_recommendations r
      WHERE r.question_id = ?
        AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC`,
    [questionId]
  );

  return { question: q, messages: msgs, recommendations: recs };
}

async function addMessage({ questionId, senderId, senderRole, body, attachment_url = null }) {
  assertEnum('sender_role', senderRole, ENUM.SENDER);

  const [[q]] = await db.query(
    `SELECT * FROM personalize_questions WHERE id = ? AND deleted_at IS NULL`,
    [questionId]
  );
  if (!q) throw new Error('Question not found');

  const [res] = await db.query(
    `INSERT INTO personalize_question_messages
       (question_id, sender_id, sender_role, body, attachment_url, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [questionId, senderId || null, senderRole, body, attachment_url || null]
  );

  // Status hygiene
  if (senderRole === 'admin' && (q.status === 'open' || q.status === 'answered')) {
    await db.query(
      `UPDATE personalize_questions SET status='in_progress', updated_at=NOW() WHERE id=?`,
      [questionId]
    );
  }
  if (senderRole === 'user' && q.status === 'awaiting_user') {
    await db.query(
      `UPDATE personalize_questions SET status='in_progress', updated_at=NOW() WHERE id=?`,
      [questionId]
    );
  }

  return res.insertId;
}

async function assignQuestion({ questionId, adminId }) {
  const [res] = await db.query(
    `UPDATE personalize_questions
        SET assigned_admin_id = ?, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL`,
    [adminId, questionId]
  );
  return res.affectedRows > 0;
}

async function updateQuestionStatus({ questionId, status }) {
  assertEnum('status', status, ENUM.QSTATUS);

  const updates = [`status = ?`, `updated_at = NOW()`];
  const params  = [status];
  if (status === 'closed') updates.push(`closed_at = NOW()`);

  const [res] = await db.query(
    `UPDATE personalize_questions
        SET ${updates.join(', ')}
      WHERE id = ? AND deleted_at IS NULL`,
    [...params, questionId]
  );
  return res.affectedRows > 0;
}

/** =======================
 * Recommendations
 * ======================= */

async function createRecommendation({ questionId, adminId, summary_note, items = [] }) {
  // Ensure question exists
  const [[q]] = await db.query(
    `SELECT * FROM personalize_questions WHERE id = ? AND deleted_at IS NULL`,
    [questionId]
  );
  if (!q) throw new Error('Question not found');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rRes] = await conn.query(
      `INSERT INTO personalize_recommendations
         (question_id, admin_id, summary_note, status, created_at, updated_at)
       VALUES (?, ?, ?, 'draft', NOW(), NOW())`,
      [questionId, adminId, summary_note || null]
    );
    const recommendationId = rRes.insertId;

    // Add items if provided
    if (Array.isArray(items) && items.length) {
      for (const [index, it] of items.entries()) {
        const {
          item_type,
          track_id = null,
          playlist_id = null,
          prescription_note = null,
          display_order = index + 1,
        } = it;

        assertEnum('item_type', item_type, ['track','playlist']);
        if (item_type === 'track' && !track_id) throw new Error('track_id required for item_type=track');
        if (item_type === 'playlist' && !playlist_id) throw new Error('playlist_id required for item_type=playlist');

        await conn.query(
          `INSERT INTO personalize_recommendation_items
             (recommendation_id, item_type, track_id, playlist_id, prescription_note, display_order, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [recommendationId, item_type, track_id || null, playlist_id || null, prescription_note || null, display_order]
        );
      }
    }

    // Schedule a follow-up in 7 days (default)
    await conn.query(
      `INSERT INTO personalize_followups
         (recommendation_id, user_id, scheduled_for, status, created_at, updated_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 'pending', NOW(), NOW())`,
      [recommendationId, q.user_id]
    );

    await conn.commit();
    return recommendationId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function sendRecommendation({ recommendationId }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[rec]] = await conn.query(
      `SELECT id, question_id FROM personalize_recommendations
        WHERE id=? AND deleted_at IS NULL FOR UPDATE`,
      [recommendationId]
    );
    if (!rec) { await conn.rollback(); return false; }

    // 2) Update the recommendation
    await conn.query(
      `UPDATE personalize_recommendations
          SET status='sent', sent_at=IFNULL(sent_at, NOW()), updated_at=NOW()
        WHERE id=?`,
      [recommendationId]
    );

    // 3) Update the parent question directly (no JOIN edge cases)
    await conn.query(
      `UPDATE personalize_questions
          SET status='awaiting_user', updated_at=NOW()
        WHERE id=? AND deleted_at IS NULL`,
      [rec.question_id]
    );

    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function updateRecommendationStatus({ recommendationId, status }) {
  assertEnum('status', status, ENUM.RSTATUS);

  const [[exists]] = await db.query(
    `SELECT id, status, sent_at FROM personalize_recommendations WHERE id=? AND deleted_at IS NULL`,
    [recommendationId]
  );
  if (!exists) return false;

  // 2) update in a way that always touches updated_at
  const sets = ['status = ?', 'updated_at = NOW()'];
  const params = [status];
  if (status === 'sent') {
    sets.push('sent_at = IFNULL(sent_at, NOW())');
  }

  await db.query(
    `UPDATE personalize_recommendations SET ${sets.join(', ')} WHERE id = ?`,
    [...params, recommendationId]
  );
  return true;
}

async function getRecommendation({ recommendationId, forUserId = null, adminView = false }) {
  const [[r]] = await db.query(
    `SELECT * FROM personalize_recommendations WHERE id = ? AND deleted_at IS NULL`,
    [recommendationId]
  );
  if (!r) return null;

  // Enforce ownership when not admin
  if (!adminView && forUserId) {
    const [[q]] = await db.query(`SELECT user_id FROM personalize_questions WHERE id = ?`, [r.question_id]);
    if (!q || q.user_id !== Number(forUserId)) {
      throw new Error('Forbidden');
    }
  }

  const [items] = await db.query(
    `SELECT i.*
       FROM personalize_recommendation_items i
      WHERE i.recommendation_id = ?
        AND i.deleted_at IS NULL
      ORDER BY i.display_order ASC, i.id ASC`,
    [recommendationId]
  );

  return { recommendation: r, items };
}

async function addRecommendationItem({
  recommendationId,
  item_type,
  track_id = null,
  playlist_id = null,
  prescription_note = null,
  display_order = 1
}) {
  assertEnum('item_type', item_type, ['track','playlist']);
  if (item_type === 'track' && !track_id) throw new Error('track_id required for item_type=track');
  if (item_type === 'playlist' && !playlist_id) throw new Error('playlist_id required for item_type=playlist');

  const [res] = await db.query(
    `INSERT INTO personalize_recommendation_items
       (recommendation_id, item_type, track_id, playlist_id, prescription_note, display_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [recommendationId, item_type, track_id || null, playlist_id || null, prescription_note || null, display_order]
  );
  return res.insertId;
}

async function updateRecommendationItem({ itemId, prescription_note = undefined, display_order = undefined }) {
  const sets = [];
  const params = [];

  if (prescription_note !== undefined) { sets.push(`prescription_note = ?`); params.push(prescription_note); }
  if (display_order !== undefined)     { sets.push(`display_order = ?`);     params.push(Number(display_order)); }

  if (!sets.length) return false;

  const [res] = await db.query(
    `UPDATE personalize_recommendation_items
        SET ${sets.join(', ')}, created_at = created_at
      WHERE id = ?`,
    [...params, itemId]
  );
  return res.affectedRows > 0;
}

async function deleteRecommendationItem({ itemId }) {
  const [res] = await db.query(
    `UPDATE personalize_recommendation_items
        SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL`,
    [itemId]
  );
  return res.affectedRows > 0;
}

/** =======================
 * Feedback
 * ======================= */

async function upsertItemFeedback({ itemId, userId, feedback, comment = null }) {
  assertEnum('feedback', feedback, ENUM.FEEDBACK);

  // Verify the item belongs to a recommendation for this user
  const [[row]] = await db.query(
    `SELECT q.user_id
       FROM personalize_recommendation_items i
       JOIN personalize_recommendations r ON r.id = i.recommendation_id
       JOIN personalize_questions q ON q.id = r.question_id
      WHERE i.id = ?`,
    [itemId]
  );
  if (!row) throw new Error('Item not found');
  if (row.user_id !== Number(userId)) throw new Error('Forbidden');

  await db.query(
    `INSERT INTO personalize_recommendation_item_feedback
       (item_id, user_id, feedback, comment, created_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       feedback = VALUES(feedback),
       comment  = VALUES(comment),
       created_at = NOW()`,
    [itemId, userId, feedback, comment || null]
  );

  return true;
}

/** =======================
 * Templates (Admin)
 * ======================= */

async function createTemplate({ adminId, title, body, category = null, mood = null }) {
  if (!title || !body) throw new Error('title and body required');
  if (category) assertEnum('category', category, ENUM.CATEGORY);
  if (mood)     assertEnum('mood', mood, ENUM.MOOD);

  const [res] = await db.query(
    `INSERT INTO personalize_prescription_templates
       (admin_id, title, body, category, mood, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [adminId, title, body, category, mood]
  );
  return res.insertId;
}

async function listTemplates({ adminId, category = null, mood = null, q = null }) {
  const where = ['deleted_at IS NULL', 'admin_id = ?'];
  const params = [adminId];
  if (category) { assertEnum('category', category, ENUM.CATEGORY); where.push('category = ?'); params.push(category); }
  if (mood)     { assertEnum('mood', mood, ENUM.MOOD);             where.push('mood = ?');     params.push(mood); }
  if (q)        { where.push('(title LIKE ? OR body LIKE ?)');     params.push(`%${q}%`, `%${q}%`); }

  const [rows] = await db.query(
    `SELECT * FROM personalize_prescription_templates
      WHERE ${where.join(' AND ')}
      ORDER BY updated_at DESC
      LIMIT 200`,
    params
  );
  return rows;
}

async function updateTemplate({ templateId, patch }) {
  const sets = [], params = [];
  if (patch.title !== undefined) { sets.push('title = ?'); params.push(patch.title); }
  if (patch.body !== undefined)  { sets.push('body = ?');  params.push(patch.body); }
  if (patch.category !== undefined) {
    if (patch.category) assertEnum('category', patch.category, ENUM.CATEGORY);
    sets.push('category = ?'); params.push(patch.category || null);
  }
  if (patch.mood !== undefined) {
    if (patch.mood) assertEnum('mood', patch.mood, ENUM.MOOD);
    sets.push('mood = ?'); params.push(patch.mood || null);
  }
  if (!sets.length) return false;

  const [res] = await db.query(
    `UPDATE personalize_prescription_templates
        SET ${sets.join(', ')}, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL`,
    [...params, templateId]
  );
  return res.affectedRows > 0;
}

async function deleteTemplate({ templateId }) {
  const [res] = await db.query(
    `UPDATE personalize_prescription_templates
        SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL`,
    [templateId]
  );
  return res.affectedRows > 0;
}

/** =======================
 * Follow-ups
 * ======================= */

async function listFollowups({ userId = null, status = null, before = null, after = null, limit = 100 }) {
  const where = ['1=1'];
  const params = [];
  if (userId) { where.push('pf.user_id = ?'); params.push(userId); }
  if (status) { assertEnum('status', status, ENUM.FUSTAT); where.push('pf.status = ?'); params.push(status); }
  if (before) { where.push('pf.scheduled_for <= ?'); params.push(before); }
  if (after)  { where.push('pf.scheduled_for >= ?'); params.push(after); }

  const [rows] = await db.query(
    `SELECT pf.*
       FROM personalize_followups pf
      WHERE ${where.join(' AND ')}
      ORDER BY pf.scheduled_for ASC
      LIMIT ?`,
    [...params, Math.min(Math.max(Number(limit)||50,1),500)]
  );
  return rows;
}

async function markFollowupSent({ followupId }) {
  const [res] = await db.query(
    `UPDATE personalize_followups
        SET status='sent', sent_at=NOW(), updated_at=NOW()
      WHERE id = ? AND status='pending'`,
    [followupId]
  );
  return res.affectedRows > 0;
}

async function recordFollowupResponse({ followupId, response, notes = null }) {
  assertEnum('response', response, ENUM.FURSP);
  const [res] = await db.query(
    `UPDATE personalize_followups
        SET status='done', response=?, notes=?, updated_at=NOW()
      WHERE id = ? AND status IN ('pending','sent')`,
    [response, notes || null, followupId]
  );
  return res.affectedRows > 0;
}

/** =======================
 * Exports
 * ======================= */
module.exports = {
  // helpers
  isAdminUser,
  requireHasAddon,

  // questions
  createQuestion,
  listUserQuestions,
  listAdminQuestions,
  getQuestion,
  addMessage,
  assignQuestion,
  updateQuestionStatus,

  // recommendations
  createRecommendation,
  sendRecommendation,
  updateRecommendationStatus,
  getRecommendation,
  addRecommendationItem,
  updateRecommendationItem,
  deleteRecommendationItem,

  // feedback
  upsertItemFeedback,

  // templates
  createTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,

  // followups
  listFollowups,
  markFollowupSent,
  recordFollowupResponse,
};
