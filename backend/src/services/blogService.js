// src/services/blogService.js
const db = require('../db');
const slugify = require('../utils/slugify');

async function listBlogsAdmin() {
  const [rows] = await db.query(`
    SELECT id, slug, title, excerpt, cover_image, categories, author, status, archived, published_at, updated_at, created_at
    FROM blogs
    ORDER BY updated_at DESC
  `);

  // parse categories JSON
  return rows.map(r => ({
    ...r,
    categories: r.categories ? JSON.parse(r.categories) : [],
  }));
}

async function listBlogsPublic() {
  const [rows] = await db.query(`
    SELECT id, slug, title, excerpt, cover_image, categories, author, published_at
    FROM blogs
    WHERE status='published' AND archived=0
    ORDER BY published_at DESC
  `);

  return rows.map(r => ({
    ...r,
    categories: r.categories ? JSON.parse(r.categories) : [],
  }));
}

async function getBlogAdmin(id) {
  const [rows] = await db.query(`SELECT * FROM blogs WHERE id=?`, [id]);
  const b = rows[0];
  if (!b) return null;
  b.categories = b.categories ? JSON.parse(b.categories) : [];
  return b;
}

async function getBlogBySlug(slug) {
  const [rows] = await db.query(
    `SELECT * FROM blogs WHERE slug=? AND archived=0`,
    [slug]
  );
  const b = rows[0];
  if (!b) return null;
  b.categories = b.categories ? JSON.parse(b.categories) : [];
  return b;
}

async function getRedirect(slug) {
  const [rows] = await db.query(
    `SELECT * FROM blog_redirects WHERE old_slug=? ORDER BY id DESC LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

async function createBlog(data) {
  const slug = slugify(data.slug || data.title);
  const sql = `
    INSERT INTO blogs (slug, title, excerpt, content, cover_image, categories, author, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
  `;

  const [result] = await db.query(sql, [
    slug,
    data.title,
    data.excerpt,
    data.content,
    data.cover_image,
    JSON.stringify(data.categories || []),
    data.author,
  ]);

  return result.insertId;
}

async function updateBlog(id, data) {
  const blog = await getBlogAdmin(id);
  if (!blog) throw new Error('Blog not found');

  // slug change → redirect
  if (data.slug && data.slug !== blog.slug) {
    const newSlug = slugify(data.slug);
    await db.query(
      `INSERT INTO blog_redirects (blog_id, old_slug, new_slug) VALUES (?,?,?)`,
      [id, blog.slug, newSlug]
    );
    blog.slug = newSlug;
  }

  const sql = `
    UPDATE blogs
    SET slug=?, title=?, excerpt=?, content=?, cover_image=?, categories=?, author=?
    WHERE id=?
  `;
  await db.query(sql, [
    blog.slug,
    data.title,
    data.excerpt,
    data.content,
    data.cover_image,
    JSON.stringify(data.categories || []),
    data.author,
    id,
  ]);

  return true;
}

async function publishBlog(id) {
  await db.query(`
    UPDATE blogs
    SET status='published', published_at=NOW()
    WHERE id=?
  `, [id]);
}

async function unpublishBlog(id) {
  await db.query(`
    UPDATE blogs
    SET status='draft'
    WHERE id=?
  `, [id]);
}

async function archiveBlog(id) {
  await db.query(`UPDATE blogs SET archived=1 WHERE id=?`, [id]);
}

async function unarchiveBlog(id) {
  await db.query(`UPDATE blogs SET archived=0 WHERE id=?`, [id]);
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
