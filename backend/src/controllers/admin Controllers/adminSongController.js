// src/controllers/adminSongController.js
const {
  listSongs,
  getSongById,
  createSongAdmin,
  updateSongAdmin,
  deleteSongAdmin,
  setSongDiscoverability
} = require('../../services/admin services/adminSongService');

/**
 * GET /api/admin/songs?page=&pageSize=
 */
async function listSongsController(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    // listSongs now takes pagination options
    const result = await listSongs({ page, pageSize });
    // result = { data, total, page, pageSize }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getSongController(req, res, next) {
  try {
    const song = await getSongById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Not found' });
    res.json(song);
  } catch (err) {
    next(err);
  }
}

async function createSongController(req, res, next) {
  try {
    const {
      name,
      title,
      slug,
      description,
      artist,
      tags,
      category,
      playlist,
      artwork_filename,
      cdn_url,
      is_free,
      is_discoverable
    } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: 'title and slug are required' });
    }

    const newSong = await createSongAdmin({
      name,
      title,
      slug,
      description,
      artist,
      tags,
      category,
      playlist,
      artwork_filename,
      cdn_url,
      is_free, // pass through
      is_discoverable: typeof is_discoverable === 'boolean'
        ? is_discoverable
        : undefined,  // default to service’s 1 if not provided
    });

    res.status(201).json(newSong);
  } catch (err) {
    next(err);
  }
}

async function updateSongController(req, res, next) {
  try {
    const fields = req.body;


    if (fields.is_free !== undefined) {
      fields.is_free = fields.is_free ? 1 : 0; // normalize to 1/0
    }

    const updated = await updateSongAdmin(req.params.id, fields);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}


async function deleteSongController(req, res, next) {
  try {
    await deleteSongAdmin(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}


/**
 * 👇 NEW: PATCH /api/admin/songs/:id/visibility
 * Body: { is_discoverable: boolean | 0 | 1 | '0' | '1' }
 */
async function updateSongVisibilityController(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid song id' });
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

    const song = await setSongDiscoverability(id, normalized);
    if (!song) return res.status(404).json({ error: 'Not found' });

    res.json(song);
  } catch (err) {
    console.error('updateSongVisibilityController error:', err);
    next(err);
  }
}


module.exports = {
  listSongsController,
  getSongController,
  createSongController,
  updateSongController,
  deleteSongController,
  updateSongVisibilityController
};
