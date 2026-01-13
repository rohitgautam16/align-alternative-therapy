// src/controllers/adminPlaylistController.js
const {
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
} = require('../../services/admin services/adminPlaylistService');

 /**
  * GET /api/admin/playlists?page=&pageSize=
  */
async function listPlaylistsController(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const result = await listPlaylists({ page, pageSize });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getPlaylistController(req, res, next) {
  try {
    const playlist = await getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Not found' });
    res.json(playlist);
  } catch (err) {
    next(err);
  }
}


async function addCategoryToPlaylistController(req, res, next) {
  try {
    const { id } = req.params;
    const { category_id } = req.body;
    
    if (!category_id) return res.status(400).json({ error: 'category_id is required' });

    await addCategoryToPlaylist(id, category_id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function removeCategoryFromPlaylistController(req, res, next) {
  try {
    const { id, categoryId } = req.params;
    await removeCategoryFromPlaylist(id, categoryId);
    res.json({ success: true });
  } catch (err) { next(err); }
}


async function createPlaylistController(req, res, next) {
  try {
    const { title, slug, description, tags, artwork_filename, category_id, paid, is_discoverable } = req.body;
    if (!title || !slug) {
      return res.status(400).json({ error: 'title and slug are required' });
    }

    let discoverableValue = undefined;
    if (typeof is_discoverable === 'boolean') {
      discoverableValue = is_discoverable ? 1 : 0;
    } else if (is_discoverable === 0 || is_discoverable === '0') {
      discoverableValue = 0;
    } else if (is_discoverable === 1 || is_discoverable === '1') {
      discoverableValue = 1;
    }

    const newPlaylist = await createPlaylistAdmin({
      title,
      slug,
      description,
      tags,
      artwork_filename,
      category_id,
      paid: paid === 0 ? 0 : 1,
      is_discoverable: discoverableValue,  // 👈 NEW
    });
    res.status(201).json(newPlaylist);
  } catch (err) {
    next(err);
  }
}

async function updatePlaylistController(req, res, next) {
  try {
    const { title, slug, description, tags, artwork_filename, category_id, paid } = req.body;
    
    const paidValue = paid !== undefined && paid !== null ? Number(paid) : 1;
    
    const updated = await updatePlaylistAdmin(req.params.id, {
      title,
      slug,
      description,
      tags,
      artwork_filename,
      category_id,
      paid: paidValue
    });
    
    res.json(updated);
  } catch (err) {
    console.error('Update playlist controller error:', err);
    next(err);
  }
}


async function deletePlaylistController(req, res, next) {
  try {
    await deletePlaylistAdmin(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * 👇 NEW: PATCH /api/admin/playlists/:id/visibility
 * Body: { is_discoverable: boolean | 0 | 1 | '0' | '1' }
 */
async function updatePlaylistVisibilityController(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid playlist id' });
    }

    const { is_discoverable } = req.body || {};
    if (
      typeof is_discoverable !== 'boolean' &&
      is_discoverable !== 0 &&
      is_discoverable !== 1 &&
      is_discoverable !== '0' &&
      is_discoverable !== '1'
    ) {
      return res
        .status(400)
        .json({ error: 'is_discoverable must be boolean or 0/1' });
    }

    const normalized =
      is_discoverable === true ||
      is_discoverable === 1 ||
      is_discoverable === '1';

    const playlist = await setPlaylistDiscoverability(id, normalized);
    if (!playlist) return res.status(404).json({ error: 'Not found' });

    res.json(playlist);
  } catch (err) {
    console.error('updatePlaylistVisibilityController error:', err);
    next(err);
  }
}

async function addSongToPlaylistController(req, res, next) {
  try {
    const { id } = req.params; // playlistId
    const { song_id } = req.body;
    
    if (!song_id) return res.status(400).json({ error: 'song_id is required' });

    await addSongToPlaylist(id, song_id);
    res.json({ success: true, message: 'Song linked successfully' });
  } catch (err) {
    next(err);
  }
}

async function removeSongFromPlaylistController(req, res, next) {
  try {
    const { id, songId } = req.params;
    await removeSongFromPlaylist(id, songId);
    res.json({ success: true, message: 'Song unlinked successfully' });
  } catch (err) {
    next(err);
  }
}

async function getPlaylistSongsController(req, res, next) {
  try {
    const { id } = req.params;
    const songs = await getSongsForPlaylist(id);
    res.json(songs);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPlaylistsController,
  getPlaylistController,
  addCategoryToPlaylistController,
  removeCategoryFromPlaylistController,
  createPlaylistController,
  updatePlaylistController,
  deletePlaylistController,
  updatePlaylistVisibilityController,
  addSongToPlaylistController,
  removeSongFromPlaylistController,
  getPlaylistSongsController
};
