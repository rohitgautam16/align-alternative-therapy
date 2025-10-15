// controllers/adminbasicPersonalizecontroller.js
const db = require('../../db');
const { sendMail } = require('../../mail/mailer');

const ok  = (res, data)      => res.json(data);
const bad = (res, code, msg) => res.status(code).json({ error: msg });
const row = (x) => Array.isArray(x) ? x[0] : x;

/* ========= SEARCH (PB-only, robust, query REQUIRED) ========= */

// Search users by email or full_name (no default list)
exports.searchUsers = async (req, res) => {
  try {
    const qRaw = (req.query.q || '').trim();
    if (qRaw.length < 2) return res.json({ data: [], total: 0 });

    // normalize (collapse spaces), lowercase pattern
    const q = qRaw.replace(/\s+/g, ' ');
    const like = `%${q.toLowerCase()}%`;

    const [rows] = await db.query(
      `
      SELECT id, email, full_name
      FROM users
      WHERE LOWER(email) LIKE ?
         OR LOWER(COALESCE(full_name, '')) LIKE ?
      ORDER BY id DESC
      LIMIT 50
      `,
      [like, like]
    );

    res.json({ data: rows, total: rows.length });
  } catch (e) {
    console.error('pb searchUsers', e);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// Search songs via audio_metadata (title/name/artist)
exports.searchSongs = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return ok(res, { data: [], total: 0 });

    const like = `%${q.replace(/[%_]/g, '\\$&')}%`;
    const [rows] = await db.query(
      `
      SELECT
        id,
        title,
        name,
        artist,
        artwork_filename AS image,
        cdn_url
      FROM audio_metadata
      WHERE (title LIKE ? OR name LIKE ? OR artist LIKE ?)
      ORDER BY id DESC
      LIMIT 50
      `,
      [like, like, like]
    );
    ok(res, { data: rows, total: rows.length });
  } catch (e) {
    console.error('pb searchSongs', e);
    bad(res, 500, 'Failed to search songs');
  }
};

// Search playlists by title/slug (PB)
exports.searchPlaylists = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return ok(res, { data: [], total: 0 });

    const like = `%${q.replace(/[%_]/g, '\\$&')}%`;
    const [rows] = await db.query(
      `
      SELECT
        id,
        title,
        slug,
        artwork_filename AS image,
        paid,
        COALESCE(NULLIF(title, ''), slug) AS display_title
      FROM playlists
      WHERE (title LIKE ? OR slug LIKE ?)
      ORDER BY id DESC
      LIMIT 50
      `,
      [like, like]
    );
    ok(res, { data: rows, total: rows.length });
  } catch (e) {
    console.error('pb searchPlaylists', e);
    bad(res, 500, 'Failed to search playlists');
  }
};



/* ========= ADMIN (requires requireAdmin) ========= */

/** List recommendations for a specific user (admin view) */
exports.listForUser = async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) return bad(res, 400, 'userId required');

    const [rows] = await db.query(
      `
      SELECT *
      FROM pb_recommendations
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
      `,
      [userId]
    );
    ok(res, rows);
  } catch (e) {
    console.error('pb listForUser', e);
    bad(res, 500, 'Failed to list recommendations');
  }
};

/** Create a new recommendation draft for a user (optionally with items) */
exports.create = async (req, res) => {
  try {
    const { userId, title, summary_note, items } = req.body || {};
    if (!userId) return bad(res, 400, 'userId required');

    const [r] = await db.query(
      `
      INSERT INTO pb_recommendations (user_id, title, summary_note, status, created_at, updated_at)
      VALUES (?, ?, ?, 'draft', NOW(), NOW())
      `,
      [userId, title || null, summary_note || null]
    );
    const recId = r.insertId;

    if (Array.isArray(items) && items.length) {
      const now = new Date();
      const values = items.map(it => ([
        recId,
        it.item_type,
        it.item_type === 'track'    ? (it.track_id || null)    : null,
        it.item_type === 'playlist' ? (it.playlist_id || null) : null,
        it.prescription_note || null,
        it.display_order || null,
        now, now,
      ]));
      await db.query(
        `
        INSERT INTO pb_recommendation_items
          (recommendation_id, item_type, track_id, playlist_id, prescription_note, display_order, created_at, updated_at)
        VALUES ?
        `,
        [values]
      );
    }

    ok(res, { id: recId });
  } catch (e) {
    console.error('pb create', e);
    bad(res, 500, 'Failed to create recommendation');
  }
};


/** Load a recommendation + items (admin view) */
exports.getOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[rec]] = await db.query(
      `SELECT * FROM pb_recommendations WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    if (!rec) return bad(res, 404, 'Not found');

    const [items] = await db.query(
      `
      SELECT *
      FROM pb_recommendation_items
      WHERE recommendation_id = ? AND deleted_at IS NULL
      ORDER BY COALESCE(display_order, id) ASC
      `,
      [id]
    );

    // Enrich items with names/images using audio_metadata & playlists
    const trackIds = items.filter(i => i.item_type === 'track' && i.track_id).map(i => i.track_id);
    const playlistIds = items.filter(i => i.item_type === 'playlist' && i.playlist_id).map(i => i.playlist_id);

    let trackMap = new Map();
if (trackIds.length) {
  const [srows] = await db.query(
    `
    SELECT
      id,
      title,
      name,
      artist       AS artist,
      artwork_filename AS image,
      cdn_url      AS audio_url,
      slug
    FROM audio_metadata
    WHERE id IN (${trackIds.map(()=>'?').join(',')})
    `,
    trackIds
  );
  trackMap = new Map(srows.map(s => [Number(s.id), s]));
}

// PLAYLISTS from playlists (artwork_filename -> image)
let playlistMap = new Map();
if (playlistIds.length) {
  const [prows] = await db.query(
    `
    SELECT
      id,
      title,
      slug,
      artwork_filename AS image,
      paid,
      COALESCE(NULLIF(title, ''), slug) AS display_title
    FROM playlists
    WHERE id IN (${playlistIds.map(()=>'?').join(',')})
    `,
    playlistIds
  );
  playlistMap = new Map(prows.map(p => [Number(p.id), p]));
}

const enriched = items.map(i => {
  if (i.item_type === 'track') {
    const s = trackMap.get(Number(i.track_id));
    return { ...i, track: s || null };
  } else {
    const p = playlistMap.get(Number(i.playlist_id));
    return { ...i, playlist: p || null };
  }
});

    ok(res, { recommendation: rec, items: enriched });
  } catch (e) {
    console.error('pb getOne', e);
    bad(res, 500, 'Failed to load recommendation');
  }
};

/** Add an item to a recommendation (admin) */
exports.addItem = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { item_type, track_id, playlist_id, prescription_note, display_order } = req.body || {};

    await db.query(
      `
      INSERT INTO pb_recommendation_items
        (recommendation_id, item_type, track_id, playlist_id, prescription_note, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        id,
        item_type,
        item_type === 'track'    ? (track_id || null)    : null,
        item_type === 'playlist' ? (playlist_id || null) : null,
        prescription_note || null,
        display_order || null
      ]
    );
    ok(res, { ok: true });
  } catch (e) {
    console.error('pb addItem', e);
    bad(res, 500, 'Failed to add item');
  }
};

/** Update an item (admin) */
exports.updateItem = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    const patch = req.body || {};
    const cols = [];
    const vals = [];

    for (const k of ['item_type','track_id','playlist_id','prescription_note','display_order']) {
      if (k in patch) {
        if (k === 'track_id' && patch.item_type === 'playlist') vals.push(null);
        else if (k === 'playlist_id' && patch.item_type === 'track') vals.push(null);
        else vals.push(patch[k]);
        cols.push(`${k} = ?`);
      }
    }
    if (!cols.length) return ok(res, { ok: true, noop: true });

    vals.push(itemId);
    await db.query(
      `
      UPDATE pb_recommendation_items
      SET ${cols.join(', ')}, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
      `,
      vals
    );
    ok(res, { ok: true });
  } catch (e) {
    console.error('pb updateItem', e);
    bad(res, 500, 'Failed to update item');
  }
};

/** Soft-delete an item (admin) */
exports.deleteItem = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    await db.query(
      `UPDATE pb_recommendation_items SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [itemId]
    );
    ok(res, { ok: true });
  } catch (e) {
    console.error('pb deleteItem', e);
    bad(res, 500, 'Failed to delete item');
  }
};

/** Soft-delete a recommendation (admin) */
exports.deleteRecommendation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const cascade = req.query.cascade === 'true'; // optional query param

    if (!id) return bad(res, 400, 'id required');

    // Step 1: Soft delete the recommendation
    const [result] = await db.query(
      `UPDATE pb_recommendations SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (result.affectedRows === 0) {
      return bad(res, 404, 'Recommendation not found or already deleted');
    }

    // Step 2: Optional cascade delete its items
    if (cascade) {
      await db.query(
        `UPDATE pb_recommendation_items SET deleted_at = NOW(), updated_at = NOW() WHERE recommendation_id = ? AND deleted_at IS NULL`,
        [id]
      );
    }

    ok(res, { ok: true, deleted: id, cascade });
  } catch (e) {
    console.error('pb deleteRecommendation', e);
    bad(res, 500, 'Failed to delete recommendation');
  }
};


/** Restore a soft-deleted recommendation (admin) */
exports.restoreRecommendation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return bad(res, 400, 'id required');

    // Step 1: Check if record exists and is deleted
    const [[rec]] = await db.query(
      `SELECT id FROM pb_recommendations WHERE id = ? AND deleted_at IS NOT NULL`,
      [id]
    );
    if (!rec) return bad(res, 404, 'Recommendation not found or not deleted');

    // Step 2: Restore recommendation
    await db.query(
      `UPDATE pb_recommendations SET deleted_at = NULL, updated_at = NOW() WHERE id = ?`,
      [id]
    );

    // Step 3 (optional): restore items if cascade restore requested
    if (req.query.cascade === 'true') {
      await db.query(
        `UPDATE pb_recommendation_items SET deleted_at = NULL, updated_at = NOW() WHERE recommendation_id = ?`,
        [id]
      );
    }

    ok(res, { ok: true, restored: id, cascade: req.query.cascade === 'true' });
  } catch (e) {
    console.error('pb restoreRecommendation', e);
    bad(res, 500, 'Failed to restore recommendation');
  }
};

/** List deleted recommendations for a specific user (admin view) */
exports.listDeletedForUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return bad(res, 400, 'userId required');

    const [rows] = await db.query(
      `
      SELECT *
      FROM pb_recommendations
      WHERE user_id = ? AND deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
      `,
      [userId]
    );

    ok(res, rows);
  } catch (e) {
    console.error('pb listDeletedForUser', e);
    bad(res, 500, 'Failed to list deleted recommendations');
  }
};


exports.hardDeleteRecommendation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return bad(res, 400, 'id required');

    // Fetch first
    const [[rec]] = await db.query(
      `SELECT id, deleted_at FROM pb_recommendations WHERE id = ?`,
      [id]
    );
    if (!rec) return bad(res, 404, 'Recommendation not found');
    if (!rec.deleted_at)
      return bad(res, 400, 'Recommendation must be soft-deleted first');

    await db.query(`DELETE FROM pb_recommendation_items WHERE recommendation_id = ?`, [id]);
    await db.query(`DELETE FROM pb_recommendations WHERE id = ?`, [id]);

    ok(res, { ok: true, permanently_deleted: id });
  } catch (e) {
    console.error('pb hardDeleteRecommendation', e);
    bad(res, 500, 'Failed to permanently delete recommendation');
  }
};



/** Update rec status (admin) */
exports.updateStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!status) return bad(res, 400, 'status required');

    await db.query(
      `
      UPDATE pb_recommendations
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
      `,
      [status, id]
    );
    ok(res, { ok: true });
  } catch (e) {
    console.error('pb updateStatus', e);
    bad(res, 500, 'Failed to update status');
  }
};

/** Mark as sent and optionally email user (admin) */
exports.sendNow = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // ✅ use PB tables
    const [[rec]] = await db.query(
      `SELECT * FROM pb_recommendations WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    if (!rec) return bad(res, 404, 'Not found');
    if (!rec.user_id) return bad(res, 400, 'No user mapped');

    const [[user]] = await db.query(
      `SELECT id, email, full_name AS name FROM users WHERE id = ?`,
      [rec.user_id]
    );

    await db.query(
      `
      UPDATE pb_recommendations
      SET status = 'sent', sent_at = NOW(), updated_at = NOW()
      WHERE id = ?
      `,
      [id]
    );

    // Optional: notify user via email
    // await sendMail({ to: user.email, subject: 'You have a new recommendation', text: 'Log in to view your plan.' });

    ok(res, { ok: true });
  } catch (e) {
    console.error('pb sendNow', e);
    bad(res, 500, 'Failed to send');
  }
};

/* ========= USER (requires requireAuth) ========= */

/** List the current user's PB recommendations (for dashboard) */
exports.listMineForCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return bad(res, 401, 'Unauthorized');

    // ✅ Only fetch active recommendations (exclude withdrawn & drafts)
    const [recs] = await db.query(
      `
      SELECT *
      FROM pb_recommendations
      WHERE user_id = ?
        AND deleted_at IS NULL
        AND status IN ('sent', 'updated')
      ORDER BY created_at DESC
      `,
      [userId]
    );

    if (!recs.length) return ok(res, []);

    const ids = recs.map(r => r.id);
    const [items] = await db.query(
      `
      SELECT *
      FROM pb_recommendation_items
      WHERE deleted_at IS NULL
        AND recommendation_id IN (${ids.map(() => '?').join(',')})
      ORDER BY recommendation_id ASC, COALESCE(display_order, id) ASC
      `,
      ids
    );

    // Build maps for track and playlist enrichment
    const trackIds = items
      .filter(i => i.item_type === 'track' && i.track_id)
      .map(i => Number(i.track_id));
    const playlistIds = items
      .filter(i => i.item_type === 'playlist' && i.playlist_id)
      .map(i => Number(i.playlist_id));

    let trackMap = new Map();
    if (trackIds.length) {
      const [srows] = await db.query(
        `
        SELECT
          id,
          title,
          name,
          artist,
          artwork_filename AS image,
          cdn_url AS audio_url,
          slug
        FROM audio_metadata
        WHERE id IN (${trackIds.map(() => '?').join(',')})
        `,
        trackIds
      );
      trackMap = new Map(srows.map(s => [Number(s.id), s]));
    }

    let playlistMap = new Map();
    if (playlistIds.length) {
      const [prows] = await db.query(
        `
        SELECT
          id,
          title,
          slug,
          artwork_filename AS image,
          paid,
          COALESCE(NULLIF(title, ''), slug) AS display_title
        FROM playlists
        WHERE id IN (${playlistIds.map(() => '?').join(',')})
        `,
        playlistIds
      );
      playlistMap = new Map(prows.map(p => [Number(p.id), p]));
    }

    // Group items by recommendation
    const byRec = new Map();
    for (const it of items) {
      const enriched =
        it.item_type === 'track'
          ? { ...it, track: trackMap.get(Number(it.track_id)) || null }
          : { ...it, playlist: playlistMap.get(Number(it.playlist_id)) || null };
      if (!byRec.has(it.recommendation_id)) byRec.set(it.recommendation_id, []);
      byRec.get(it.recommendation_id).push(enriched);
    }

    // ✅ Return newest first
    ok(
      res,
      recs.map(r => ({
        recommendation: r,
        items: byRec.get(r.id) || [],
      }))
    );
  } catch (e) {
    console.error('pb listMineForCurrentUser', e);
    bad(res, 500, 'Failed to list your recommendations');
  }
};



