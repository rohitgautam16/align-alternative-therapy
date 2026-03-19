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
async function fetchDashboardAllPlaylists({ tagSlug } = {}) {
  let sql = `
    SELECT
      p.id,
      p.title            AS name,
      p.slug,
      p.description,
      p.paid,
      p.artwork_filename AS image,
      p.created          AS createdAt
    FROM playlists p
    WHERE p.is_discoverable = 1
  `;

  const params = [];

  if (tagSlug) {
    sql += `
      AND p.id IN (
        SELECT pt.playlist_id
        FROM playlist_tags pt
        INNER JOIN tags t ON t.id = pt.tag_id
        WHERE t.slug = ?
      )
    `;
    params.push(tagSlug);
    console.log("TAG RECEIVED:", tagSlug);
  }

  sql += ` ORDER BY p.created DESC`;

  const [rows] = await db.query(sql, params);

  // KEEP EXISTING CATEGORY LOGIC INTACT
  const [links] = await db.query(
    `SELECT playlist_id, category_id 
     FROM category_playlists`
  );

  const playlistMap = new Map();
  rows.forEach(p => {
    p.categoryIds = [];
    playlistMap.set(p.id, p);
  });

  links.forEach(link => {
    const p = playlistMap.get(link.playlist_id);
    if (p) {
      p.categoryIds.push(link.category_id);
    }
  });

  return attachAccessFlags(rows, 'playlist');
}

async function fetchDashboardPlaylistBySlug(slug) {
  const [rows] = await db.query(
    `SELECT
       p.id,
       p.title            AS name,
       p.slug,
       p.description,
       p.paid,
       p.artwork_filename AS image,
       p.created          AS createdAt,
       p.is_discoverable,
       p.category_id      AS categoryId
     FROM playlists p
     WHERE p.slug = ?
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

async function canUserAccessPlaylist(userId, playlistId) {
  if (!userId || !playlistId) return false;

  const [rows] = await db.query(
    `SELECT 1 FROM (
      SELECT i.playlist_id
      FROM personalize_recommendation_items i
      JOIN personalize_recommendations r ON r.id = i.recommendation_id AND r.deleted_at IS NULL
      JOIN personalize_questions q ON q.id = r.question_id AND q.deleted_at IS NULL
      WHERE q.user_id = ? AND i.playlist_id = ? AND i.deleted_at IS NULL

      UNION ALL

      SELECT i.playlist_id
      FROM pb_recommendation_items i
      JOIN pb_recommendations r ON r.id = i.recommendation_id AND r.deleted_at IS NULL
      WHERE r.user_id = ? AND i.playlist_id = ? AND i.deleted_at IS NULL
    ) t
    LIMIT 1`,
    [userId, playlistId, userId, playlistId]
  );

  return Array.isArray(rows) && rows.length > 0;
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
       s.id,
       s.name,
       s.title,
       s.slug,
       s.description,
       s.artist,
       s.tags,
       s.category,
       ps.playlist_id       AS playlistId,
       s.artwork_filename   AS image,
       s.cdn_url            AS audioUrl,
       s.created            AS createdAt,
       s.is_free,
       s.is_discoverable
     FROM audio_metadata s
     JOIN playlist_songs ps ON s.id = ps.song_id
     WHERE ps.playlist_id = ?
     AND s.is_discoverable = 1
     ORDER BY ps.created_at DESC`, // Sort by when it was added to the playlist
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


async function fetchDashboardNewReleases(
  { playlistLimit = 12, songLimit = 8, tagSlug } = {}
) {
  const playlistParams = [];
  const songParams = [];

  let playlistSql = `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.paid,
      p.artwork_filename AS image,
      p.category_id      AS categoryId,
      c.title            AS category_name,
      p.created          AS createdAt
    FROM playlists p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_discoverable = 1
  `;

  if (tagSlug) {
    playlistSql += `
      AND p.id IN (
        SELECT pt.playlist_id
        FROM playlist_tags pt
        INNER JOIN tags t ON t.id = pt.tag_id
        WHERE t.slug = ?
      )
    `;
    playlistParams.push(tagSlug);
  }

  playlistSql += `
    ORDER BY p.created DESC
    LIMIT ?
  `;
  playlistParams.push(playlistLimit);

  const [plRows] = await db.query(playlistSql, playlistParams);

  // ---- SONGS ----

  let songSql = `
    SELECT
      s.id,
      s.name,
      s.title,
      s.slug,
      s.artist,
      s.artwork_filename AS image,
      s.cdn_url          AS audioUrl,
      s.playlist         AS playlistId,
      p.title            AS playlistTitle,
      s.created          AS createdAt,
      s.is_free
    FROM audio_metadata s
    LEFT JOIN playlists p ON s.playlist = p.id
    WHERE s.is_discoverable = 1
  `;

  if (tagSlug) {
    songSql += `
      AND s.id IN (
        SELECT st.song_id
        FROM song_tags st
        INNER JOIN tags t ON t.id = st.tag_id
        WHERE t.slug = ?
      )
    `;
    songParams.push(tagSlug);
  }

  songSql += `
    ORDER BY s.created DESC
    LIMIT ?
  `;
  songParams.push(songLimit);

  const [songRows] = await db.query(songSql, songParams);

  const songsWithFlags = attachAccessFlags(songRows, 'song');

  return {
    playlists: attachAccessFlags(plRows, 'playlist'),
    songs: songsWithFlags
  };
}

async function fetchDashboardAllSongs({ tagSlug } = {}) {
  let sql = `
    SELECT
      s.id,
      s.name,
      s.title,
      s.slug,
      s.description,
      s.artist,
      s.category       AS categoryId,
      s.playlist       AS playlistId,
      s.artwork_filename AS image,
      s.cdn_url         AS audioUrl,
      s.created         AS createdAt,
      s.is_free
    FROM audio_metadata s
    WHERE s.is_discoverable = 1
  `;

  const params = [];

  if (tagSlug) {
    sql += `
      AND s.id IN (
        SELECT st.song_id
        FROM song_tags st
        INNER JOIN tags t ON t.id = st.tag_id
        WHERE t.slug = ?
      )
    `;
    params.push(tagSlug);
  }

  sql += ` ORDER BY s.created DESC`;

  const [rows] = await db.query(sql, params);

  return attachAccessFlags(rows, 'song');
}

async function fetchDashboardTags({ limit = 20 } = {}) {
  const sql = `
    SELECT
      t.id,
      t.name,
      t.slug,
      (
        COUNT(DISTINCT pt.playlist_id) +
        COUNT(DISTINCT st.song_id)
      ) AS usageCount
    FROM tags t

    LEFT JOIN playlist_tags pt
      ON pt.tag_id = t.id
    LEFT JOIN playlists p
      ON p.id = pt.playlist_id
      AND p.is_discoverable = 1

    LEFT JOIN song_tags st
      ON st.tag_id = t.id
    LEFT JOIN audio_metadata s
      ON s.id = st.song_id
      AND s.is_discoverable = 1

    GROUP BY t.id
    HAVING usageCount > 0
    ORDER BY usageCount DESC, t.name ASC
    LIMIT ?
  `;

  const [rows] = await db.query(sql, [limit]);

  return rows.map(tag => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    usageCount: Number(tag.usageCount)
  }));
}

module.exports = {
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
};
