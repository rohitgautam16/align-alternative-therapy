// src/services/blogCategoryService.js
const db = require('../db');
const slugify = require('../utils/slugify');

/* ============================
   LIST (Admin & Inline Select)
============================ */
async function listCategories() {
  const [rows] = await db.query(`
    SELECT id, name, slug, created_at, updated_at
    FROM blog_categories
    ORDER BY name ASC
  `);
  return rows;
}

/* ============================
   GET SINGLE
============================ */
async function getCategory(id) {
  const [rows] = await db.query(`
    SELECT id, name, slug, created_at, updated_at
    FROM blog_categories
    WHERE id=? LIMIT 1
  `, [id]);
  return rows[0] || null;
}

/* ============================
   CREATE (Manager)
============================ */
async function createCategory(name) {
  const slug = slugify(name);
  const [result] = await db.query(`
    INSERT INTO blog_categories (name, slug, created_at, updated_at)
    VALUES (?, ?, NOW(), NOW())
  `, [name, slug]);

  return result.insertId;
}

/* ============================
   INLINE CREATE (Editor)
   — return existing if slug collides
============================ */
async function createOrReturnCategory(name) {
  const slug = slugify(name);

  // Check collision / return existing instead of duplicate
  const [exists] = await db.query(`
    SELECT id, name, slug
    FROM blog_categories
    WHERE slug=? LIMIT 1
  `, [slug]);

  if (exists[0]) {
    return exists[0];
  }

  // Insert new
  const [result] = await db.query(`
    INSERT INTO blog_categories (name, slug, created_at, updated_at)
    VALUES (?, ?, NOW(), NOW())
  `, [name, slug]);

  return { id: result.insertId, name, slug };
}

/* ============================
   UPDATE (Manager)
============================ */
async function updateCategory(id, name) {
  const slug = slugify(name);
  await db.query(`
    UPDATE blog_categories
    SET name=?, slug=?, updated_at=NOW()
    WHERE id=?
  `, [name, slug, id]);

  return true;
}

/* ============================
   DELETE (Manager)
============================ */
async function deleteCategory(id) {
  const usage = await countCategoryUsage(id);
  if (usage > 0) {
    throw new Error(`CATEGORY_IN_USE:${usage}`);
  }

  await db.query(`DELETE FROM blog_categories WHERE id=?`, [id]);
  return true;
}


/* ============================
   BLOG CATEGORY LINKS (JOIN)
============================ */

/**
 * Full overwrite strategy (simple)
 * Not recommended anymore for performance — replaced by updateLinks()
 */
async function setBlogCategories(blogId, categoryIds = []) {
  await db.query(`DELETE FROM blog_category_links WHERE blog_id=?`, [blogId]);

  if (!Array.isArray(categoryIds) || categoryIds.length === 0) return;

  const values = categoryIds.map(cid => [blogId, cid]);
  await db.query(`
    INSERT INTO blog_category_links (blog_id, category_id)
    VALUES ?
    ON DUPLICATE KEY UPDATE category_id = category_id
  `, [values]);
}

/**
 * Atomic diff strategy:
 * - inserts new links
 * - deletes removed links
 * - leaves unchanged links
 */
async function updateLinks(blogId, categoryIds = []) {
  const ids = [...new Set(categoryIds.map(i => Number(i)))];

  const [existing] = await db.query(`
    SELECT category_id
    FROM blog_category_links
    WHERE blog_id=?
  `, [blogId]);

  const existingIds = existing.map(r => r.category_id);

  const toInsert = ids.filter(id => !existingIds.includes(id));
  const toDelete = existingIds.filter(id => !ids.includes(id));

  if (toInsert.length > 0) {
    const values = toInsert.map(cid => [blogId, cid]);
    await db.query(`
      INSERT INTO blog_category_links (blog_id, category_id)
      VALUES ?
    `, [values]);
  }

  if (toDelete.length > 0) {
    await db.query(`
      DELETE FROM blog_category_links
      WHERE blog_id=? AND category_id IN (?)
    `, [blogId, toDelete]);
  }

  return { inserted: toInsert, deleted: toDelete };
}

/* ============================
   BLOG → CATEGORY HYDRATION
============================ */
async function getCategoriesForBlog(blogId) {
  const [rows] = await db.query(`
    SELECT c.id, c.name, c.slug
    FROM blog_categories c
    JOIN blog_category_links l ON l.category_id = c.id
    WHERE l.blog_id=?
    ORDER BY c.name ASC
  `, [blogId]);

  return rows;
}

/* ============================
   CATEGORY → BLOG LIST (Public)
============================ */
async function listBlogsByCategorySlug(slug) {
  const [rows] = await db.query(
    `
    SELECT b.*
    FROM blogs b
    JOIN blog_category_links l ON l.blog_id = b.id
    JOIN blog_categories c ON c.id = l.category_id
    WHERE c.slug = ?
      AND b.status = 'published'
      AND b.archived = 0
    ORDER BY b.published_at DESC
    `,
    [slug]
  );

  for (const b of rows) {
    b.categories = await getCategoriesForBlog(b.id);
    b.categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  return rows;
}


async function countCategoryUsage(categoryId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) as total 
     FROM blog_category_links 
     WHERE category_id=?`,
     [categoryId]
  );
  return rows[0]?.total ?? 0;
}

async function listCategoriesWithUsage() {
  const [rows] = await db.query(
    `SELECT c.id, c.name, c.slug,
            (SELECT COUNT(*) FROM blog_category_links l WHERE l.category_id=c.id) as usage_count,
            c.created_at, c.updated_at
     FROM blog_categories c
     ORDER BY c.name ASC`
  );
  return rows;
}


module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  setBlogCategories,      // still exported, used for bulk ops
  updateLinks,            // preferred atomic strategy
  getCategoriesForBlog,
  listBlogsByCategorySlug,
  createOrReturnCategory, // inline UX handler
  countCategoryUsage,
  listCategoriesWithUsage
};
