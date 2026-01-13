const db = require('../../db');

/**
 * List categories with pagination.
 * @param {object} opts
 * @param {number} opts.page     — 1‑based page number
 * @param {number} opts.pageSize — number of items per page
 */


async function listCategories({ page = 1, pageSize = 20 } = {}) {
  // Normalize inputs
  page     = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  // 1. Total Count
  const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM categories`);
  const total = countRows[0]?.total || 0;

  // 2. Paged Data with Playlist Count (New Logic)
  const [rows] = await db.query(
    `SELECT
       c.id,
       c.title,
       c.slug,
       c.description,
       c.artwork_filename AS image,  -- normalized alias for frontend
       c.artwork_filename,           -- raw column if needed
       c.tags,
       c.created_at,
       COUNT(cp.playlist_id) as playlistCount -- ✅ NEW: Counts linked playlists
     FROM categories c
     LEFT JOIN category_playlists cp ON c.id = cp.category_id
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );

  return { data: rows, total, page, pageSize };
}

async function getCategoryById(id) {
  const [rows] = await db.query(
    `SELECT id, title, slug, description, tags, artwork_filename AS image, created_at
       FROM categories
      WHERE id = ?`,
    [id]
  );
  return rows[0];
}

async function createCategoryAdmin({ title, slug, description, tags, artwork_filename }) {
  const [result] = await db.query(
    `INSERT INTO categories (title, slug, description, tags, artwork_filename)
     VALUES (?, ?, ?, ?, ?)`,
    [title, slug, description || '', tags || null, artwork_filename || null]
  );
  return getCategoryById(result.insertId);
}

async function updateCategoryAdmin(id, { title, slug, description, tags, artwork_filename }) {
  await db.query(
    `UPDATE categories
        SET title            = ?,
            slug             = ?,
            description      = ?,
            tags             = ?,
            artwork_filename = ?
      WHERE id = ?`,
    [title, slug, description || '', tags || null, artwork_filename || null, id]
  );
  return getCategoryById(id);
}

async function deleteCategoryAdmin(id) {
  await db.query(`DELETE FROM categories WHERE id = ?`, [id]);
}

async function getPlaylistsForCategory(categoryId) {
  const [rows] = await db.query(
    `SELECT 
        p.*, 
        c.title as category_title
     FROM playlists p
     JOIN category_playlists cp ON p.id = cp.playlist_id
     JOIN categories c ON c.id = cp.category_id
     WHERE cp.category_id = ?
     ORDER BY cp.created_at DESC`,
    [categoryId]
  );
  return rows;
}

async function addPlaylistToCategory(categoryId, playlistId) {
  await db.query(
    `INSERT IGNORE INTO category_playlists (category_id, playlist_id) VALUES (?, ?)`,
    [categoryId, playlistId]
  );
  return { success: true };
}

async function removePlaylistFromCategory(categoryId, playlistId) {
  await db.query(
    `DELETE FROM category_playlists WHERE category_id = ? AND playlist_id = ?`,
    [categoryId, playlistId]
  );
  return { success: true };
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
  getPlaylistsForCategory,
  addPlaylistToCategory,
  removePlaylistFromCategory
};
