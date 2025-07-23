// src/controllers/playlistController.js
const svc = require('../services/playlistService');
const {
  getPlaylistWithSongs,
  getUserPlaylistBySlug
} = require('../services/playlistService');

// POST /user-playlists
async function createPlaylist(req, res, next) {
  try {
    const { title, artwork_filename } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const p = await svc.createPlaylist(req.user.id, { title, artwork_filename });
    res.status(201).json({ success: true, playlist: p });
  } catch (e) {
    next(e);
  }
}

// GET /user-playlists
async function listPlaylists(req, res, next) {
  try {
    const list = await svc.getUserPlaylists(req.user.id);
    res.json({ playlists: list });
  } catch (e) {
    next(e);
  }
}

// PUT /user-playlists/:id
async function updatePlaylist(req, res, next) {
  try {
    const { title, artwork_filename } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const ok = await svc.updatePlaylist(
      req.user.id,
      req.params.id,
      { title, artwork_filename }
    );
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

// DELETE /user-playlists/:id
async function deletePlaylist(req, res, next) {
  try {
    const ok = await svc.deletePlaylist(req.user.id, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

// POST /user-playlists/:id/songs
async function addSong(req, res, next) {
  try {
    await svc.addSongToPlaylist(
      req.user.id,
      req.params.id,
      req.body.songId
    );
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

// DELETE /user-playlists/:id/songs/:songId
async function removeSong(req, res, next) {
  try {
    const ok = await svc.removeSongFromPlaylist(
      req.user.id,
      req.params.id,
      req.params.songId
    );
    if (!ok) return res.status(404).json({ error: 'Not found or not yours' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

// GET /user-playlists/:id
async function getPlaylistDetails(req, res, next) {
  try {
    const data = await svc.getPlaylistWithSongs(
      req.user.id,
      req.params.id
    );
    if (!data) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ playlist: data });
  } catch (e) {
    next(e);
  }
}

async function getUserPlaylistBySlugController(req, res, next) {
  try {
    const userId = req.user.id;
    const slug   = req.params.slug;
    // Step 1: fetch the playlist row
    const base = await getUserPlaylistBySlug(userId, slug);
    if (!base) return res.status(404).json({ error: 'Not found' });

    // Step 2: fetch its songs
    const full = await getPlaylistWithSongs(userId, base.id);
    return res.json({ playlist: full });
  } catch (err) {
    console.error('getUserPlaylistBySlugController error:', err);
    next(err);
  }
}


module.exports = {
  createPlaylist,
  listPlaylists,
  updatePlaylist,
  deletePlaylist,
  addSong,
  removeSong,
  getPlaylistDetails,
  getUserPlaylistBySlugController
};
