// src/controllers/blogController.js
const blogService = require('../services/blogService');
const blogCatService = require('../services/blogCategoryService');

/* ================================
   PUBLIC LIST
================================ */
exports.listBlogsPublic = async (req, res) => {
  try {
    const blogs = await blogService.listBlogsPublic();

    for (const b of blogs) {
      if (Array.isArray(b.categories)) {
        b.categories.sort((a, b2) => a.name.localeCompare(b2.name));
      }
    }

    return res.json({ success: true, data: blogs });
  } catch (err) {
    console.error('listBlogsPublic error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/* ================================
   GET BY SLUG + SEO redirect chain
================================ */
exports.getBlogBySlugPublic = async (req, res) => {
  try {
    let slug = req.params.slug.toLowerCase();
    const seen = new Set();

    while (!seen.has(slug)) {
      seen.add(slug);

      const blog = await blogService.getBlogBySlug(slug);
      if (blog) {
        if (Array.isArray(blog.categories)) {
          blog.categories.sort((a, b2) => a.name.localeCompare(b2.name));
        }
        return res.json({ success: true, data: blog });
      }

      const redirect = await blogService.getRedirect(slug);
      if (!redirect) break;

      slug = redirect.new_slug.toLowerCase();
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (err) {
    console.error('getBlogBySlugPublic error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/* ================================
   CATEGORY PAGE
================================ */
exports.listBlogsByCategorySlugPublic = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();

    const rows = await blogCatService.listBlogsByCategorySlug(slug);

    for (const b of rows) {
      b.categories = await blogCatService.getCategoriesForBlog(b.id);
      if (Array.isArray(b.categories)) {
        b.categories.sort((a, b2) => a.name.localeCompare(b2.name));
      }
    }

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('listBlogsByCategorySlugPublic error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
