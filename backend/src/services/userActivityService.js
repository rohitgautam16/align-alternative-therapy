// src/services/userActivityService.js
const db = require('../db');

/**
 * Record or update a recent play timestamp.
 */
async function recordRecentPlay(userId, songId) {
  await db.query(
    `INSERT INTO song_plays (user_id, song_id, played_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE played_at = CURRENT_TIMESTAMP`,
    [userId, songId]
  );
}

/**
 * Fetch a user’s recent plays.
 */
async function fetchRecentPlays(userId, limit = 20) {
  const [rows] = await db.query(
    `SELECT
       s.id,
       s.title,
       s.artist,
       s.cdn_url   AS audioUrl,
       sp.played_at
     FROM song_plays sp
     JOIN audio_metadata s ON s.id = sp.song_id
     WHERE sp.user_id = ?
     ORDER BY sp.played_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

/**
 * Toggle favorite/unfavorite for a song.
 */
async function toggleFavoriteSong(userId, songId) {
  const [existing] = await db.query(
    `SELECT 1 FROM user_favorite_songs
     WHERE user_id = ? AND song_id = ?`,
    [userId, songId]
  );
  if (existing.length) {
    await db.query(
      `DELETE FROM user_favorite_songs
       WHERE user_id = ? AND song_id = ?`,
      [userId, songId]
    );
    return false;
  } else {
    await db.query(
      `INSERT INTO user_favorite_songs (user_id, song_id)
       VALUES (?, ?)`,
      [userId, songId]
    );
    return true;
  }
}

/**
 * List a user’s favorite songs.
 */
async function fetchFavoriteSongs(userId) {
  const [rows] = await db.query(
    `SELECT
       s.id,
       s.title,
       s.artist,
       s.cdn_url AS audioUrl,
       ufs.created_at AS favorited_at
     FROM user_favorite_songs ufs
     JOIN audio_metadata s ON s.id = ufs.song_id
     WHERE ufs.user_id = ?
     ORDER BY ufs.created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Toggle favorite/unfavorite for a playlist.
 */
async function toggleFavoritePlaylist(userId, playlistId) {
  const [existing] = await db.query(
    `SELECT 1 FROM user_favorite_playlists
     WHERE user_id = ? AND playlist_id = ?`,
    [userId, playlistId]
  );
  if (existing.length) {
    await db.query(
      `DELETE FROM user_favorite_playlists
       WHERE user_id = ? AND playlist_id = ?`,
      [userId, playlistId]
    );
    return false;
  } else {
    await db.query(
      `INSERT INTO user_favorite_playlists (user_id, playlist_id)
       VALUES (?, ?)`,
      [userId, playlistId]
    );
    return true;
  }
}

/**
 * List a user’s favorite playlists.
 */
async function fetchFavoritePlaylists(userId) {
  const [rows] = await db.query(
    `SELECT
       p.id,
       p.title,
       p.artwork_filename AS image,
       ufp.created_at     AS favorited_at
     FROM user_favorite_playlists ufp
     JOIN playlists p ON p.id = ufp.playlist_id
     WHERE ufp.user_id = ?
     ORDER BY ufp.created_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = {
  recordRecentPlay,
  fetchRecentPlays,
  toggleFavoriteSong,
  fetchFavoriteSongs,
  toggleFavoritePlaylist,
  fetchFavoritePlaylists,
};
