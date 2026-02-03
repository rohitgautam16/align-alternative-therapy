// src/controllers/admin Controllers/adminBlogCategoryController.js
const blogCatService = require('../../services/blogCategoryService');

/* ===============================
   LIST (Manager + Inline Select)
=============================== */
exports.listCategoriesAdmin = async (req, res) => {
  try {
    const data = await blogCatService.listCategories();
    res.json({ success: true, data });
  } catch (err) {
    console.error('listCategoriesAdmin error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/* ===============================
   CREATE (Manager - explicit)
=============================== */
exports.createCategoryAdmin = async (req, res) => {
  try {
    const { name } = req.body;
    const id = await blogCatService.createCategory(name);
    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('createCategoryAdmin error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/* ===============================
   UPDATE (Manager)
=============================== */
exports.updateCategoryAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const { name } = req.body;
    await blogCatService.updateCategory(id, name);
    res.json({ success: true });
  } catch (err) {
    console.error('updateCategoryAdmin error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/* ===============================
   DELETE (Manager)
=============================== */
exports.deleteCategoryAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    await blogCatService.deleteCategory(id);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteCategoryAdmin error:', err);

    if (String(err.message).startsWith('CATEGORY_IN_USE:')) {
      const usage = Number(err.message.split(':')[1] || 0);
      return res.status(409).json({
        success: false,
        error: `Cannot delete category: used by ${usage} blog(s)`,
        usage,
      });
    }

    res.status(500).json({ success: false, error: 'Server error' });
  }
};


/* ===============================
   INLINE CREATE (Blog Editor)
   — silent create-or-return
=============================== */
exports.inlineCreateCategoryAdmin = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await blogCatService.createOrReturnCategory(name);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('inlineCreateCategoryAdmin error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.listCategoriesAdmin = async (req, res) => {
  try {
    const data = await blogCatService.listCategoriesWithUsage();
    res.json({ success: true, data });
  } catch (err) {
    console.error('listCategoriesAdmin error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};


exports.listBlogsByCategorySlugPublic = async (req, res) => {
  try {
    const slug = req.params.slug?.toLowerCase();

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Category slug required',
      });
    }

    const blogs = await blogCatService.listBlogsByCategorySlug(slug);

    return res.json({
      success: true,
      data: blogs,
    });
  } catch (err) {
    console.error('listBlogsByCategorySlugPublic error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
