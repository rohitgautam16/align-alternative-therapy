// src/services/playlistService.js
const db = require('../db');
const slugify = require('slugify');

/**
 * Create a new user playlist with a URL‑friendly slug and optional artwork filename.
 */
async function createPlaylist(userId, { title, artwork_filename }) {
  const slug = slugify(title, { lower: true, strict: true });
  const [result] = await db.query(
    `INSERT INTO user_playlists
       (user_id, title, slug, artwork_filename)
     VALUES (?, ?, ?, ?)`,
    [userId, title, slug, artwork_filename || null]
  );
  return {
    id: result.insertId,
    user_id: userId,
    title,
    slug,
    artwork_filename: artwork_filename || null,
  };
}

/**
 * List all playlists a user has created, newest first.
 */
async function getUserPlaylists(userId) {
  const [rows] = await db.query(
    `SELECT
       id,
       title,
       slug,
       artwork_filename AS artwork_filename,
       created_at,
       updated_at
     FROM user_playlists
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Rename a user playlist.
 */
async function updatePlaylist(req, res, next) {
  try {
    const { title, artwork_filename } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title required' });
    }
    // Now svc.updatePlaylist returns the updated playlist object (or null)
    const updated = await svc.updatePlaylist(
      req.user.id,
      req.params.id,
      { title, artwork_filename }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Not found' });
    }
    // Return the full object, including slug
    res.json({ playlist: updated });
  } catch (e) {
    console.error('updatePlaylist error:', e);
    next(e);
  }
}

/**
 * Delete a user playlist.
 */
async function deletePlaylist(userId, playlistId) {
  const [res] = await db.query(
    `DELETE FROM user_playlists WHERE id = ? AND user_id = ?`,
    [playlistId, userId]
  );
  return res.affectedRows > 0;
}

/**
 * Add a song to a user playlist.
 */
async function addSongToPlaylist(userId, playlistId, songId) {
  // ensure ownership
  const [check] = await db.query(
    `SELECT 1 FROM user_playlists WHERE id = ? AND user_id = ?`,
    [playlistId, userId]
  );
  if (!check.length) throw new Error('Playlist not found');
  await db.query(
    `INSERT IGNORE INTO user_playlist_songs (playlist_id, song_id) VALUES (?, ?)`,
    [playlistId, songId]
  );
  return true;
}

/**
 * Remove a song from a user playlist.
 */
async function removeSongFromPlaylist(userId, playlistId, songId) {
  const [res] = await db.query(
    `DELETE ups
       FROM user_playlist_songs ups
       JOIN user_playlists up ON up.id = ups.playlist_id
      WHERE ups.playlist_id = ? AND ups.song_id = ? AND up.user_id = ?`,
    [playlistId, songId, userId]
  );
  return res.affectedRows > 0;
}

/**
 * Fetch one user playlist and all its songs.
 */
async function getPlaylistWithSongs(userId, playlistId) {
  // 1) verify ownership & fetch playlist metadata
  const [plsRows] = await db.query(
    `SELECT
       id,
       title,
       slug,
       artwork_filename AS artwork_filename,
       created_at,
       updated_at
     FROM user_playlists
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [playlistId, userId]
  );
  if (!plsRows.length) return null;
  const playlist = plsRows[0];

  // 2) fetch attached songs
  const [songRows] = await db.query(
    `SELECT
       am.id,
       am.title,
       am.artist,
       am.artwork_filename AS image,
       am.cdn_url AS audioUrl,
       ups.added_at
     FROM user_playlist_songs ups
     JOIN audio_metadata am ON am.id = ups.song_id
     WHERE ups.playlist_id = ?
     ORDER BY ups.added_at DESC`,
    [playlistId]
  );

  playlist.songs = songRows;
  return playlist;
}

async function getUserPlaylistBySlug(userId, slug) {
  const [rows] = await db.query(
    `SELECT id, user_id, title, slug,
            artwork_filename AS image,
            created_at     AS createdAt,
            updated_at     AS updatedAt
       FROM user_playlists
      WHERE slug = ? AND user_id = ?
      LIMIT 1`,
    [slug, userId]
  );
  return rows[0] || null;
}

module.exports = {
  createPlaylist,
  getUserPlaylists,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getPlaylistWithSongs,
  getUserPlaylistBySlug
};
