// src/services/userActivityService.js
const db = require('../db');

/**
 * Record or update a recent play timestamp.
 */
/**
 * Record a user's recent play.
 * - Inserts if new
 * - Updates `played_at` if already exists (ensures "most recent" is accurate)
 */
async function recordRecentPlay(userId, songId) {
  // Use a connection + transaction to avoid races between reading audio_metadata and writing playlist_plays
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) song_plays as before
    await conn.query(
      `INSERT INTO song_plays (user_id, song_id, played_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE played_at = VALUES(played_at)`,
      [userId, songId]
    );

    // 2) read playlist id from audio_metadata for this song
    //    NOTE: column name per your description is `playlist` on audio_metadata
    const [metaRows] = await conn.query(
      `SELECT playlist FROM audio_metadata WHERE id = ? LIMIT 1`,
      [songId]
    );

    const playlistId = metaRows && metaRows[0] ? metaRows[0].playlist : null;

    // 3) if playlist exists (not null), upsert into playlist_plays
    if (playlistId !== null && playlistId !== undefined) {
      await conn.query(
        `INSERT INTO playlist_plays (user_id, playlist_id, played_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE played_at = VALUES(played_at)`,
        [userId, playlistId]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}


/**
 * Fetch a user’s recent plays.
 * - Includes song slug for clean frontend routing
 * - Returns songs ordered by most recent play
 * - Supports limit (default = 20)
 */
async function fetchRecentPlays(userId, limit = 20) {
  const [rows] = await db.query(
    `SELECT
       s.id,
       s.slug,   
       s.title,
       s.description,
       s.name,
       s.artist,
       s.artwork_filename  AS image,
       s.cdn_url           AS audioUrl,
       MAX(sp.played_at)   AS played_at
     FROM song_plays sp
     JOIN audio_metadata s 
       ON s.id = sp.song_id
     WHERE sp.user_id = ?
     GROUP BY s.id, s.slug, s.title, s.name, s.artist, s.description, s.artwork_filename, s.cdn_url
     ORDER BY played_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  return rows;
}

async function fetchRecentPlaylists(userId, limit = 20) {
  const [rows] = await db.query(
    `SELECT
       p.id,
       p.slug,
       p.title,
       p.description,
       p.artwork_filename AS image,
       MAX(pp.played_at)   AS played_at
     FROM playlist_plays pp
     JOIN playlists p
       ON p.id = pp.playlist_id
     WHERE pp.user_id = ?
     GROUP BY p.id, p.slug, p.title, p.description, p.artwork_filename
     ORDER BY played_at DESC
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
  fetchRecentPlaylists,
  toggleFavoriteSong,
  fetchFavoriteSongs,
  toggleFavoritePlaylist,
  fetchFavoritePlaylists,
};
