// src/routes.js
'use strict';
const express = require('express');
const db      = require('./db');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sendMail } = require('./mail/mailer'); 
const { passwordResetLimiter } = require('./middleware/rateLimiter');

// const upload = multer({ storage: multer.memoryStorage() });
const AWS = require('aws-sdk');
const mime       = require('mime-types');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

console.log("→ R2 endpoint:", process.env.R2_ENDPOINT);
console.log("→ R2 bucket:",  process.env.R2_BUCKET_NAME);
console.log("→ R2 Access Key present?", !!process.env.R2_ACCESS_KEY_ID);

const mm = require('music-metadata');
const fs   = require('fs');
const path = require('path');
const storage = multer.memoryStorage();
//const upload = multer({ storage });
const { requireAuth, requireAdmin } = require('./middleware/auth');
const { listUsers } = require('./controllers/admin Controllers/adminUserController');

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});


const router = express.Router();


router.get("/admin/r2/presign", async (req, res, next) => {
  try {
    const { filename, contentType, folder = "uploads" } = req.query;
    const key = `${folder}/${Date.now()}-${filename}`;

    console.log('🔑 Generating presigned URL:', {
      filename,
      contentType,
      folder,
      key,
      bucket: process.env.R2_BUCKET_NAME,
      endpoint: process.env.R2_ENDPOINT
    });

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });


    const url = await getSignedUrl(s3, command, { expiresIn: 300 });

    console.log('✅ Presigned URL generated successfully');
    console.log('Key:', key);
    console.log('CDN URL will be:', `${process.env.R2_CDN_URL}/${key}`);

    res.json({ url, key });
  } catch (err) {
    console.error('❌ Presign error:', err);
    next(err);
  }
});


async function runQuery(sql, params, stub) {
  try {
    const [rows] = await db.query(sql, params);
    return rows;
  } catch {
    return stub;
  }
}

async function uploadSongs(dirPath, prefix = '') {
  const items   = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];

  for (let item of items) {
    const fullPath = path.join(dirPath, item.name);
    const key      = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.isDirectory()) {
      const nested = await uploadSongs(fullPath, key);
      results.push(...nested);

    } else if (item.isFile() && /\.mp3$/i.test(item.name)) {
      const fileBuffer = fs.readFileSync(fullPath);

      
      let metadata = {};
      try {
        const meta = await mm.parseBuffer(fileBuffer, 'audio/mpeg', { duration: true });
        metadata = {
          title:    meta.common.title    || item.name,
          artist:   meta.common.artist   || null,
          album:    meta.common.album    || null,
          duration: meta.format.duration || null,
          bitrate:  meta.format.bitrate  || null
        };
      } catch (metaErr) {
        console.warn(`⚠️  Metadata parse failed for ${key}:`, metaErr.message);
      }

      
      try {
        await s3.putObject({
          Bucket:      process.env.R2_BUCKET_NAME,
          Key:         key,
          Body:        fileBuffer,
          ContentType: 'audio/mpeg',
        }).promise();

        console.log(` Uploaded → ${key}`);
        results.push({
          path:     key,
          metadata 
        });

      } catch (awsErr) {
        console.error(` Failed upload for ${key}:`, awsErr.message);
        results.push({ path: key, error: awsErr.message });
      }
    }
  }

  return results;
}


async function uploadImages(dirPath, prefix = '') {
  const items  = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];

  for (let item of items) {
    const fullPath = path.join(dirPath, item.name);
    
    const key = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.isDirectory()) {
      
      const nested = await uploadImages(fullPath, key);
      results.push(...nested);

    } else if (item.isFile()) {
      
      const contentType = mime.lookup(fullPath);
      if (!contentType || !contentType.startsWith('image/')) {
        
        continue;
      }

      const body = fs.readFileSync(fullPath);
      try {
        await s3.putObject({
          Bucket:      process.env.R2_BUCKET_NAME,
          Key:         key,
          Body:        body,
          ContentType: contentType,
        }).promise();

        console.log(` Image uploaded → ${key}`);
        results.push({ path: key, contentType });

      } catch (err) {
        console.error(` Failed to upload ${key}:`, err.message);
        results.push({ path: key, error: err.message });
      }
    }
  }

  return results;
}


const {
  getProfile,
  updateProfile,
  deleteAccount,
  restoreAccount,
} = require('./controllers/userController');

router.get('/user/profile', requireAuth, getProfile);
router.put('/user/update', requireAuth, updateProfile);
router.delete('/user/delete', requireAuth, deleteAccount);
router.post('/user/restore', requireAuth, restoreAccount);


const {
  registerController,
  loginController,
  refreshController,
  logoutController,
  adminLoginController,
} = require('./controllers/authController');


// Admin login endpoint
router.post('/auth/admin-login', adminLoginController);

// Public auth endpoints
router.post('/auth/register', registerController);
router.post('/auth/login',    loginController);

// Cookie-based token refresh & logout
router.post('/auth/refresh',  refreshController);
router.post('/auth/logout',   logoutController);

const {
  requestResetController,
  resetPasswordController,
} = require('./controllers/passwordResetController');

router.post('/password/forgot', passwordResetLimiter,requestResetController);
router.post('/password/reset', resetPasswordController);


// const { uploadImagesController } = require('./controllers/admin Controllers/r2UploadController');

// router.post('/upload-images', uploadImagesController);


// const { uploadSongsController   } = require('./controllers/uploadSongsController');

// router.post('/upload-songs', uploadSongsController);

// const { uploadGenericController   } = require('./controllers/uploadGenericController');

// router.post('/upload-folder-generic', uploadGenericController);

// const { deleteConfigFoldersController } = require('./controllers/deleteConfigFoldersController');

// router.delete('/delete-config-folders', deleteConfigFoldersController); // default prefixes

const pc = require('./controllers/playlistController');

const {
  createPlaylist,
  listPlaylists,
  updatePlaylist,
  deletePlaylist,
  addSong,
  removeSong,
  getUserPlaylistBySlugController
} = require('./controllers/playlistController');



// Get one playlist with its songs
router.get('/user-playlists/slug/:slug', requireAuth, pc.getUserPlaylistBySlugController);
router.get   ('/user-playlists/:id',           requireAuth, pc.getPlaylistDetails);


// Playlist CRUD
router.post   ('/user-playlists',                    requireAuth, pc.createPlaylist);
router.get    ('/user-playlists',                    requireAuth, pc.listPlaylists);
router.put    ('/user-playlists/:id',                requireAuth, pc.updatePlaylist);
router.delete ('/user-playlists/:id',                requireAuth, pc.deletePlaylist);

// Songs in playlist
router.post   ('/user-playlists/:id/songs',          requireAuth, pc.addSong);
router.delete ('/user-playlists/:id/songs/:songId',  requireAuth, pc.removeSong);

const { userPermissionController } = require('./controllers/userPermissionController');

router.get('/permissions', requireAuth, userPermissionController);

const { checkoutController, cancelSubscriptionController, subscriptionSummaryController, createBillingPortalSession, repairStripeLinksController } = require('./controllers/subscriptionController');

console.log('requireAuth:', typeof requireAuth);
console.log('checkoutController:', typeof checkoutController);
router.post('/subscribe/checkout', requireAuth, checkoutController);

router.post('/subscribe/cancel', requireAuth, cancelSubscriptionController);
router.get('/subscribe/summary', requireAuth, subscriptionSummaryController);
router.post('/billing/portal', requireAuth, createBillingPortalSession);
router.post('/admin/repair-stripe-links', requireAuth, repairStripeLinksController);

// Add-on Personalized Service
const personalize = require('./controllers/personalizeController');

router.post('/personalize/questions', requireAuth, personalize.createQuestionController);
router.get('/personalize/questions', requireAuth, personalize.listMyQuestionsController);
router.get('/personalize/questions/:id', requireAuth, personalize.getMyQuestionController);
router.post('/personalize/questions/:id/messages', requireAuth, personalize.addMyMessageController);

router.get('/personalize/recommendations/:id', requireAuth, personalize.getMyRecommendationController);
router.post('/personalize/items/:itemId/feedback', requireAuth, personalize.addItemFeedbackController);

router.get('/personalize/followups', requireAuth, personalize.listMyFollowupsController);
router.post('/personalize/followups/:id/response', requireAuth, personalize.recordMyFollowupResponseController);

// ADMIN
router.get('/personalize/admin/questions', requireAuth, requireAdmin, personalize.adminListQuestionsController);
router.get('/personalize/admin/questions/:id', requireAuth, requireAdmin, personalize.adminGetQuestionController);
router.post('/personalize/admin/questions/:id/assign', requireAuth, requireAdmin, personalize.adminAssignQuestionController);
router.post('/personalize/admin/questions/:id/messages', requireAuth, requireAdmin, personalize.adminAddMessageController);
router.patch('/personalize/admin/questions/:id/status', requireAuth, requireAdmin, personalize.adminUpdateQuestionStatusController);

router.post('/personalize/admin/recommendations', requireAuth, requireAdmin, personalize.adminCreateRecommendationController);
router.get('/personalize/admin/recommendations/:id', requireAuth, requireAdmin, personalize.adminGetRecommendationController);
router.post('/personalize/admin/recommendations/:id/items', requireAuth, requireAdmin, personalize.adminAddRecommendationItemController);
router.patch('/personalize/admin/recommendations/items/:itemId', requireAuth, requireAdmin, personalize.adminUpdateRecommendationItemController);
router.delete('/personalize/admin/recommendations/items/:itemId', requireAuth, requireAdmin, personalize.adminDeleteRecommendationItemController);
router.post('/personalize/admin/recommendations/:id/send', requireAuth, requireAdmin, personalize.adminSendRecommendationController);
router.patch('/personalize/admin/recommendations/:id/status', requireAuth, requireAdmin, personalize.adminUpdateRecommendationStatusController);

router.post('/personalize/admin/templates', requireAuth, requireAdmin, personalize.adminCreateTemplateController);
router.get('/personalize/admin/templates', requireAuth, requireAdmin, personalize.adminListTemplatesController);
router.patch('/personalize/admin/templates/:id', requireAuth, requireAdmin, personalize.adminUpdateTemplateController);
router.delete('/personalize/admin/templates/:id', requireAuth, requireAdmin, personalize.adminDeleteTemplateController);

router.get('/personalize/admin/followups', requireAuth, requireAdmin, personalize.adminListFollowupsController);
router.post('/personalize/admin/followups/:id/sent', requireAuth, requireAdmin, personalize.adminMarkFollowupSentController);


const {
  recordPlay,
  getRecentPlays,
  getRecentPlaylists,
  toggleFavSong,
  getFavSongs,
  toggleFavPlaylist,
  getFavPlaylists,
} = require('./controllers/userActivityController');

router.post(   '/user/plays',                  requireAuth, recordPlay);
router.get(    '/user/recent-plays',           requireAuth, getRecentPlays);
router.get(    '/user/recent-playlists',       requireAuth, getRecentPlaylists);

router.post(   '/user/favorites/songs',        requireAuth, toggleFavSong);
router.get(    '/user/favorites/songs',        requireAuth, getFavSongs);

router.post(   '/user/favorites/playlists',    requireAuth, toggleFavPlaylist);
router.get(    '/user/favorites/playlists',    requireAuth, getFavPlaylists);


// Admin Services Routes

const {
  listAdminsController,
  listUsersController,
  listRecommendationUsersController,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
  retryUserPaymentController
} = require('./controllers/admin Controllers/adminUserController');

router.get('/admin/users/admins',      requireAuth, requireAdmin, listAdminsController);
router.get(   '/admin/users',          requireAuth, requireAdmin, listUsersController);
router.get('/admin/personalize/users-with-recommendations', listRecommendationUsersController);
router.get(   '/admin/users/:id',      requireAuth, requireAdmin, getUserController);
router.post(  '/admin/users',          requireAuth, requireAdmin, createUserController);
router.put(   '/admin/users/:id',      requireAuth, requireAdmin, updateUserController);
router.delete('/admin/users/:id',      requireAuth, requireAdmin, deleteUserController);
router.post('/users/:id/retry-payment', retryUserPaymentController);


const {
  listCategoriesController,
  getCategoryController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController
} = require('./controllers/admin Controllers/adminCategoryController');

router.get(   '/admin/categories',        requireAuth, requireAdmin, listCategoriesController);
router.get(   '/admin/categories/:id',    requireAuth, requireAdmin, getCategoryController);
router.post(  '/admin/categories',        requireAuth, requireAdmin, createCategoryController);
router.put(   '/admin/categories/:id',    requireAuth, requireAdmin, updateCategoryController);
router.delete('/admin/categories/:id',    requireAuth, requireAdmin, deleteCategoryController);

const {
  listPlaylistsController,
  getPlaylistController,
  createPlaylistController,
  updatePlaylistController,
  deletePlaylistController
} = require('./controllers/admin Controllers/adminPlaylistController');

router.get(   '/admin/playlists',       requireAuth, requireAdmin, listPlaylistsController);
router.get(   '/admin/playlists/:id',   requireAuth, requireAdmin, getPlaylistController);
router.post(  '/admin/playlists',       requireAuth, requireAdmin, createPlaylistController);
router.put(   '/admin/playlists/:id',   requireAuth, requireAdmin, updatePlaylistController);
router.delete('/admin/playlists/:id',   requireAuth, requireAdmin, deletePlaylistController);

const {
  listSongsController,
  getSongController,
  createSongController,
  updateSongController,
  deleteSongController
} = require('./controllers/admin Controllers/adminSongController');

router.get(   '/admin/songs',           requireAuth, requireAdmin, listSongsController);
router.get(   '/admin/songs/:id',       requireAuth, requireAdmin, getSongController);
router.post(  '/admin/songs',           requireAuth, requireAdmin, createSongController);
router.put(   '/admin/songs/:id',       requireAuth, requireAdmin, updateSongController);
router.delete('/admin/songs/:id',       requireAuth, requireAdmin, deleteSongController);


const { listR2Controller }         = require('./controllers/admin Controllers/r2Controller');

router.get('/admin/upload/list', requireAuth, requireAdmin, listR2Controller);

const {
  upload,
  createFolderController,
  uploadFilesController,
  listObjectsController,
  headObjectController,
  deleteFileController,
  deleteFolderController
} = require('./controllers/admin Controllers/r2UploadController');


// —— Folder & File Management ——

router.post(
  '/admin/r2/folder',
  requireAuth, requireAdmin,
  createFolderController
);

router.post(
  '/admin/r2/upload',
  requireAuth, requireAdmin,
  upload,
  uploadFilesController
);

router.get(
  '/admin/r2/list',
  requireAuth, requireAdmin,
  listObjectsController
);

router.get(
  '/admin/r2/meta/:key',
  requireAuth, requireAdmin,
  headObjectController
);

router.delete(
  '/admin/r2/file',
  requireAuth, requireAdmin,
  deleteFileController
);

router.delete(
  '/admin/r2/folder',
  requireAuth, requireAdmin,
  deleteFolderController
);



router.get('/test-db', async (_req, res) => {
    try {
      const [rows] = await db.query('SELECT 1 + 1 AS solution');
      return res.json({ success: true, result: rows[0] });
    } catch (err) {
      console.error('Test-DB Error code:', err.code);
      console.error('Test-DB Error message:', err.message);
      return res.status(500).json({
        success: false,
        error: `${err.code}: ${err.message}`,
      });
    }
  });
  



router.get('/users', async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        status_message   AS status_message,
        active,
        created_at       AS created_at,
        updated_at       AS updated_at,
        deleted_at       AS deleted_at,
        is_subscribed,
        user_roles,
        has_addon
      FROM users
    `);
    return res.json(rows);
  } catch (err) {
    console.error('GET /users error:', err.code, err.message);
    return res.status(500).json({ error: 'Could not fetch users' });
  }
});


const {
  getDashboardCategoriesController,
  getDashboardPlaylistsByCategoryController,
  getDashboardAllPlaylistsController,
  getDashboardFreePlaylistsController,
  getDashboardSongsByPlaylistController,
  getDashboardSongByIdController,
  getSongBySlugController,
  searchDashboardController,
  getDashboardNewReleasesController,
  getDashboardAllSongsController
} = require('./controllers/dashboardMusicController');

router.get('/categories',    getDashboardCategoriesController);
router.get('/categories/:categoryId/playlists', getDashboardPlaylistsByCategoryController);
router.get('/dashboard/playlists',     getDashboardAllPlaylistsController);
router.get('/dashboard/playlists/free', getDashboardFreePlaylistsController);
router.get('/playlists/:playlistId/songs', getDashboardSongsByPlaylistController);
router.get('/songs/:id',     getDashboardSongByIdController);
router.get('/songs/slug/:slug', getSongBySlugController);
router.get('/search',        searchDashboardController);
router.get('/dashboard/playlists/new-releases', getDashboardNewReleasesController);
router.get('/dashboard/songs', requireAuth, getDashboardAllSongsController);


// --- Basic Personalize Service: public request form ---
const personalizeBasic = require('./controllers/PersonalizeBasicController');

// ...

router.post('/personalize-basic/request', personalizeBasic.createBasicPersonalizeRequest);

router.get('/personalize-basic/ping', (req, res) => res.json({ ok: true }));

// --- Basic personalize (admin sends recs directly to a user) ---
const pb = require('./controllers/admin Controllers/adminbasicPersonalizecontroller');

// ------- PB ADMIN (all require admin) -------
router.get ('/admin/pb/search/users',      requireAuth, requireAdmin, pb.searchUsers);
router.get ('/admin/pb/search/songs',      requireAuth, requireAdmin, pb.searchSongs);
router.get ('/admin/pb/search/playlists',  requireAuth, requireAdmin, pb.searchPlaylists);

router.get ('/admin/pb/recommendations',   requireAuth, requireAdmin, pb.listForUser);        // ?userId=123
router.post('/admin/pb/recommendations',   requireAuth, requireAdmin, pb.create);
router.get ('/admin/pb/recommendations/:id', requireAuth, requireAdmin, pb.getOne);
router.post('/admin/pb/recommendations/:id/items', requireAuth, requireAdmin, pb.addItem);
router.put ('/admin/pb/recommendations/items/:itemId', requireAuth, requireAdmin, pb.updateItem);
router.delete('/admin/pb/recommendations/items/:itemId', requireAuth, requireAdmin, pb.deleteItem);
router.delete('/admin/pb/recommendations/:id',   requireAuth, requireAdmin, pb.deleteRecommendation);
router.get('/admin/pb/recommendations/deleted/:userId', requireAuth, requireAdmin, pb.listDeletedForUser);
router.delete('/admin/pb/recommendations/:id/hard', requireAuth, requireAdmin, pb.hardDeleteRecommendation);
router.post('/admin/pb/recommendations/:id/restore', requireAuth, requireAdmin, pb.restoreRecommendation);
router.put ('/admin/pb/recommendations/:id/status', requireAuth, requireAdmin, pb.updateStatus);
router.post('/admin/pb/recommendations/:id/send',   requireAuth, requireAdmin, pb.sendNow);



// ---------- User PB (isolated) ----------
router.get('/pb/my-recommendations', requireAuth, pb.listMineForCurrentUser);



const {
  createPaymentLink,
  getRecommendationPaymentStatus,
} = require('./controllers/pbPaymentController');

router.post('/pb-payment/admin/create-link', requireAuth, requireAdmin, createPaymentLink);
router.get('/pb-payment/status/:id', requireAuth, getRecommendationPaymentStatus);

const { loadAndCache, getProductPriceMap } = require('./services/stripePriceCache');

router.post(
  '/admin/stripe/reload-cache',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      console.log(`🚀 Admin (user_id=${req.user.id}) triggered Stripe cache reload`);
      const priceMap = await loadAndCache(true);
      console.log('✅ Stripe cache reload completed.');

      res.json({
        success: true,
        message: 'Stripe cache reloaded successfully',
        base: priceMap.base,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ Stripe cache reload failed:', err);
      res.status(500).json({ error: 'Stripe cache reload failed', details: err.message });
    }
  }
);

router.get(
  '/admin/stripe/price-map',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const priceMap = await getProductPriceMap();
      res.json({
        success: true,
        base: priceMap.base,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('⚠️ Error fetching Stripe price map:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// router.get('/categories', async (_req, res) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT
//          id,
//          title,
//          slug,
//          artwork_filename AS image,
//          tags,
//          created_at
//        FROM categories`
//     );
//     return res.json(rows);
//   } catch (err) {
//     console.error(' GET /categories error:', err.code, err.message);
//     return res.status(500).json({ error: 'Could not fetch categories' });
//   }
// });


// router.get('/categories/:categoryId/playlists', async (req, res) => {
//   const { categoryId } = req.params;
//   try {
    
//     const [rows] = await db.query(
//       `SELECT
//          id,
//          title,
//          category_id AS categoryId,
//          created AS createdAt
//        FROM playlists
//        WHERE category_id = ?`,
//       [categoryId]
//     );
//     return res.json(rows);
//   } catch (err) {
   
//     console.error(' Error fetching playlists for category', categoryId);
//     console.error(err);
//     return res.status(500).json({ error: 'Could not fetch playlists' });
//   }
// });



// router.get('/playlists', async (_req, res) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT
//          id,
//          title   AS name,
//          slug,
//          tags,
//          artwork_filename AS image,
//          category_id AS categoryId,
//          created     AS createdAt
//        FROM playlists`
//     );
//     return res.json(rows);
//   } catch (err) {
//     console.error(' GET /playlists error:', err.code, err.message);
//     return res.status(500).json({ error: 'Could not fetch playlists' });
//   }
// });


// router.get('/playlists/:playlistId/songs', async (req, res) => {
//   const { playlistId } = req.params;
//   try {
//     const [rows] = await db.query(
//       `SELECT
//          id,
//          name,
//          title,
//          slug,
//          artist,
//          tags,
//          category,
//          playlist    AS playlistId,
//          artwork_filename AS image,
//          cdn_url AS audioUrl,
//          created     AS createdAt
//        FROM audio_metadata
//        WHERE playlist = ?`,
//       [playlistId]
//     );
//     return res.json(rows);
//   } catch (err) {
//     console.error(` Error fetching songs for playlist ${playlistId}:`, err);
//     return res.status(500).json({ error: 'Could not fetch songs' });
//   }
// });


// router.get('/search', async (req, res) => {
//   const term = (req.query.query || '').trim().toLowerCase();
//   const likeTerm = `%${term}%`;

//   try {
    
//     const [categories] = await db.query(
//       `SELECT id, title 
//        FROM categories 
//        WHERE LOWER(title) LIKE ? 
//        LIMIT 10`,
//       [likeTerm]
//     );

   
//     const [playlists] = await db.query(
//       `SELECT
//          id,
//          title AS name,
//          slug,
//          tags,
//          category_id AS categoryId,
//          created   AS createdAt
//        FROM playlists
//        WHERE
//          LOWER(title) LIKE ? OR
//          LOWER(tags) LIKE ?
//        LIMIT 10`,
//       [likeTerm, likeTerm]     
//     );

    
//     const [songs] = await db.query(
//       `SELECT
//          id,
//          title,
//          slug,
//          artist,
//          tags,
//          category,
//          playlist           AS playlistId,
//          artwork_filename   AS artworkFilename,
//          created            AS createdAt
//        FROM audio_metadata
//        WHERE
//          LOWER(title) LIKE ? OR
//          LOWER(artist) LIKE ? OR
//          LOWER(tags) LIKE ?
//        LIMIT 10`,
//       [likeTerm, likeTerm, likeTerm]  
//     );

//     return res.json({ categories, playlists, songs });
//   } catch (err) {
//     console.error(' /search error:', err);
//     return res.status(500).json({ error: 'Search failed' });
//   }
// });




module.exports = router;
