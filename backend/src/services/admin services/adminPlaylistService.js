// src/services/adminPlaylistService.js
const db = require('../../db');

/**
 * List playlists with pagination.
 * @param {object} opts
 * @param {number} opts.page     — 1‑based page number
 * @param {number} opts.pageSize — items per page
 */
async function listPlaylists({ page = 1, pageSize = 20 } = {}) {
  // Normalize inputs
  page     = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  // 1) total count
  const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM playlists`);
  const total = countRows[0]?.total || 0;

  // 2) paged data — use `created` column
  const [rows] = await db.query(
    `SELECT
       id,
       title,
       slug,
       tags,
       artwork_filename AS artwork_filename,
       category_id    AS category_id,
       created         AS createdAt
     FROM playlists
     ORDER BY created DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );

  return { data: rows, total, page, pageSize };
}

async function getPlaylistById(id) {
  const [rows] = await db.query(
    `SELECT
       id,
       title,
       slug,
       tags,
       artwork_filename AS image,
       category_id AS categoryId,
       created AS createdAt
     FROM playlists
     WHERE id = ?`,
    [id]
  );
  return rows[0];
}

async function createPlaylistAdmin({
  title,
  slug,
  tags,
  artwork_filename,
  category_id
}) {
  const [result] = await db.query(
    `INSERT INTO playlists
       (title, slug, tags, artwork_filename, category_id)
     VALUES (?, ?, ?, ?, ?)`,
    [title, slug, tags || null, artwork_filename || null, category_id || null]
  );
  return getPlaylistById(result.insertId);
}

async function updatePlaylistAdmin(
  id,
  { title, slug, tags, artwork_filename, category_id }
) {
  await db.query(
    `UPDATE playlists
        SET title            = ?,
            slug             = ?,
            tags             = ?,
            artwork_filename = ?,
            category_id      = ?
      WHERE id = ?`,
    [title, slug, tags || null, artwork_filename || null, category_id || null, id]
  );
  return getPlaylistById(id);
}

async function deletePlaylistAdmin(id) {
  await db.query(`DELETE FROM playlists WHERE id = ?`, [id]);
}

module.exports = {
  listPlaylists,
  getPlaylistById,
  createPlaylistAdmin,
  updatePlaylistAdmin,
  deletePlaylistAdmin,
};
