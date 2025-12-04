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
       description,
       tags,
       artwork_filename    AS artwork_filename,
       category_id         AS category_id,
       paid                AS paid,
       is_discoverable     AS is_discoverable,
       created             AS createdAt
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
       description,
       tags,
       artwork_filename AS image,
       category_id AS categoryId,
       paid             AS paid,
       is_discoverable  AS is_discoverable,
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
  description,
  tags,
  artwork_filename,
  category_id,
  paid,
  is_discoverable = 1      // 👈 NEW: default discoverable
}) {
  const [result] = await db.query(
    `INSERT INTO playlists
       (title, slug, description, tags, artwork_filename, category_id, paid, is_discoverable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, description || '', tags || null, artwork_filename || null, category_id || null, paid, is_discoverable]
  );
  return getPlaylistById(result.insertId);
}

async function updatePlaylistAdmin(
  id,
  { title, slug, description, tags, artwork_filename, category_id, paid = 1 } 
) {
  await db.query(
    `UPDATE playlists
        SET title            = ?,
            slug             = ?,
            description      = ?,
            tags             = ?,
            artwork_filename = ?,
            category_id      = ?,
            paid             = ?
      WHERE id = ?`,
    [
      title, 
      slug, 
      description || '', 
      tags || null, 
      artwork_filename || null, 
      category_id || null, 
      paid,  
      id
    ]
  );
  return getPlaylistById(id);
}


async function deletePlaylistAdmin(id) {
  await db.query(`DELETE FROM playlists WHERE id = ?`, [id]);
}

/**
 * 👇 NEW: only toggles discoverability, safe and isolated.
 */
async function setPlaylistDiscoverability(id, isDiscoverable) {
  const flag = isDiscoverable ? 1 : 0;
  await db.query(
    `UPDATE playlists
       SET is_discoverable = ?
     WHERE id = ?`,
    [flag, id]
  );
  return getPlaylistById(id);
}

module.exports = {
  listPlaylists,
  getPlaylistById,
  createPlaylistAdmin,
  updatePlaylistAdmin,
  deletePlaylistAdmin,
  setPlaylistDiscoverability
};
