'use strict';

const {
  listUsers,
  listRecommendedUsers,
  getUserById,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  listAdmins
} = require('../../services/admin services/adminUserService');

// -----------------------------
// List all admins (paginated)
// -----------------------------
async function listAdminsController(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const result = await listAdmins({ page, pageSize });
    res.json(result);
  } catch (err) {
    console.error('❌ listAdminsController error:', err);
    next(err);
  }
}

// -----------------------------
// List all users (with search, pagination)
// -----------------------------
async function listUsersController(req, res, next) {
  try {
    const { page, pageSize, search = '' } = req.query;

    console.log('📥 listUsersController params:', { page, pageSize, search });

    const result = await listUsers({ page, pageSize, search });

    console.log('📤 listUsersController result summary:', {
      dataCount: result.data?.length || 0,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });

    res.json(result);
  } catch (err) {
    console.error('❌ listUsersController error:', err);
    next(err);
  }
}

// -----------------------------
// List recommendation users
// -----------------------------
async function listRecommendationUsersController(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const result = await listRecommendedUsers({ page, pageSize });
    res.json(result);
  } catch (err) {
    console.error('❌ listRecommendationUsersController error:', err);
    next(err);
  }
}

// -----------------------------
// Get user by ID
// -----------------------------
async function getUserController(req, res, next) {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('❌ getUserController error:', err);
    next(err);
  }
}

// -----------------------------
// Create a new user (admin panel)
// -----------------------------
async function createUserController(req, res, next) {
  try {
    const {
      email,
      password,
      full_name,
      user_roles,
      active,
      status_message,
      profile_type = 'free',
      user_tier_id = null,
      one_time_fee_amount = null,
      plan = null,             
      premium_option = null    
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('🟡 createUserController incoming payload:', {
      email,
      full_name,
      profile_type,
      one_time_fee_amount,
      plan,
      premium_option,
    });

    const newUser = await createUserAdmin({
      email,
      password,
      full_name,
      user_roles,
      active,
      status_message,
      profile_type,
      user_tier_id,
      one_time_fee_amount,
      plan,
      premium_option,  
    });

    console.log('✅ createUserController success:', {
      id: newUser?.id,
      profile_type,
      user_tier_id: newUser?.user_tier_id,
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error('❌ createUserController error:', err);
    next(err);
  }
}



// -----------------------------
// Update an existing user
// -----------------------------
async function updateUserController(req, res, next) {
  try {
    const {
      full_name,
      status_message,
      user_roles,
      active,
      is_subscribed,
      profile_type,
      user_tier_id,
      one_time_fee_amount,
      plan,             // 'monthly' or 'annual'
      premium_option,   // 'checkout' | 'trial' | 'free_access'
    } = req.body;

    const userId = req.params.id;

    console.log('🟡 updateUserController payload:', {
      userId,
      profile_type,
      one_time_fee_amount,
      plan,
      premium_option,
    });

    const updated = await updateUserAdmin(userId, {
      full_name,
      status_message,
      user_roles,
      active,
      is_subscribed,
      profile_type,
      user_tier_id,
      one_time_fee_amount,
      plan,
      premium_option, 
    });

    console.log('✅ updateUserController success:', {
      id: userId,
      profile_type: updated.profile_type,
      plan,
      premium_option,
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error('❌ updateUserController error:', err);
    res.status(500).json({ error: err.message || 'Failed to update user' });
  }
}




// -----------------------------
// Soft delete user (admin action)
// -----------------------------
async function deleteUserController(req, res, next) {
  try {
    const userId = req.params.id;
    const adminIp = req.ip;

    console.log('🗑️ deleteUserController:', { userId, adminIp });

    await deleteUserAdmin(userId, adminIp);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ deleteUserController error:', err);
    next(err);
  }
}

async function retryUserPaymentController(req, res, next) {
  try {
    const { id } = req.params;

    // 1) Load user
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2) Branch by type
    let paymentData = null;

    if (user.profile_type === 'recommendations_only') {
      // regenerate Stripe Payment Link for rec_only
      const amount = user.one_time_fee_amount || 499;
      paymentData = await generateOneTimePaymentLink(id, amount);
    } else if (user.profile_type === 'premium_full') {
      // regenerate Stripe subscription checkout
      const plan = user.subscription_type || 'monthly';
      const result = await createOrUpdateSubscriptionSession(id, plan);
      paymentData = result.session;
    } else {
      return res.status(400).json({ error: 'No payment required for this user type' });
    }

    // 3) Respond with new checkout link
    res.json({
      success: true,
      checkout_url: paymentData.url,
      stripe_id: paymentData.id || paymentData.paymentLinkId,
    });
  } catch (err) {
    console.error('❌ retryUserPaymentController error:', err);
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
  retryUserPaymentController
};
