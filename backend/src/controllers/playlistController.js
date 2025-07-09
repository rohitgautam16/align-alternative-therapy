// src/controllers/playlistController.js
const svc = require('../services/playlistService');
const {
  getPlaylistWithSongs,
} = require('../services/playlistService');

async function createPlaylist(req, res, next) {
  try {
    const p = await svc.createPlaylist(req.user.id, req.body.title);
    res.status(201).json({ success: true, playlist: p });
  } catch (e) { next(e); }
}

async function listPlaylists(req, res, next) {
  try {
    const list = await svc.getUserPlaylists(req.user.id);
    res.json({ playlists: list });
  } catch (e) { next(e); }
}

async function updatePlaylist(req, res, next) {
  try {
    const ok = await svc.updatePlaylist(req.user.id, req.params.id, req.body.title);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
}

async function deletePlaylist(req, res, next) {
  try {
    const ok = await svc.deletePlaylist(req.user.id, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
}

async function addSong(req, res, next) {
  try {
    await svc.addSongToPlaylist(req.user.id, req.params.id, req.body.songId);
    res.json({ success: true });
  } catch (e) { next(e); }
}

async function removeSong(req, res, next) {
  try {
    const ok = await svc.removeSongFromPlaylist(req.user.id, req.params.id, req.params.songId);
    if (!ok) return res.status(404).json({ error: 'Not found or not yours' });
    res.json({ success: true });
  } catch (e) { next(e); }
}

async function getPlaylistDetails(req, res, next) {
  try {
    const userId     = req.user.id;
    const playlistId = req.params.id;
    console.log('🔍 getPlaylistDetails for user:', userId, 'playlist:', playlistId);
    const data       = await getPlaylistWithSongs(userId, playlistId);

    if (!data) {
      console.log('❌ No playlist found'); 
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json({ playlist: data });
  } catch (err) {
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
};
