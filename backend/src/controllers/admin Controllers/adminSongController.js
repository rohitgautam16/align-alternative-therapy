// src/controllers/adminSongController.js
const {
  listSongs,
  getSongById,
  createSongAdmin,
  updateSongAdmin,
  deleteSongAdmin
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
      cdn_url
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
      cdn_url
    });
    res.status(201).json(newSong);
  } catch (err) {
    next(err);
  }
}

async function updateSongController(req, res, next) {
  try {
    const fields = req.body;
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

module.exports = {
  listSongsController,
  getSongController,
  createSongController,
  updateSongController,
  deleteSongController
};
