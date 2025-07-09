const {
  listCategories,
  getCategoryById,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin
} = require('../../services/admin services/adminCategoryService');

/**
 * GET /api/admin/categories?page=&pageSize=
 */
async function listCategoriesController(req, res, next) {
  try {
    const page     = req.query.page;
    const pageSize = req.query.pageSize;
    const result = await listCategories({ page, pageSize });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getCategoryController(req, res, next) {
  try {
    const cat = await getCategoryById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Not found' });
    res.json(cat);
  } catch (err) {
    next(err);
  }
}

async function createCategoryController(req, res, next) {
  try {
    const { title, slug, tags, artwork_filename } = req.body;
    if (!title || !slug) {
      return res.status(400).json({ error: 'title and slug required' });
    }
    const newCat = await createCategoryAdmin({ title, slug, tags, artwork_filename });
    res.status(201).json(newCat);
  } catch (err) {
    next(err);
  }
}

async function updateCategoryController(req, res, next) {
  try {
    const { title, slug, tags, artwork_filename } = req.body;
    const updated = await updateCategoryAdmin(req.params.id, { title, slug, tags, artwork_filename });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteCategoryController(req, res, next) {
  try {
    await deleteCategoryAdmin(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategoriesController,
  getCategoryController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
};
