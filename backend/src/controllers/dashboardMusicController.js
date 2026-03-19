// src/controllers/dashboardMusicController.js

const {
  fetchDashboardCategories,
  fetchDashboardPlaylistsByCategory,
  fetchDashboardAllPlaylists,
  fetchDashboardFreePlaylists,
  fetchDashboardPlaylistBySlug,
  canUserAccessPlaylist,
  fetchDashboardSongsByPlaylist,
  fetchDashboardSongById,
  fetchDashboardSongBySlug,
  searchDashboardEverything,
  fetchDashboardNewReleases,
  fetchDashboardAllSongs,
  fetchDashboardTags
} = require('../services/dashboardMusicService');

const { attachAccessFlags } = require('../utils/attachAccessFlags');

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
    const categoryId = Number(req.params.categoryId);
    if (Number.isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid categoryId' });
    }

    const playlists = await fetchDashboardPlaylistsByCategory(categoryId);
    res.json(playlists);
  } catch (err) {
    console.error('getDashboardPlaylistsByCategoryController error:', err);
    next(err);
  }
}

async function getDashboardAllPlaylistsController(req, res, next) {
  try {
    const { tag } = req.query;
    const playlists = await fetchDashboardAllPlaylists({
      tagSlug: tag
    });
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

async function getDashboardPlaylistBySlugController(req, res, next) {
  try {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ error: 'Playlist slug is required' });

    const playlist = await fetchDashboardPlaylistBySlug(slug);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    if (!playlist.is_discoverable) {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      const hasAccess = await canUserAccessPlaylist(userId, playlist.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Not accessible' });
      }
    }

    const normalized = attachAccessFlags([playlist], 'playlist')[0];
    res.json(normalized);
  } catch (err) {
    console.error('getDashboardPlaylistBySlugController error:', err);
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

async function getSongBySlugController(req, res, next) {
  try {
    const { slug } = req.params;
    const row = await fetchDashboardSongBySlug(slug);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    console.error('getSongBySlugController error:', err);
    next(err);
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
    const { playlistLimit, songLimit, tag } = req.query;
    const data = await fetchDashboardNewReleases({
      playlistLimit: parseInt(playlistLimit, 10) || 12,
      songLimit:     parseInt(songLimit, 10)     || 8,
      tagSlug: tag
    });
    res.json(data);
  } catch (err) {
    console.error('getDashboardNewReleasesController error:', err);
    next(err);
  }
}

async function getDashboardAllSongsController(_req, res, next) {
  try {
    const { tag } = req.query;

    const songs = await fetchDashboardAllSongs({
      tagSlug: tag
    });

    res.json(songs);
  } catch (err) {
    console.error('getDashboardAllSongsController error:', err);
    next(err);
  }
}

async function getDashboardTags(req, res) {
  try {
    const { limit } = req.query;

    const tags = await fetchDashboardTags({
      limit: limit ? Number(limit) : 20
    });

    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
}



module.exports = {
  getDashboardCategoriesController,
  getDashboardPlaylistsByCategoryController,
  getDashboardAllPlaylistsController,
  getDashboardFreePlaylistsController,
  getDashboardPlaylistBySlugController,
  getDashboardSongsByPlaylistController,
  getDashboardSongByIdController,
  getSongBySlugController,
  searchDashboardController,
  getDashboardNewReleasesController,
  getDashboardAllSongsController,
  getDashboardTags
};
