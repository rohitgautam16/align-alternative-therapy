// src/services/blogService.js
const db = require('../db');
const slugify = require('../utils/slugify');
const blogCatService = require('./blogCategoryService');

/* =============================
   ADMIN LIST
============================= */
async function listBlogsAdmin() {
  const [rows] = await db.query(`
    SELECT id, slug, title, excerpt, cover_image, author, status,
           archived, published_at, created_at, updated_at
    FROM blogs
    ORDER BY updated_at DESC
  `);

  for (const r of rows) {
    r.categories = await blogCatService.getCategoriesForBlog(r.id);

    if (Array.isArray(r.categories)) {
      r.categories.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return rows;
}

/* =============================
   PUBLIC LIST
============================= */
async function listBlogsPublic() {
  const [rows] = await db.query(`
    SELECT id, slug, title, excerpt, cover_image, author, published_at
    FROM blogs
    WHERE status='published' AND archived=0
    ORDER BY published_at DESC
  `);

  for (const r of rows) {
    r.categories = await blogCatService.getCategoriesForBlog(r.id);

    if (Array.isArray(r.categories)) {
      r.categories.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return rows;
}

/* =============================
   ADMIN GET (single)
============================= */
async function getBlogAdmin(id) {
  const [rows] = await db.query(`SELECT * FROM blogs WHERE id=? LIMIT 1`, [id]);
  const b = rows[0];
  if (!b) return null;

  b.categories = await blogCatService.getCategoriesForBlog(id);

  if (Array.isArray(b.categories)) {
    b.categories.sort((a, b2) => a.name.localeCompare(b2.name));
  }

  return b;
}

/* =============================
   PUBLIC GET BY SLUG
============================= */
async function getBlogBySlug(slug) {
  const [rows] = await db.query(
    `SELECT * FROM blogs WHERE slug=? AND archived=0 LIMIT 1`,
    [slug]
  );
  const b = rows[0];
  if (!b) return null;

  b.categories = await blogCatService.getCategoriesForBlog(b.id);

  if (Array.isArray(b.categories)) {
    b.categories.sort((a, b2) => a.name.localeCompare(b2.name));
  }

  return b;
}

/* =============================
   REDIRECT (SEO)
============================= */
async function getRedirect(slug) {
  const [rows] = await db.query(
    `SELECT * FROM blog_redirects WHERE old_slug=? ORDER BY id DESC LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

/* =============================
   CREATE (DRAFT ALWAYS)
============================= */
async function createBlog(data) {
  const newSlug = slugify(data.slug || data.title);

  const [result] = await db.query(
    `
    INSERT INTO blogs (slug, title, excerpt, content, cover_image,
                       author, status, archived, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', 0, NOW(), NOW())
    `,
    [
      newSlug,
      data.title,
      data.excerpt,
      data.content,
      data.cover_image,
      data.author,
    ]
  );

  const blogId = result.insertId;

  if (Array.isArray(data.category_ids)) {
    await blogCatService.setBlogCategories(blogId, data.category_ids);
  }

  return blogId;
}

/* =============================
   UPDATE (with redirect)
============================= */
async function updateBlog(id, data) {
  const blog = await getBlogAdmin(id);
  if (!blog) throw new Error('Blog not found');

  let newSlug = blog.slug;
  if (data.slug && data.slug !== blog.slug) {
    newSlug = slugify(data.slug);
    await db.query(
      `
      INSERT INTO blog_redirects (blog_id, old_slug, new_slug)
      VALUES (?,?,?)
      `,
      [id, blog.slug, newSlug]
    );
  }

  await db.query(
    `
    UPDATE blogs
    SET slug=?, title=?, excerpt=?, content=?, cover_image=?, author=?,
        updated_at=NOW()
    WHERE id=?
    `,
    [
      newSlug,
      data.title,
      data.excerpt,
      data.content,
      data.cover_image,
      data.author,
      id,
    ]
  );

  if (Array.isArray(data.category_ids)) {
    await blogCatService.setBlogCategories(id, data.category_ids);
  }

  return true;
}

/* =============================
   STATUS ACTIONS
============================= */
async function publishBlog(id) {
  await db.query(
    `
    UPDATE blogs
    SET status='published', published_at=NOW(), updated_at=NOW()
    WHERE id=?
    `,
    [id]
  );
}

async function unpublishBlog(id) {
  await db.query(
    `
    UPDATE blogs
    SET status='draft', updated_at=NOW()
    WHERE id=?
    `,
    [id]
  );
}

async function archiveBlog(id) {
  await db.query(
    `
    UPDATE blogs
    SET archived=1, updated_at=NOW()
    WHERE id=?
    `,
    [id]
  );
}

async function unarchiveBlog(id) {
  await db.query(
    `
    UPDATE blogs
    SET archived=0, updated_at=NOW()
    WHERE id=?
    `,
    [id]
  );
}

async function deleteBlog(id) {
  await db.query(`DELETE FROM blogs WHERE id=?`, [id]);
}

module.exports = {
  listBlogsAdmin,
  listBlogsPublic,
  getBlogAdmin,
  getBlogBySlug,
  getRedirect,
  createBlog,
  updateBlog,
  publishBlog,
  unpublishBlog,
  archiveBlog,
  unarchiveBlog,
  deleteBlog,
};
