// src/services/playlistService.js
const db = require('../db');

async function createPlaylist(userId, title) {
  const [result] = await db.query(
    `INSERT INTO user_playlists (user_id, title) VALUES (?, ?)`,
    [userId, title]
  );
  return { id: result.insertId, user_id: userId, title };
}

async function getUserPlaylists(userId) {
  const [rows] = await db.query(
    `SELECT id, title, created_at, updated_at
       FROM user_playlists
      WHERE user_id = ?
      ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function updatePlaylist(userId, playlistId, title) {
  const [res] = await db.query(
    `UPDATE user_playlists
        SET title = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?`,
    [title, playlistId, userId]
  );
  return res.affectedRows > 0;
}

async function deletePlaylist(userId, playlistId) {
  const [res] = await db.query(
    `DELETE FROM user_playlists WHERE id = ? AND user_id = ?`,
    [playlistId, userId]
  );
  return res.affectedRows > 0;
}

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
 * Get a single user‐created playlist with its songs
 * @param {number} userId
 * @param {number} playlistId
 * @returns {Promise<object|null>} playlist info with songs[] or null if not found
 */
async function getPlaylistWithSongs(userId, playlistId) {
  // 1) Verify ownership & fetch playlist
  const [plsRows] = await db.query(
    `SELECT id, title, created_at, updated_at
       FROM user_playlists
      WHERE id = ? AND user_id = ?
      LIMIT 1`,
    [playlistId, userId]
  );
  if (!plsRows.length) return null;
  const playlist = plsRows[0];

  // 2) Fetch songs in the playlist
  const [songRows] = await db.query(
    `SELECT
       am.id,
       am.title,
       am.artist,
       am.artwork_filename   AS image,
       am.cdn_url            AS audioUrl,
       ups.added_at
     FROM user_playlist_songs ups
     JOIN audio_metadata am
       ON am.id = ups.song_id
     WHERE ups.playlist_id = ?
     ORDER BY ups.added_at DESC`,
    [playlistId]
  );

  // 3) Attach songs array
  playlist.songs = songRows;
  return playlist;
}

module.exports = {
  createPlaylist,
  getUserPlaylists,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getPlaylistWithSongs,
};
