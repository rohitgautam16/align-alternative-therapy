// src/routes.js
'use strict';
const express = require('express');
const db      = require('./db');
const multer = require('multer');
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
const upload = multer({ storage });

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

async function uploadFolder(dirPath, prefix = '') {
  const items   = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];

  for (let item of items) {
    const fullPath = path.join(dirPath, item.name);
    const key      = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.isDirectory()) {
      const nested = await uploadFolder(fullPath, key);
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



router.post('/upload-images', async (req, res) => {
  try {
    const baseDir = path.join(__dirname, '../align-images');
    const uploaded = await uploadImages(baseDir);
    return res.json({ uploaded });
  } catch (err) {
    console.error('Bulk image upload failed:', err);
    return res.status(500).json({ error: err.message });
  }
});




router.post('/upload-all', async (req, res) => {
  try {
    const baseDir  = path.join(__dirname, '../align-audio');
    const uploaded = await uploadFolder(baseDir);
    return res.json({ uploaded });
  } catch (err) {
    console.error(' Bulk upload failed:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});


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
        username,
        status,
        status_message   AS status_message,
        active,
        last_active      AS last_active,
        created_at       AS created_at,
        updated_at       AS updated_at,
        deleted_at       AS deleted_at
      FROM users
    `);
    return res.json(rows);
  } catch (err) {
    console.error('GET /users error:', err.code, err.message);
    return res.status(500).json({ error: 'Could not fetch users' });
  }
});


router.get('/categories', async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         title,
         slug,
         artwork_filename AS image,
         tags,
         created_at
       FROM categories`
    );
    return res.json(rows);
  } catch (err) {
    console.error(' GET /categories error:', err.code, err.message);
    return res.status(500).json({ error: 'Could not fetch categories' });
  }
});



router.get('/categories/:categoryId/playlists', async (req, res) => {
  const { categoryId } = req.params;
  try {
    
    const [rows] = await db.query(
      `SELECT
         id,
         title,
         category_id AS categoryId,
         created AS createdAt
       FROM playlists
       WHERE category_id = ?`,
      [categoryId]
    );
    return res.json(rows);
  } catch (err) {
   
    console.error(' Error fetching playlists for category', categoryId);
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch playlists' });
  }
});




router.get('/playlists', async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         title   AS name,
         slug,
         tags,
         artwork_filename AS image,
         category_id AS categoryId,
         created     AS createdAt
       FROM playlists`
    );
    return res.json(rows);
  } catch (err) {
    console.error(' GET /playlists error:', err.code, err.message);
    return res.status(500).json({ error: 'Could not fetch playlists' });
  }
});


router.get('/playlists/:playlistId/songs', async (req, res) => {
  const { playlistId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         name,
         title,
         slug,
         artist,
         tags,
         category,
         playlist    AS playlistId,
         artwork_filename AS image,
         cdn_url AS audioUrl,
         created     AS createdAt
       FROM audio_metadata
       WHERE playlist = ?`,
      [playlistId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(` Error fetching songs for playlist ${playlistId}:`, err);
    return res.status(500).json({ error: 'Could not fetch songs' });
  }
});


router.get('/search', async (req, res) => {
  const term = (req.query.query || '').trim().toLowerCase();
  const likeTerm = `%${term}%`;

  try {
    
    const [categories] = await db.query(
      `SELECT id, title 
       FROM categories 
       WHERE LOWER(title) LIKE ? 
       LIMIT 10`,
      [likeTerm]
    );

   
    const [playlists] = await db.query(
      `SELECT
         id,
         title AS name,
         slug,
         tags,
         category_id AS categoryId,
         created   AS createdAt
       FROM playlists
       WHERE
         LOWER(title) LIKE ? OR
         LOWER(tags) LIKE ?
       LIMIT 10`,
      [likeTerm, likeTerm]     
    );

    
    const [songs] = await db.query(
      `SELECT
         id,
         title,
         slug,
         artist,
         tags,
         category,
         playlist           AS playlistId,
         artwork_filename   AS artworkFilename,
         created            AS createdAt
       FROM audio_metadata
       WHERE
         LOWER(title) LIKE ? OR
         LOWER(artist) LIKE ? OR
         LOWER(tags) LIKE ?
       LIMIT 10`,
      [likeTerm, likeTerm, likeTerm]  
    );

    return res.json({ categories, playlists, songs });
  } catch (err) {
    console.error(' /search error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
});




module.exports = router;
