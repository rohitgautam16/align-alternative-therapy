// src/controllers/dashboardMusicController.js

const {
  fetchDashboardCategories,
  fetchDashboardPlaylistsByCategory,
  fetchDashboardAllPlaylists,
  fetchDashboardFreePlaylists,
  fetchDashboardSongsByPlaylist,
  fetchDashboardSongById,
  fetchDashboardSongBySlug,
  searchDashboardEverything,
  fetchDashboardNewReleases,
  fetchDashboardAllSongs
} = require('../services/dashboardMusicService');

async function getDashboardCategoriesController(req, res, next) {
  try {
    const categories = await fetchDashboardCategories();
    res.json(categories);
  } catch (err) {
    console.error('getDashboardCategoriesController error:', err);
    next(err);
  }
}

async function getDashboardPlaylistsByCategoryController(req, res, next) {
  try {
    const playlists = await fetchDashboardPlaylistsByCategory(req.params.categoryId);
    res.json(playlists);
  } catch (err) {
    console.error('getDashboardPlaylistsByCategoryController error:', err);
    next(err);
  }
}

async function getDashboardAllPlaylistsController(req, res, next) {
  try {
    const playlists = await fetchDashboardAllPlaylists();
    res.json(playlists);
  } catch (err) {
    console.error('getDashboardAllPlaylistsController error:', err);
    next(err);
  }
}

async function getDashboardFreePlaylistsController(_req, res, next) {
  try {
    
    const free = await fetchDashboardFreePlaylists();
    res.json(free);
  } catch (err) {
    console.error('getDashboardFreePlaylistsController error:', err);
    next(err);
  }
}

async function getDashboardSongsByPlaylistController(req, res, next) {
  try {
    const songs = await fetchDashboardSongsByPlaylist(req.params.playlistId);
    res.json(songs);
  } catch (err) {
    console.error('getDashboardSongsByPlaylistController error:', err);
    next(err);
  }
}

async function getDashboardSongByIdController(req, res, next) {
  try {
    const song = await fetchDashboardSongById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (err) {
    console.error('getDashboardSongByIdController error:', err);
    next(err);
  }
}

async function getSongBySlugController(req, res) {
  try {
    const { slug } = req.params;
    const row = await fetchDashboardSongBySlug(slug);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    console.error('getSongBySlug error:', err);
    res.status(400).json({ error: err.message });
  }
}

async function searchDashboardController(req, res, next) {
  try {
    const term = (req.query.query || '').trim();
    const result = await searchDashboardEverything(term);
    res.json(result);
  } catch (err) {
    console.error('searchDashboardController error:', err);
    next(err);
  }
}

async function getDashboardNewReleasesController(req, res, next) {
  try {
    const { playlistLimit, songLimit } = req.query;
    const data = await fetchDashboardNewReleases({
      playlistLimit: parseInt(playlistLimit, 10) || 12,
      songLimit:     parseInt(songLimit, 10)     || 8,
    });
    res.json(data);
  } catch (err) {
    console.error('getDashboardNewReleasesController error:', err);
    next(err);
  }
}

async function getDashboardAllSongsController(_req, res, next) {
  try {
    const songs = await fetchDashboardAllSongs();
    res.json(songs);
  } catch (err) {
    console.error('getDashboardAllSongsController error:', err);
    next(err);
  }
}


module.exports = {
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
};
