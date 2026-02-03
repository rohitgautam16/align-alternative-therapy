// src/controllers/admin Controllers/adminBlogController.js

const blogService = require('../../services/blogService');
const slugify = require('../../utils/slugify');

/* ================================
   LIST
================================ */
exports.listBlogsAdmin = async (req, res) => {
  try {
    const data = await blogService.listBlogsAdmin();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('listBlogsAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/* ================================
   GET ONE
================================ */
exports.getBlogAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const b = await blogService.getBlogAdmin(id);
    if (!b) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    return res.json({ success: true, data: b });
  } catch (err) {
    console.error('getBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/* ================================
   CREATE (always draft)
================================ */
exports.createBlogAdmin = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      author,
      category_ids,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title required' });
    }

    const id = await blogService.createBlog({
      title,
      slug: slugify(slug || title),
      excerpt,
      content,
      cover_image,
      author,
      category_ids: Array.isArray(category_ids) ? category_ids : [],
    });

    return res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('createBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/* ================================
   UPDATE (save draft)
================================ */
exports.updateBlogAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      author,
      category_ids,
    } = req.body;

    await blogService.updateBlog(id, {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      author,
      category_ids: Array.isArray(category_ids) ? category_ids : undefined,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('updateBlogAdmin error:', err);
    if (err.message === 'Blog not found') {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/* ================================
   STATUS OPS
================================ */
exports.publishBlogAdmin = async (req, res) => {
  try {
    await blogService.publishBlog(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('publishBlogAdmin error:', err);
    if (err.message === 'Blog not found') {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.unpublishBlogAdmin = async (req, res) => {
  try {
    await blogService.unpublishBlog(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('unpublishBlogAdmin error:', err);
    if (err.message === 'Blog not found') {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.archiveBlogAdmin = async (req, res) => {
  try {
    await blogService.archiveBlog(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('archiveBlogAdmin error:', err);
    if (err.message === 'Blog not found') {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.unarchiveBlogAdmin = async (req, res) => {
  try {
    await blogService.unarchiveBlog(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('unarchiveBlogAdmin error:', err);
    if (err.message === 'Blog not found') {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.deleteBlogAdmin = async (req, res) => {
  try {
    await blogService.deleteBlog(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteBlogAdmin error:', err);
    if (err.message === 'Blog not found') {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
