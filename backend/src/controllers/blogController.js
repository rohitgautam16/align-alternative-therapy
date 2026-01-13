// src/controllers/blogController.js
const blogService = require('../services/blogService');

exports.listBlogsPublic = async (req, res) => {
  try {
    const blogs = await blogService.listBlogsPublic();
    return res.json({
      success: true,
      data: blogs,
    });
  } catch (err) {
    console.error('listBlogsPublic error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getBlogBySlugPublic = async (req, res) => {
  try {
    const slug = req.params.slug;

    // direct hit
    const blog = await blogService.getBlogBySlug(slug);
    if (blog) {
      return res.json({
        success: true,
        data: blog,
      });
    }

    // check redirect chain
    const redirect = await blogService.getRedirect(slug);
    if (redirect) {
      return res.redirect(301, `/blog/${redirect.new_slug}`);
    }

    return res.status(404).json({
      success: false,
      error: 'Not found',
    });
  } catch (err) {
    console.error('getBlogBySlugPublic error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
