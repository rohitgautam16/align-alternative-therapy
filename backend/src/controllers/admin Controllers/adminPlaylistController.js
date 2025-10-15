// src/controllers/adminPlaylistController.js
const {
  listPlaylists,
  getPlaylistById,
  createPlaylistAdmin,
  updatePlaylistAdmin,
  deletePlaylistAdmin
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

async function createPlaylistController(req, res, next) {
  try {
    const { title, slug, description, tags, artwork_filename, category_id, paid } = req.body;
    if (!title || !slug) {
      return res.status(400).json({ error: 'title and slug are required' });
    }
    const newPlaylist = await createPlaylistAdmin({
      title,
      slug,
      description,
      tags,
      artwork_filename,
      category_id,
      paid: paid === 0 ? 0 : 1
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

module.exports = {
  listPlaylistsController,
  getPlaylistController,
  createPlaylistController,
  updatePlaylistController,
  deletePlaylistController
};
