'use strict';

const svc = require('../services/personalizeService');
const { z } = require('zod');

/* ============================
 * Shared helpers
 * ============================ */

function ok(res, data) {
  res.json(data ?? { ok: true });
}

function created(res, data) {
  res.status(201).json(data);
}

function bad(res, message, code = 400) {
  res.status(code).json({ error: String(message || 'Bad Request') });
}

/** Safe parse wrapper */
function parse(schema, data) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.errors?.map(e => `${e.path.join('.')}: ${e.message}`).join('; ') || 'Invalid input';
    const err = new Error(msg);
    err.name = 'ValidationError';
    throw err;
  }
  return parsed.data;
}

/* ============================
 * Schemas
 * ============================ */

const Category = z.enum(['stress_relief','focus_study','sleep_aid','emotional_healing','other']);
const Mood     = z.enum(['calm','anxious','sad','angry','tired','stressed','motivated','neutral','other']);
const Urgency  = z.enum(['low','normal','high']);
const QStatus  = z.enum(['open','in_progress','awaiting_user','answered','closed']);
const RStatus  = z.enum(['draft','sent','updated','withdrawn']);
const Sender   = z.enum(['user','admin']);
const Feedback = z.enum(['helpful','needs_change']);
const FUStatus = z.enum(['pending','sent','skipped','done']);
const FUResp   = z.enum(['helped','not_helped','no_response']);

const createQuestionSchema = z.object({
  title: z.string().min(1),
  category: Category.optional(),
  mood: Mood.optional(),
  mood_text: z.string().max(200).optional().nullable(),
  urgency: Urgency.optional(),
  description: z.string().optional().nullable(),
});

const listAdminQuestionsSchema = z.object({
  status: QStatus.optional(),
  category: Category.optional(),
  mood: Mood.optional(),
  urgency: Urgency.optional(),
  assigned_admin_id: z.coerce.number().int().positive().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const addMessageSchema = z.object({
  senderRole: Sender, // controller sets it, schema kept for completeness
  body: z.string().min(1),
  attachment_url: z.string().url().optional().nullable(),
});

const updateQuestionStatusSchema = z.object({
  status: QStatus,
});

const createRecommendationSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  summary_note: z.string().optional().nullable(),
  items: z.array(z.object({
    item_type: z.enum(['track', 'playlist']),
    track_id: z.coerce.number().int().positive().optional(),
    playlist_id: z.coerce.number().int().positive().optional(),
    prescription_note: z.string().optional().nullable(),
    display_order: z.coerce.number().int().positive().optional(),
  })).optional(),
});

const addRecItemSchema = z.object({
  item_type: z.enum(['track','playlist']),
  track_id: z.coerce.number().int().positive().optional(),
  playlist_id: z.coerce.number().int().positive().optional(),
  prescription_note: z.string().optional().nullable(),
  display_order: z.coerce.number().int().positive().optional(),
});

const patchRecItemSchema = z.object({
  prescription_note: z.string().optional().nullable(),
  display_order: z.coerce.number().int().positive().optional(),
});

const updateRecStatusSchema = z.object({
  status: RStatus,
});

const upsertFeedbackSchema = z.object({
  feedback: Feedback,
  comment: z.string().optional().nullable(),
});

const templateCreateSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: Category.optional().nullable(),
  mood: Mood.optional().nullable(),
});

const templateListSchema = z.object({
  category: Category.optional(),
  mood: Mood.optional(),
  q: z.string().optional(),
});

const templateUpdateSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  category: Category.optional().nullable(),
  mood: Mood.optional().nullable(),
});

const listFollowupsSchema = z.object({
  status: FUStatus.optional(),
  before: z.string().datetime().optional(),
  after: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

const followupSentSchema = z.object({
  // body empty; path provides id
});

const followupResponseSchema = z.object({
  response: FUResp,
  notes: z.string().optional().nullable(),
});

/* ============================
 * USER CONTROLLERS
 * ============================ */

async function createQuestionController(req, res) {
  try {
    const userId = req.user.id;
    const body = parse(createQuestionSchema, req.body ?? {});
    const id = await svc.createQuestion({ userId, ...body });
    created(res, { id });
  } catch (err) {
    bad(res, err.message);
  }
}

async function listMyQuestionsController(req, res) {
  try {
    const userId = req.user.id;
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 20);
    const rows = await svc.listUserQuestions({ userId, page, pageSize });
    ok(res, rows);
  } catch (err) {
    bad(res, err.message);
  }
}

async function getMyQuestionController(req, res) {
  try {
    const userId = req.user.id;
    const questionId = Number(req.params.id);
    const data = await svc.getQuestion({ questionId, forUserId: userId, adminView: false });
    if (!data) return bad(res, 'Not found', 404);
    ok(res, data);
  } catch (err) {
    bad(res, err.message);
  }
}

async function addMyMessageController(req, res) {
  try {
    const userId = req.user.id;
    const questionId = Number(req.params.id);
    const b = parse(addMessageSchema, { ...req.body, senderRole: 'user' });
    // ownership enforced in service via getQuestion path (indirect)
    const id = await svc.addMessage({
      questionId,
      senderId: userId,
      senderRole: 'user',
      body: b.body,
      attachment_url: b.attachment_url || null,
    });
    created(res, { id });
  } catch (err) {
    bad(res, err.message);
  }
}

async function getMyRecommendationController(req, res) {
  try {
    const userId = req.user.id;
    const recommendationId = Number(req.params.id);
    const data = await svc.getRecommendation({ recommendationId, forUserId: userId, adminView: false });
    if (!data) return bad(res, 'Not found', 404);
    ok(res, data);
  } catch (err) {
    bad(res, err.message);
  }
}

async function addItemFeedbackController(req, res) {
  try {
    const userId = req.user.id;
    const itemId = Number(req.params.itemId);
    const b = parse(upsertFeedbackSchema, req.body ?? {});
    await svc.upsertItemFeedback({ itemId, userId, feedback: b.feedback, comment: b.comment || null });
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

async function listMyFollowupsController(req, res) {
  try {
    const userId = req.user.id;
    const q = parse(listFollowupsSchema, req.query ?? {});
    const rows = await svc.listFollowups({
      userId,
      status: q.status,
      before: q.before,
      after: q.after,
      limit: q.limit,
    });
    ok(res, rows);
  } catch (err) {
    bad(res, err.message);
  }
}

async function recordMyFollowupResponseController(req, res) {
  try {
    const userId = req.user.id; // not strictly required, but can be checked in service with join if needed
    const followupId = Number(req.params.id);
    const b = parse(followupResponseSchema, req.body ?? {});
    await svc.recordFollowupResponse({ followupId, response: b.response, notes: b.notes || null });
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

/* ============================
 * ADMIN CONTROLLERS
 * ============================ */

async function adminGetQuestionController(req, res) {
  try {
    const questionId = Number(req.params.id);
    const data = await svc.getQuestion({ questionId, adminView: true });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    console.error('adminGetQuestion error:', err);
    res.status(400).json({ error: err.message });
  }
}

async function adminListQuestionsController(req, res) {
  try {
    const q = parse(listAdminQuestionsSchema, req.query ?? {});
    const rows = await svc.listAdminQuestions(q);
    ok(res, rows);
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminAssignQuestionController(req, res) {
  try {
    const adminId = req.user.id;
    const questionId = Number(req.params.id);
    const assignedTo = Number(req.body?.adminId || adminId);
    const okk = await svc.assignQuestion({ questionId, adminId: assignedTo });
    if (!okk) return bad(res, 'Not found', 404);
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminAddMessageController(req, res) {
  try {
    const adminId = req.user.id;
    const questionId = Number(req.params.id);
    const b = parse(addMessageSchema, { ...req.body, senderRole: 'admin' });
    const id = await svc.addMessage({
      questionId,
      senderId: adminId,
      senderRole: 'admin',
      body: b.body,
      attachment_url: b.attachment_url || null,
    });
    created(res, { id });
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminUpdateQuestionStatusController(req, res) {
  try {
    const questionId = Number(req.params.id);
    const b = parse(updateQuestionStatusSchema, req.body ?? {});
    const okk = await svc.updateQuestionStatus({ questionId, status: b.status });
    if (!okk) return bad(res, 'Not found', 404);
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

/* --- Recommendations (Admin) --- */

async function adminCreateRecommendationController(req, res) {
  try {
    const adminId = req.user.id;
    const b = parse(createRecommendationSchema, req.body ?? {});
    const id = await svc.createRecommendation({
      questionId: b.questionId,
      adminId,
      summary_note: b.summary_note || null,
      items: b.items || [],
    });
    created(res, { id });
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminAddRecommendationItemController(req, res) {
  try {
    const recommendationId = Number(req.params.id);
    const b = parse(addRecItemSchema, req.body ?? {});
    const id = await svc.addRecommendationItem({ recommendationId, ...b });
    created(res, { id });
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminUpdateRecommendationItemController(req, res) {
  try {
    const itemId = Number(req.params.itemId);
    const patch = parse(patchRecItemSchema, req.body ?? {});
    const okk = await svc.updateRecommendationItem({ itemId, ...patch });
    if (!okk) return bad(res, 'Not found or no changes', 404);
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminDeleteRecommendationItemController(req, res) {
  try {
    const itemId = Number(req.params.itemId);
    const okk = await svc.deleteRecommendationItem({ itemId });
    if (!okk) return bad(res, 'Not found', 404);
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminSendRecommendationController(req, res) {
  try {
    const recommendationId = Number(req.params.id);
    const okk = await svc.sendRecommendation({ recommendationId });
    if (!okk) return bad(res, 'Not found', 404);
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminUpdateRecommendationStatusController(req, res) {
  try {
    const recommendationId = Number(req.params.id);
    const b = parse(updateRecStatusSchema, req.body ?? {});
    const okk = await svc.updateRecommendationStatus({ recommendationId, status: b.status });
    if (!okk) return bad(res, 'Not found', 404);
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminGetRecommendationController(req, res) {
  try {
    const recommendationId = Number(req.params.id);
    const data = await svc.getRecommendation({ recommendationId, adminView: true });
    if (!data) return bad(res, 'Not found', 404);
    ok(res, data);
  } catch (err) {
    bad(res, err.message);
  }
}

/* --- Templates (Admin) --- */

async function adminCreateTemplateController(req, res) {
  try {
    const adminId = req.user.id;
    const b = parse(templateCreateSchema, req.body ?? {});
    const id = await svc.createTemplate({ adminId, ...b });
    created(res, { id });
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminListTemplatesController(req, res) {
  try {
    const adminId = req.user.id;
    const q = parse(templateListSchema, req.query ?? {});
    const rows = await svc.listTemplates({ adminId, ...q });
    ok(res, rows);
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminUpdateTemplateController(req, res) {
  try {
    const templateId = Number(req.params.id);
    const patch = parse(templateUpdateSchema, req.body ?? {});
    const okk = await svc.updateTemplate({ templateId, patch });
    if (!okk) return bad(res, 'Not found or no changes', 404);
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminDeleteTemplateController(req, res) {
  try {
    const templateId = Number(req.params.id);
    const okk = await svc.deleteTemplate({ templateId });
    if (!okk) return bad(res, 'Not found', 404);
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

/* --- Followups (Admin) --- */

async function adminListFollowupsController(req, res) {
  try {
    const q = parse(listFollowupsSchema, req.query ?? {});
    const rows = await svc.listFollowups({
      userId: req.query.userId ? Number(req.query.userId) : null,
      status: q.status,
      before: q.before,
      after: q.after,
      limit: q.limit,
    });
    ok(res, rows);
  } catch (err) {
    bad(res, err.message);
  }
}

async function adminMarkFollowupSentController(req, res) {
  try {
    const followupId = Number(req.params.id);
    parse(followupSentSchema, req.body ?? {});
    const okk = await svc.markFollowupSent({ followupId });
    if (!okk) return bad(res, 'Not found or not pending', 404);
    ok(res);
  } catch (err) {
    bad(res, err.message);
  }
}

/* ============================
 * Exports
 * ============================ */

module.exports = {
  // USER
  createQuestionController,
  listMyQuestionsController,
  getMyQuestionController,
  addMyMessageController,
  getMyRecommendationController,
  addItemFeedbackController,
  listMyFollowupsController,
  recordMyFollowupResponseController,

  // ADMIN
  adminGetQuestionController,
  adminListQuestionsController,
  adminAssignQuestionController,
  adminAddMessageController,
  adminUpdateQuestionStatusController,

  adminCreateRecommendationController,
  adminAddRecommendationItemController,
  adminUpdateRecommendationItemController,
  adminDeleteRecommendationItemController,
  adminSendRecommendationController,
  adminUpdateRecommendationStatusController,
  adminGetRecommendationController,

  adminCreateTemplateController,
  adminListTemplatesController,
  adminUpdateTemplateController,
  adminDeleteTemplateController,

  adminListFollowupsController,
  adminMarkFollowupSentController,
};
