const blogService = require('../../services/blogService');
const slugify = require('../../utils/slugify');

exports.listBlogsAdmin = async (req, res) => {
  try {
    const rows = await blogService.listBlogsAdmin();
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('listBlogsAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getBlogAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await blogService.getBlogAdmin(id);
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    return res.json({ success: true, data: blog });
  } catch (err) {
    console.error('getBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.createBlogAdmin = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      category,
      author,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title required' });
    }

    const id = await blogService.createBlog({
      title,
      slug: slugify(slug || title),
      excerpt,
      content,
      cover_image,
      category,
      author,
    });

    return res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('createBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateBlogAdmin = async (req, res) => {
  try {
    const id = req.params.id;

    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      category,
      author,
    } = req.body;

    const existing = await blogService.getBlogAdmin(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    await blogService.updateBlog(id, {
      title: title ?? existing.title,
      slug: slug ?? existing.slug,
      excerpt: excerpt ?? existing.excerpt,
      content: content ?? existing.content,
      cover_image: cover_image ?? existing.cover_image,
      category: category ?? existing.category,
      author: author ?? existing.author,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('updateBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.publishBlogAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await blogService.getBlogAdmin(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    await blogService.publishBlog(id);
    return res.json({ success: true });
  } catch (err) {
    console.error('publishBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.unpublishBlogAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await blogService.getBlogAdmin(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    await blogService.unpublishBlog(id);
    return res.json({ success: true });
  } catch (err) {
    console.error('unpublishBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.archiveBlogAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await blogService.getBlogAdmin(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    await blogService.archiveBlog(id);
    return res.json({ success: true });
  } catch (err) {
    console.error('archiveBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.unarchiveBlogAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await blogService.getBlogAdmin(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    await blogService.unarchiveBlog(id);
    return res.json({ success: true });
  } catch (err) {
    console.error('unarchiveBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.deleteBlogAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await blogService.getBlogAdmin(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    await blogService.deleteBlog(id);
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteBlogAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
