// src/controllers/userActivityController.js
const service = require('../services/userActivityService');

async function recordPlay(req, res, next) {
  try {
    const userId = req.user.id;
    const { songId } = req.body;
    await service.recordRecentPlay(userId, songId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getRecentPlays(req, res, next) {
  try {
    const userId = req.user.id;
    const rows = await service.fetchRecentPlays(userId);
    res.json(rows);
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
  toggleFavSong,
  getFavSongs,
  toggleFavPlaylist,
  getFavPlaylists,
};
