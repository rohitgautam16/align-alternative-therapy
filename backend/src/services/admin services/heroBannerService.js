// src/services/heroBannerService.js
const db = require('../../db');

/**
 * GET the singleton hero row
 */
const getHero = async () => {
  const [rows] = await db.query(
    `SELECT * FROM hero_banner 
     WHERE deleted_at IS NULL 
     ORDER BY id 
     LIMIT 1`
  );
  return rows[0] || null;
};

/**
 * UPSERT hero row
 * Only accepts URL + text inputs.
 * column_1_text is intentionally NOT updated.
 */
const upsertHero = async (payload = {}, adminId = null) => {
  const {
    video_url = null,
    mobile_video_url = null,
    marquee_text = null,
    column_2_text = null,
    column_3_text = null,
    overlay_opacity = 0.2
  } = payload;

  // Fetch existing
  const existing = await getHero();

  if (!existing) {
    // Create new row
    const [result] = await db.query(
      `INSERT INTO hero_banner 
       (video_url, mobile_video_url, marquee_text, column_2_text, column_3_text, overlay_opacity, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        video_url,
        mobile_video_url,
        marquee_text,
        column_2_text,
        column_3_text,
        overlay_opacity,
        adminId
      ]
    );

    const [rows] = await db.query(
      `SELECT * FROM hero_banner WHERE id = ?`,
      [result.insertId]
    );

    return rows[0];
  }

  // UPDATE existing row (skip column_1_text on purpose)
  await db.query(
    `UPDATE hero_banner
     SET video_url = ?, 
         mobile_video_url = ?, 
         marquee_text = ?, 
         column_2_text = ?, 
         column_3_text = ?, 
         overlay_opacity = ?, 
         updated_by = ?
     WHERE id = ?`,
    [
      video_url,
      mobile_video_url,
      marquee_text,
      column_2_text,
      column_3_text,
      overlay_opacity,
      adminId,
      existing.id
    ]
  );

  const [rows] = await db.query(
    `SELECT * FROM hero_banner WHERE id = ?`,
    [existing.id]
  );

  return rows[0];
};

module.exports = {
  getHero,
  upsertHero
};
