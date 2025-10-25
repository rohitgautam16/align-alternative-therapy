// src/services/adminSongService.js
const db = require('../../db');

/**
 * List songs with pagination.
 * @param {object} opts
 * @param {number} opts.page     — 1‑based page number
 * @param {number} opts.pageSize — items per page
 */
async function listSongs({ page = 1, pageSize = 20 } = {}) {
  page     = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  // 1) total count
  const countPromise = db.query(
    `SELECT COUNT(*) AS total
       FROM audio_metadata`
  );

  // 2) paged data
  const dataPromise = db.query(
    `SELECT
       id,
       name,
       title,
       slug,
       description,
       artist,
       tags,
       category,
       playlist AS playlistId,
       artwork_filename AS image,
       cdn_url AS audioUrl,
       created AS createdAt
     FROM audio_metadata
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );

  const [[{ total }], [rows]] = await Promise.all([countPromise, dataPromise]);
  return { data: rows, total, page, pageSize };
}

async function getSongById(id) {
  const [rows] = await db.query(
    `SELECT
       id,
       name,
       title,
       slug,
       description,
       artist,
       tags,
       category,
       playlist AS playlistId,
       artwork_filename AS image,
       cdn_url AS audioUrl,
       created AS createdAt,
       is_free
     FROM audio_metadata
     WHERE id = ?`,
    [id]
  );
  return rows[0];
}

async function generateUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 0;
  
  while (true) {
    const [existing] = await db.query(
      'SELECT id FROM audio_metadata WHERE slug = ?', 
      [slug]
    );
    
    if (existing.length === 0) {
      return slug;
    }
    
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}


async function createSongAdmin({
  name,
  title,
  slug,
  description,
  artist,
  tags,
  category,
  playlist,
  artwork_filename,
  cdn_url,
  is_free = 0 // default: not free
}) {
  const uniqueSlug = await generateUniqueSlug(slug);

  const [result] = await db.query(
    `INSERT INTO audio_metadata
       (name, title, slug, description, artist, tags, category, playlist, artwork_filename, cdn_url, is_free)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name || null,
      title,
      uniqueSlug,
      description || '',
      artist || null,
      tags || null,
      category || null,
      playlist || null,
      artwork_filename || null,
      cdn_url || null,
      is_free
    ]
  );

  return getSongById(result.insertId);
}

async function updateSongAdmin(id, fields) {
  const {
    name,
    title,
    slug,
    description,
    artist,
    tags,
    category,
    playlist,
    artwork_filename,
    cdn_url,
    is_free // allow updating this too
  } = fields;

  await db.query(
    `UPDATE audio_metadata
        SET name             = ?,
            title            = ?,
            slug             = ?,
            description      = ?,
            artist           = ?,
            tags             = ?,
            category         = ?,
            playlist         = ?,
            artwork_filename = ?,
            cdn_url          = ?,
            is_free          = ?
      WHERE id = ?`,
    [
      name || null,
      title,
      slug,
      description || '',
      artist || null,
      tags || null,
      category || null,
      playlist || null,
      artwork_filename || null,
      cdn_url || null,
      is_free ?? 0, // fallback
      id
    ]
  );

  return getSongById(id);
}

async function deleteSongAdmin(id) {
  await db.query(`DELETE FROM audio_metadata WHERE id = ?`, [id]);
}

module.exports = {
  listSongs,
  getSongById,
  generateUniqueSlug,
  createSongAdmin,
  updateSongAdmin,
  deleteSongAdmin,
};
