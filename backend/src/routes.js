// src/routes.js
'use strict';
const express = require('express');
const db      = require('./db');
const multer = require('multer');
// const upload = multer({ storage: multer.memoryStorage() });
const AWS = require('aws-sdk');
const mime       = require('mime-types');
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
const s3 = new AWS.S3({
  endpoint:    process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region:      'auto',
  signatureVersion: 'v4',
});


const router = express.Router();


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

const { checkoutController } = require('./controllers/subscriptionController');

console.log('requireAuth:', typeof requireAuth);
console.log('checkoutController:', typeof checkoutController);
router.post('/subscribe/checkout', requireAuth, checkoutController);

const {
  recordPlay,
  getRecentPlays,
  toggleFavSong,
  getFavSongs,
  toggleFavPlaylist,
  getFavPlaylists,
} = require('./controllers/userActivityController');

router.post(   '/user/plays',                  requireAuth, recordPlay);
router.get(    '/user/recent-plays',           requireAuth, getRecentPlays);

router.post(   '/user/favorites/songs',        requireAuth, toggleFavSong);
router.get(    '/user/favorites/songs',        requireAuth, getFavSongs);

router.post(   '/user/favorites/playlists',    requireAuth, toggleFavPlaylist);
router.get(    '/user/favorites/playlists',    requireAuth, getFavPlaylists);


// Admin Services Routes

const {
  listAdminsController,
  listUsersController,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController
} = require('./controllers/admin Controllers/adminUserController');

router.get('/admin/users/admins',      requireAuth, requireAdmin, listAdminsController);
router.get(   '/admin/users',          requireAuth, requireAdmin, listUsersController);
router.get(   '/admin/users/:id',      requireAuth, requireAdmin, getUserController);
router.post(  '/admin/users',          requireAuth, requireAdmin, createUserController);
router.put(   '/admin/users/:id',      requireAuth, requireAdmin, updateUserController);
router.delete('/admin/users/:id',      requireAuth, requireAdmin, deleteUserController);

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
        status,
        status_message   AS status_message,
        active,
        last_active      AS last_active,
        created_at       AS created_at,
        updated_at       AS updated_at,
        deleted_at       AS deleted_at,
        is_subscribed
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
router.get('/search',        searchDashboardController);
router.get('/dashboard/playlists/new-releases', getDashboardNewReleasesController);
router.get('/dashboard/songs', requireAuth, getDashboardAllSongsController);


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
