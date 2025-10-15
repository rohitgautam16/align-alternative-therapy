const db = require('../../db');

/**
 * List categories with pagination.
 * @param {object} opts
 * @param {number} opts.page     — 1‑based page number
 * @param {number} opts.pageSize — number of items per page
 */
async function listCategories({ page = 1, pageSize = 20 } = {}) {
  page     = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  // total count
  const countPromise = db.query(`SELECT COUNT(*) AS total FROM categories`);

  // paged data
  const dataPromise = db.query(
    `SELECT
       id, title, slug, description, tags, artwork_filename AS image, created_at
     FROM categories
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );

  const [[{ total }], [rows]] = await Promise.all([countPromise, dataPromise]);

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

module.exports = {
  listCategories,
  getCategoryById,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
};
