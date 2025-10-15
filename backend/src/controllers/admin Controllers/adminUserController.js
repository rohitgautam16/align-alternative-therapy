// src/controllers/adminUserController.js
const {
  listUsers,
  listRecommendedUsers,
  getUserById,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  listAdmins
} = require('../../services/admin services/adminUserService');


async function listAdminsController(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const result = await listAdmins({ page, pageSize });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/users?page=&pageSize=
 */
async function listUsersController(req, res, next) {
  try {
    const page     = req.query.page;
    const pageSize = req.query.pageSize;
    const search   = req.query.search || ''; // Add search parameter

    console.log('📥 Received params:', { page, pageSize, search }); // Debug

    const result = await listUsers({ page, pageSize, search });
    
    console.log('📤 Sending response:', {
      dataCount: result.data.length,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }); // Debug
    
    res.json(result);
  } catch (err) {
    console.error('❌ Error in listUsersController:', err);
    next(err);
  }
}



async function listRecommendationUsersController(req, res, next) {
  try {
    const page = req.query.page;
    const pageSize = req.query.pageSize;

    const result = await listRecommendedUsers({ page, pageSize });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listRecommendationUsersController };


async function getUserController(req, res, next) {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function createUserController(req, res, next) {
  try {
    const { email, password, full_name, user_roles, active, status_message } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email + password required' });
    }
    const newUser = await createUserAdmin({ email, password, full_name, user_roles, active, status_message });
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
}

async function updateUserController(req, res, next) {
  try {
    const { full_name, status_message, user_roles, active, is_subscribed } = req.body;
    const updated = await updateUserAdmin(req.params.id, { full_name, status_message, user_roles, active, is_subscribed });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteUserController(req, res, next) {
  try {
    const userId = req.params.id;
    const ip     = req.ip;            // capture the admin’s IP
    await deleteUserAdmin(userId, ip);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAdminsController,
  listUsersController,
  listRecommendationUsersController,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
};
