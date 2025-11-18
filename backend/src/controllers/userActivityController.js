// src/controllers/userActivityController.js
const service = require('../services/userActivityService');
const db = require('../db');

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

async function recordPlay(req, res, next) {
  try {
    const userId = req.user?.id;
    const songId = Number(req.body?.songId);

    // Basic auth & input validation
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!Number.isFinite(songId) || songId <= 0) {
      return res.status(400).json({ error: 'songId must be a positive number' });
    }

    // Perform the write (service will also handle playlist_plays if audio_metadata.playlist is set)
    await service.recordRecentPlay(userId, songId);

    // Read back the song row so the client gets consistent data (slug + played_at)
    const [[played]] = await db.query(
      `SELECT 
         s.id,
         s.slug       AS song_slug,
         s.title,
         s.artist,
         s.artwork_filename AS image,
         s.cdn_url    AS audioUrl,
         sp.played_at
       FROM song_plays sp
       JOIN audio_metadata s ON s.id = sp.song_id
       WHERE sp.user_id = ? AND sp.song_id = ?
       LIMIT 1`,
      [userId, songId]
    );

    // Attempt to read the playlist (if the audio_metadata row is linked to a playlist)
    let playlist = null;
    const [[meta]] = await db.query(
      `SELECT playlist FROM audio_metadata WHERE id = ? LIMIT 1`,
      [songId]
    );

    const playlistId = meta ? meta.playlist : null;
    if (playlistId !== null && playlistId !== undefined) {
      const [[pl]] = await db.query(
        `SELECT
           p.id,
           p.slug,
           p.title,
           p.description,
           p.artwork_filename AS image,
           pp.played_at
         FROM playlist_plays pp
         JOIN playlists p ON p.id = pp.playlist_id
         WHERE pp.user_id = ? AND pp.playlist_id = ?
         LIMIT 1`,
        [userId, playlistId]
      );

      if (pl) {
        playlist = pl;
      }
    }

    // No-store: recent activity is per-user and should not be cached/shared
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Vary', 'Cookie');

    // 201 since we created/updated a resource-like row
    return res.status(201).json({
      success: true,
      played,
      playlist // null if none
    });
  } catch (err) {
    next(err);
  }
}

async function getRecentPlays(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const limit = clamp(Number(req.query.limit) || DEFAULT_LIMIT, 1, MAX_LIMIT);
    const rows = await service.fetchRecentPlays(userId, limit);

    // No-store: user-specific activity list
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Vary', 'Cookie');

    return res.json({
      count: rows.length,
      limit,
      items: rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /user/recent-playlists
 * Returns unique playlists the user has recently played (ordered by most recent playlist play).
 */
async function getRecentPlaylists(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const limit = clamp(Number(req.query.limit) || DEFAULT_LIMIT, 1, MAX_LIMIT);
    const rows = await service.fetchRecentPlaylists(userId, limit);

    // No-store: user-specific activity list
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Vary', 'Cookie');

    return res.json({
      count: rows.length,
      limit,
      items: rows
    });
  } catch (err) {
    next(err);
  }
}

async function toggleFavSong(req, res, next) {
  try {
    const userId = req.user.id;
    const { songId } = req.body;
    const favorited = await service.toggleFavoriteSong(userId, songId);
    res.json({ favorited });
  } catch (err) {
    next(err);
  }
}

async function getFavSongs(req, res, next) {
  try {
    const userId = req.user.id;
    const rows = await service.fetchFavoriteSongs(userId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function toggleFavPlaylist(req, res, next) {
  try {
    const userId = req.user.id;
    const { playlistId } = req.body;
    const favorited = await service.toggleFavoritePlaylist(userId, playlistId);
    res.json({ favorited });
  } catch (err) {
    next(err);
  }
}

async function getFavPlaylists(req, res, next) {
  try {
    const userId = req.user.id;
    const rows = await service.fetchFavoritePlaylists(userId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  recordPlay,
  getRecentPlays,
  getRecentPlaylists,
  toggleFavSong,
  getFavSongs,
  toggleFavPlaylist,
  getFavPlaylists,
};
