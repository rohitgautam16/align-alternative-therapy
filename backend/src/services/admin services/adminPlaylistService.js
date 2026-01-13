// src/services/adminPlaylistService.js
const db = require('../../db');

/**
 * List playlists with pagination.
 * @param {object} opts
 * @param {number} opts.page     — 1‑based page number
 * @param {number} opts.pageSize — items per page
 */
async function listPlaylists({ page = 1, pageSize = 20 } = {}) {
  // Normalize inputs
  page     = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const offset = (page - 1) * pageSize;

  // 1) total count
  const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM playlists`);
  const total = countRows[0]?.total || 0;

  // 2) paged data — 👇 UPDATED with JOIN and COUNT
  const [rows] = await db.query(
    `SELECT
       p.id,
       p.title,
       p.slug,
       p.description,
       p.tags,
       p.artwork_filename  AS artwork_filename,
       p.category_id       AS category_id,
       p.paid              AS paid,
       p.is_discoverable   AS is_discoverable,
       p.created           AS createdAt,
       COUNT(ps.song_id)   AS songCount
     FROM playlists p
     LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
     GROUP BY p.id
     ORDER BY p.created DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );

  return { data: rows, total, page, pageSize };
}

async function getPlaylistById(id) {

  const playlistPromise = db.query(
    `SELECT
       id,
       title,
       slug,
       description,
       tags,
       artwork_filename AS image,
       artwork_filename,
       category_id AS categoryId, -- Legacy field (optional)
       paid,
       is_discoverable,
       created AS createdAt
     FROM playlists
     WHERE id = ?`,
    [id]
  );

  const categoriesPromise = db.query(
    `SELECT c.id, c.title, c.slug, c.artwork_filename 
     FROM categories c
     JOIN category_playlists cp ON c.id = cp.category_id
     WHERE cp.playlist_id = ?`,
    [id]
  );

  const [[playlistRows], [categoryRows]] = await Promise.all([
    playlistPromise, 
    categoriesPromise
  ]);

  const playlist = playlistRows[0];

  if (playlist) {
    playlist.categories = categoryRows; 
  }

  return playlist;
}

async function addCategoryToPlaylist(playlistId, categoryId) {
  await db.query(
    `INSERT IGNORE INTO category_playlists (category_id, playlist_id) VALUES (?, ?)`,
    [categoryId, playlistId]
  );
  return { success: true };
}

async function removeCategoryFromPlaylist(playlistId, categoryId) {
  await db.query(
    `DELETE FROM category_playlists WHERE category_id = ? AND playlist_id = ?`,
    [categoryId, playlistId]
  );
  return { success: true };
}

async function createPlaylistAdmin({
  title,
  slug,
  description,
  tags,
  artwork_filename,
  category_id,
  paid,
  is_discoverable = 1      // 👈 NEW: default discoverable
}) {
  const [result] = await db.query(
    `INSERT INTO playlists
       (title, slug, description, tags, artwork_filename, category_id, paid, is_discoverable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, description || '', tags || null, artwork_filename || null, category_id || null, paid, is_discoverable]
  );
  return getPlaylistById(result.insertId);
}

async function updatePlaylistAdmin(
  id,
  { title, slug, description, tags, artwork_filename, category_id, paid = 1 } 
) {
  await db.query(
    `UPDATE playlists
        SET title            = ?,
            slug             = ?,
            description      = ?,
            tags             = ?,
            artwork_filename = ?,
            category_id      = ?,
            paid             = ?
      WHERE id = ?`,
    [
      title, 
      slug, 
      description || '', 
      tags || null, 
      artwork_filename || null, 
      category_id || null, 
      paid,  
      id
    ]
  );
  return getPlaylistById(id);
}


async function deletePlaylistAdmin(id) {
  await db.query(`DELETE FROM playlists WHERE id = ?`, [id]);
}

/**
 * 👇 NEW: only toggles discoverability, safe and isolated.
 */
async function setPlaylistDiscoverability(id, isDiscoverable) {
  const flag = isDiscoverable ? 1 : 0;
  await db.query(
    `UPDATE playlists
       SET is_discoverable = ?
     WHERE id = ?`,
    [flag, id]
  );
  return getPlaylistById(id);
}

async function addSongToPlaylist(playlistId, songId) {
  // 1. Add to the new Many-to-Many table (The future way)
  await db.query(
    `INSERT IGNORE INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)`,
    [playlistId, songId]
  );

  // await db.query(
  //   `UPDATE audio_metadata SET playlist = ? WHERE id = ?`,
  //   [playlistId, songId]
  // );

  return { success: true };
}

async function removeSongFromPlaylist(playlistId, songId) {
  // 1. Remove from new table
  await db.query(
    `DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?`,
    [playlistId, songId]
  );

  await db.query(
    `UPDATE audio_metadata SET playlist = NULL WHERE id = ? AND playlist = ?`,
    [songId, playlistId]
  );

  return { success: true };
}

async function getSongsForPlaylist(playlistId) {
  const [rows] = await db.query(
    `SELECT 
        s.*, 
        p.title as playlist_title
     FROM audio_metadata s
     JOIN playlist_songs ps ON s.id = ps.song_id
     JOIN playlists p ON p.id = ps.playlist_id
     WHERE ps.playlist_id = ?
     ORDER BY ps.created_at DESC`,
    [playlistId]
  );
  return rows;
}

module.exports = {
  listPlaylists,
  getPlaylistById,
  addCategoryToPlaylist,
  removeCategoryFromPlaylist,
  createPlaylistAdmin,
  updatePlaylistAdmin,
  deletePlaylistAdmin,
  setPlaylistDiscoverability,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getSongsForPlaylist
};
