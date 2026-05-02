// src/services/dashboardMusicService.js
const db = require('../db');
const { withAccessNormalization } = require('../utils/withAccessNormalization');
const { attachAccessFlags } = require('../utils/attachAccessFlags');

const DEFAULT_DASHBOARD_LIMIT = 24;
const MAX_DASHBOARD_LIMIT = 48;

function normalizePagination({ limit, offset } = {}) {
  const parsedLimit = Number.parseInt(limit, 10);
  const parsedOffset = Number.parseInt(offset, 10);

  return {
    limit: Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), MAX_DASHBOARD_LIMIT)
      : DEFAULT_DASHBOARD_LIMIT,
    offset: Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0,
  };
}

function hasPagination(args = {}) {
  return args.limit !== undefined || args.offset !== undefined;
}

function toPagedResponse(items, total, pagination) {
  const nextOffset = pagination.offset + items.length;

  return {
    items,
    total,
    nextOffset: nextOffset < total ? nextOffset : null,
  };
}

async function attachPreviewSongsToPlaylists(playlists) {
  if (!Array.isArray(playlists) || playlists.length === 0) return playlists;

  const playlistIds = playlists.map((playlist) => playlist.id).filter(Boolean);
  if (!playlistIds.length) return playlists;

  const [rows] = await db.query(
    `
      SELECT
        playlistIds.playlistId,
        s.id,
        s.name,
        s.title,
        s.slug,
        s.artist,
        s.description,
        s.artwork_filename AS image,
        s.cdn_url          AS audioUrl,
        s.is_free
      FROM (
        SELECT DISTINCT ps.playlist_id AS playlistId
        FROM playlist_songs ps
        WHERE ps.playlist_id IN (?)
      ) playlistIds
      JOIN audio_metadata s ON s.id = (
        SELECT
          ps2.song_id
        FROM playlist_songs ps2
        JOIN audio_metadata s2 ON s2.id = ps2.song_id
        WHERE ps2.playlist_id = playlistIds.playlistId
        AND s2.is_discoverable = 1
        ORDER BY ps2.created_at DESC, s2.created DESC, s2.id DESC
        LIMIT 1
      )
    `,
    [playlistIds]
  );

  const previewSongs = new Map(
    attachAccessFlags(rows, 'song').map((song) => [song.playlistId, song])
  );

  return playlists.map((playlist) => ({
    ...playlist,
    previewSong: previewSongs.get(playlist.id) || null,
  }));
}

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
async function fetchDashboardAllPlaylists({ tagSlug, limit, offset } = {}) {
  const paginated = hasPagination({ limit, offset });
  const pagination = normalizePagination({ limit, offset });
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

  const countSql = `
    SELECT COUNT(*) AS total
    FROM playlists p
    WHERE p.is_discoverable = 1
    ${tagSlug ? `
      AND p.id IN (
        SELECT pt.playlist_id
        FROM playlist_tags pt
        INNER JOIN tags t ON t.id = pt.tag_id
        WHERE t.slug = ?
      )
    ` : ''}
  `;

  sql += ` ORDER BY p.created DESC`;

  if (paginated) {
    sql += ` LIMIT ? OFFSET ?`;
    params.push(pagination.limit, pagination.offset);
  }

  const [rows] = await db.query(sql, params);
  const countParams = tagSlug ? [tagSlug] : [];
  const [[countRow]] = paginated ? await db.query(countSql, countParams) : [[{ total: rows.length }]];

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

  const playlists = await attachPreviewSongsToPlaylists(attachAccessFlags(rows, 'playlist'));

  return paginated
    ? toPagedResponse(playlists, Number(countRow?.total || 0), pagination)
    : playlists;
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

async function fetchDashboardFreePlaylists({ limit, offset } = {}) {
  const paginated = hasPagination({ limit, offset });
  const pagination = normalizePagination({ limit, offset });
  const params = [];

  let sql = `
    SELECT
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
     ORDER BY createdAt DESC
  `;

  if (paginated) {
    sql += ` LIMIT ? OFFSET ?`;
    params.push(pagination.limit, pagination.offset);
  }

  const [rows] = await db.query(
    sql,
    params
  );

  const [[countRow]] = paginated
    ? await db.query(
      `SELECT COUNT(*) AS total
       FROM playlists
       WHERE paid = 0
       AND is_discoverable = 1`
    )
    : [[{ total: rows.length }]];

  const playlists = await attachPreviewSongsToPlaylists(attachAccessFlags(rows, 'playlist'));

  return paginated
    ? toPagedResponse(playlists, Number(countRow?.total || 0), pagination)
    : playlists;
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
  { playlistLimit = 12, songLimit = 8, playlistOffset = 0, songOffset = 0, tagSlug } = {}
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
    LIMIT ? OFFSET ?
  `;
  playlistParams.push(
    Math.min(Math.max(Number.parseInt(playlistLimit, 10) || 12, 1), MAX_DASHBOARD_LIMIT),
    Math.max(Number.parseInt(playlistOffset, 10) || 0, 0)
  );

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
    LIMIT ? OFFSET ?
  `;
  songParams.push(
    Math.min(Math.max(Number.parseInt(songLimit, 10) || 8, 1), MAX_DASHBOARD_LIMIT),
    Math.max(Number.parseInt(songOffset, 10) || 0, 0)
  );

  const [songRows] = await db.query(songSql, songParams);

  const songsWithFlags = attachAccessFlags(songRows, 'song');
  const playlistsWithFlags = await attachPreviewSongsToPlaylists(attachAccessFlags(plRows, 'playlist'));

  return {
    playlists: playlistsWithFlags,
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
