// src/services/dashboardMusicService.js
const db = require('../db');
const { withAccessNormalization } = require('../utils/withAccessNormalization');
const { attachAccessFlags } = require('../utils/attachAccessFlags');

/** GET /categories */
async function fetchDashboardCategories() {
  const [rows] = await db.query(
    `SELECT
       id,
       title,
       slug,
       description,
       artwork_filename AS image,
       tags,
       created_at
     FROM categories`
  );
  return rows;
}

/** GET /categories/:categoryId/playlists */
async function fetchDashboardPlaylistsByCategory(categoryId) {
  const [rows] = await db.query(
    `SELECT
       id,
       title,
       slug,
       description,
       tags,
       paid,
       artwork_filename AS image,
       category_id AS categoryId,
       created     AS createdAt
     FROM playlists
     WHERE category_id = ?
     AND is_discoverable = 1`,
    [categoryId]
  );
  return attachAccessFlags(rows, 'playlist');
}

/** GET /playlists */
async function fetchDashboardAllPlaylists() {
  const [rows] = await db.query(
    `SELECT
       id,
       title   AS name,
       slug,
       description,
       tags,
       paid,
       artwork_filename AS image,
       category_id AS categoryId,
       created     AS createdAt
     FROM playlists
     WHERE is_discoverable = 1`
  );
  return attachAccessFlags(rows, 'playlist');
}

async function fetchDashboardFreePlaylists() {
  const [rows] = await db.query(
    `SELECT
       id,
       title   AS name,
       slug,
       description,
       tags,
       artwork_filename AS image,
       category_id      AS categoryId,
       paid,
       created          AS createdAt
     FROM playlists
     WHERE paid = 0
     AND is_discoverable = 1
     ORDER BY createdAt DESC`
  );
  return attachAccessFlags(rows, 'playlist');
}

/** GET /playlists/:playlistId/songs */
async function fetchDashboardSongsByPlaylist(playlistId) {
  const [rows] = await db.query(
    `SELECT
       id,
       name,
       title,
       slug,
       description,
       artist,
       tags,
       category,
       playlist    AS playlistId,
       artwork_filename AS image,
       cdn_url     AS audioUrl,
       created     AS createdAt,
       is_free,
       is_discoverable
    FROM audio_metadata
    WHERE playlist = ?
    AND is_discoverable = 1`,
    [playlistId]
  );
  return attachAccessFlags(rows, 'song');
}

/** GET /songs/:id */
async function fetchDashboardSongById(id) {
  const [rows] = await db.query(
    `SELECT
       id,
       name,
       title,
       slug,
       description,
       artist,
       tags,
       category,
       playlist    AS playlistId,
       artwork_filename AS image,
       cdn_url     AS audioUrl,
       created     AS createdAt,
       is_free
     FROM audio_metadata
     WHERE id = ?`,
    [id]
  );
  return rows[0];
}

async function fetchDashboardSongBySlug(slug) {
  const [rows] = await db.query(
    `SELECT
       id,
       name,
       title,
       slug,
       description,
       artist,
       tags,
       category,
       playlist    AS playlistId,
       artwork_filename AS image,
       cdn_url     AS audioUrl,
       created     AS createdAt,
       is_free
     FROM audio_metadata
     WHERE slug = ?
     LIMIT 1`,
    [slug]
  );
  return rows[0];
}

/** GET /search?query=… */
async function searchDashboardEverything(term) {
  const likeTerm = `%${term.toLowerCase()}%`;
  
  // Categories - using your existing schema
  const [categories] = await db.query(
    `SELECT 
       id, 
       title,
       slug,
       tags,
       artwork_filename,
       created_at
     FROM categories
     WHERE LOWER(title) LIKE ? OR LOWER(tags) LIKE ?
     ORDER BY title
     LIMIT 10`,
    [likeTerm, likeTerm]
  );

  // Playlists - using your existing schema with JOIN to get category title
  const [playlists] = await db.query(
    `SELECT
       p.id,
       p.title,
       p.slug,
       p.tags,
       p.paid,
       p.artwork_filename,
       p.category_id,
       p.created,
       c.title as category_title
     FROM playlists p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE (LOWER(p.title) LIKE ? OR LOWER(p.tags) LIKE ?)
     AND p.is_discoverable = 1
     ORDER BY p.title
     LIMIT 10`,
    [likeTerm, likeTerm]
  );

  // Songs - using your existing schema with JOIN to get playlist title
  const [songs] = await db.query(
    `SELECT
       s.id,
       s.name,
       s.title,
       s.slug,
       s.artist,
       s.tags,
       s.category,
       s.playlist,
       s.artwork_filename,
       s.cdn_url,
       s.created,
       s.is_free,
       p.title as playlist_title
     FROM audio_metadata s
     LEFT JOIN playlists p ON s.playlist = p.id
     WHERE (LOWER(s.title) LIKE ? OR LOWER(s.artist) LIKE ? OR LOWER(s.tags) LIKE ?)
     AND s.is_discoverable = 1
     ORDER BY s.title
     LIMIT 10`,
    [likeTerm, likeTerm, likeTerm]
  );

  // Transform data to match frontend expectations
  const processedCategories = categories.map(cat => ({
    id: cat.id,
    title: cat.title,
    slug: cat.slug,
    tags: cat.tags,
    image: cat.artwork_filename, // Using existing field
    artwork_filename: cat.artwork_filename,
    createdAt: cat.created_at,
    type: 'category'
  }));

  const processedPlaylists = playlists.map(playlist => ({
    id: playlist.id,
    title: playlist.title,
    name: playlist.title, // For compatibility
    slug: playlist.slug,
    tags: playlist.tags,
    paid: playlist.paid,
    categoryId: playlist.category_id,
    categoryTitle: playlist.category_title,
    image: playlist.artwork_filename, // Using existing field
    artwork_filename: playlist.artwork_filename,
    createdAt: playlist.created,
    type: 'playlist'
  }));

  const processedSongs = songs.map(song => ({
    id: song.id,
    name: song.name,
    title: song.title,
    slug: song.slug,
    artist: song.artist,
    tags: song.tags,
    category: song.category,
    playlistId: song.playlist,
    playlistTitle: song.playlist_title,
    image: song.artwork_filename, // Using existing field
    artwork_filename: song.artwork_filename,
    audioUrl: song.cdn_url, // Using cdn_url for audio
    createdAt: song.created,
    type: 'song'
  }));

  return { 
    categories: processedCategories, 
    playlists: processedPlaylists, 
    songs: processedSongs,
    total: processedCategories.length + processedPlaylists.length + processedSongs.length
  };
}


async function fetchDashboardNewReleases({ playlistLimit = 12, songLimit = 8 } = {}) {
  // fetch latest playlists
  const [plRows] = await db.query(
    `SELECT
       id,
       title,
       slug,
       paid,
       artwork_filename AS image,
       category_id      AS categoryId,
       created          AS createdAt
     FROM playlists
     WHERE is_discoverable = 1
     ORDER BY created DESC
     LIMIT ?`,
    [playlistLimit]
  );

  // fetch latest songs
  const [songRows] = await db.query(
    `SELECT
       id,
       name,
       title,
       slug,
       artist,
       artwork_filename AS image,
       cdn_url         AS audioUrl,
       playlist        AS playlistId,
       created         AS createdAt,
       is_free
     FROM audio_metadata
     WHERE is_discoverable = 1
     ORDER BY created DESC
     LIMIT ?`,
    [songLimit]
  );

  const songsWithFlags = attachAccessFlags(songRows, 'song');

  console.log(songsWithFlags.map(song => ({ id: song.id, is_free: song.is_free })));

  return {
    playlists: attachAccessFlags(plRows, 'playlist'),
    songs: songsWithFlags
  };
}

async function fetchDashboardAllSongs() {
  const [rows] = await db.query(
    `SELECT
       id,
       name,
       title,
       slug,
       description,
       artist,
       tags,
       category       AS categoryId,
       playlist       AS playlistId,
       artwork_filename AS image,
       cdn_url         AS audioUrl,
       created         AS createdAt,
       is_free
     FROM audio_metadata
     WHERE is_discoverable = 1
     ORDER BY createdAt DESC`
  );
  return attachAccessFlags(rows, 'song');
}


module.exports = {
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
};
