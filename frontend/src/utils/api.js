// src/utils/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

function getAccessTokenFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)_auth=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

console.log('API baseUrl is', import.meta.env.VITE_API_BASE_URL);

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    credentials: 'include',
    prepareHeaders: headers => {
      const token = getAccessTokenFromCookie();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['User', 'Categories', 'Playlists', 'Songs', 'PQ', 'REC', 'FU', 'PB', 'PB_REC', 'PB_ITEM', 'PersonalizeUser'],
  endpoints: (build) => ({

    getR2PresignUrl: build.query({
      query: ({ filename, contentType, folder }) => ({
        url: "admin/r2/presign",
        params: { filename, contentType, folder },
      }),
    }),

    adminLogin: build.mutation({
      query: (credentials) => ({
        url: 'auth/admin-login',
        method: 'POST',
        body: credentials,
      }),
    }),

    listUsers: build.query({
      query: ({ page = 1, pageSize = 20, search = '' } = {}) => {
        // Build params object
        const params = { page, pageSize };
        
        // Only add search if it has a value
        if (search && search.trim()) {
          params.search = search.trim();
        }
        
        return {
          url: '/admin/users',
          params,
        };
      },
      transformResponse: (response) => ({
        data: response.data || [],
        total: response.total || 0, // This is returning 0 - backend issue!
        page: response.page || 1,
        pageSize: response.pageSize || 20,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((u) => ({ type: 'User', id: u.id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),


    getAdmins: build.query({
      query: ({ page = 1, pageSize = 6 }) =>
        `/admin/users/admins?page=${page}&pageSize=${pageSize}`,
    }),

    // Admin: get single user by ID (detailed view)

    getAdminUser: build.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    createUser: build.mutation({
      query: (newUser) => ({
        url: 'admin/users',
        method: 'POST',
        body: newUser,
      }),
      invalidatesTags: ['User'],
    }),

    // Update an existing user
    updateUser: build.mutation({
      query: ({ id, ...patch }) => ({
        url: `admin/users/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['User'],
    }),

    // Soft‑delete a user
    deleteUser: build.mutation({
      query: (id) => ({
        url: `admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    retryPayment: build.mutation({
      query: ({ id }) => ({
        url: `/admin/users/${id}/retry-payment`,
        method: 'POST',
      }),
      invalidatesTags: ['Users'],
    }),

    listCategories: build.query({
      query: ({ page = 1, pageSize = 20 } = {}) => ({
        url: '/admin/categories',
        params: { page, pageSize },
      }),
      transformResponse: (res) => {
        // If the server returned a raw array, wrap it:
        const items = Array.isArray(res) ? res : res.data;
        const total = res.total ?? items.length;
        const currentPage = res.page ?? 1;
        const currentPageSize = res.pageSize ?? items.length;
        return {
          data: items,
          total,
          page: currentPage,
          pageSize: currentPageSize,
        };
      },
      providesTags: (result) =>
        result.data
          ? [
              ...result.data.map((cat) => ({ type: 'Category', id: cat.id })),
              { type: 'Category', id: 'LIST' },
            ]
          : [{ type: 'Category', id: 'LIST' }],
    }),

    // ─── Get single category ────────────────────────────
    getAdminCategory: build.query({
      query: (id) => `/admin/categories/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Category', id }],
    }),

    // ─── Create category ────────────────────────────────
    createCategory: build.mutation({
      query: (newCat) => ({
        url: '/admin/categories',
        method: 'POST',
        body: newCat,
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    // ─── Update category ────────────────────────────────
    updateCategory: build.mutation({
      query: ({ id, ...patch }) => ({
        url: `/admin/categories/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    // ─── Delete category ────────────────────────────────
    deleteCategory: build.mutation({
      query: (id) => ({
        url: `/admin/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    listPlaylists: build.query({
      query: ({ page = 1, pageSize = 20 } = {}) => ({
        url: '/admin/playlists',
        params: { page, pageSize },
      }),
      transformResponse: (res) => {
        const items    = Array.isArray(res) ? res : res.data || [];
        const total    = res.total    ?? items.length;
        const pageNum  = res.page     ?? 1;
        const ps       = res.pageSize ?? items.length;
        return { data: items, total, page: pageNum, pageSize: ps };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((p) => ({ type: 'Playlist', id: p.id })),
              { type: 'Playlist', id: 'LIST' },
            ]
          : [{ type: 'Playlist', id: 'LIST' }],
    }),

    // ─── Get single playlist ──────────────────────────────
    getAdminPlaylist: build.query({
      query: (id) => `/admin/playlists/${id}`,
      transformResponse: (res) => res.data ?? res,
      providesTags: (_res, _err, id) => [{ type: 'Playlist', id }],
    }),

    // ─── Create playlist ──────────────────────────────────
    createPlaylist: build.mutation({
      query: (newP) => ({
        url: '/admin/playlists',
        method: 'POST',
        body: newP,
      }),
      invalidatesTags: [{ type: 'Playlist', id: 'LIST' }],
    }),


    updatePlaylist: build.mutation({
      query: ({ id, ...patch }) => ({
        url: `/admin/playlists/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Playlist', id },
        { type: 'Playlist', id: 'LIST' },
      ],
    }),

    deletePlaylist: build.mutation({
      query: (id) => ({
        url: `/admin/playlists/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Playlist', id: 'LIST' }],
    }),

    getAdminSongs: build.query({
      query: ({ page = 1, pageSize = 10 }) =>
        `admin/songs?page=${page}&pageSize=${pageSize}`,
      providesTags: ['AdminSongs']
    }),

    getAdminSong: build.query({
      query: (id) => `admin/songs/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminSongs', id }]
    }),

    createAdminSong: build.mutation({
      query: (newSong) => ({
        url: 'admin/songs',
        method: 'POST',
        body: newSong
      }),
      invalidatesTags: ['AdminSongs']
    }),

    updateAdminSong: build.mutation({
      query: ({ id, ...data }) => ({
        url: `admin/songs/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminSongs', id },
        'AdminSongs'
      ]
    }),

    deleteAdminSong: build.mutation({
      query: (id) => ({
        url: `admin/songs/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['AdminSongs']
    }),

    listR2Objects: build.query({
  query: ({ prefix = '', continuationToken, maxKeys = 50, search = '' }) => ({
    url: `admin/r2/list?prefix=${encodeURIComponent(prefix)}`
       + `${continuationToken ? `&continuationToken=${continuationToken}` : ''}`
       + `&maxKeys=${maxKeys}`
       + `&search=${encodeURIComponent(search)}`,
    method: 'GET',
  }),
  providesTags: ['R2Objects'],
    }),

    // 2) Get metadata for a single object
    getR2ObjectMeta: build.query({
      query: (key) => ({
        url: `admin/r2/meta/${encodeURIComponent(key)}`,
        method: 'GET',
      }),
      providesTags: (result, error, key) => [{ type: 'R2Objects', id: key }],
    }),

    // 3) Create a zero‑byte “folder”
    createR2Folder: build.mutation({
      query: (prefix) => ({
        url: 'admin/r2/folder',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
      }),
      invalidatesTags: ['R2Objects'],
    }),

    // 4) Upload files into a folder
    uploadR2Files: build.mutation({
      query: ({ prefix, files }) => {
        const form = new FormData();
        form.append('prefix', prefix);
        files.forEach(f => form.append('files', f));
        return {
          url: 'admin/r2/upload',
          method: 'POST',
          body: form,
        };
      },
      invalidatesTags: ['R2Objects'],
    }),

    // 5) Delete a single file
    deleteR2File: build.mutation({
      query: (key) => ({
        url: 'admin/r2/file',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      }),
      invalidatesTags: (result, error, key) => [{ type: 'R2Objects', id: key }, 'R2Objects'],
    }),

    // 6) Delete a folder + its contents
    deleteR2Folder: build.mutation({
      query: (prefix) => ({
        url: 'admin/r2/folder',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
      }),
      invalidatesTags: ['R2Objects'],
    }),

    // Public User 

    loginUser: build.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    registerUser: build.mutation({
      query: user => ({
        url: '/auth/register',
        method: 'POST',
        body: {
          full_name: user.fullName,
          email: user.email,
          password: user.password
        }
      })
    }),

    refreshToken: build.query({
      query: () => ({ url: 'auth/refresh', method: 'POST' }),
    }),

    logoutUser: build.mutation({
      query: () => ({ url: 'auth/logout', method: 'POST' }),
    }),

    getProfile: build.query({
      query: () => '/user/profile',
      providesTags: ['Profile'],
    }),

    
    updateProfile: build.mutation({
      query: ({ full_name }) => ({
        url: '/user/update',
        method: 'PUT',
        body: { full_name },
      }),
      invalidatesTags: ['Profile'],
    }),

    
    deleteProfile: build.mutation({
      query: () => ({
        url: '/user/delete',
        method: 'DELETE',
      }),
      invalidatesTags: ['Profile'],
    }),

    restoreAccount: build.mutation({
      query: () => ({
        url: `/user/restore`,
        method: 'POST',
      })
    }),

    // createCheckoutSession: build.mutation({
    //   query: ({ plan, trial }) => ({
    //     url: 'subscribe/checkout',
    //     method: 'POST',
    //     body: { plan, trial },
    //   }),
    // }),

    checkoutSubscription: build.mutation({
      query: ({ plan, trial = false, includeAddon = false }) => ({
        url: '/subscribe/checkout',
        method: 'POST',
        body: { plan, trial, includeAddon },
      }),
    }),

    checkoutAddon: build.mutation({
      query: (body = {}) => ({
        url: 'subscribe/checkout-addon',
        method: 'POST',
        body, // optional: { plan: 'monthly' | 'annual' }
      }),
    }),

    getSubscriptionSummary: build.query({
      query: () => 'subscribe/summary',
      providesTags: ['Subscription'],
      keepUnusedDataFor: 0, // drop cache ASAP when unused
      refetchOnMountOrArgChange: true, // always get fresh on mount/user change
      transformResponse: (res) => res || { hasSubscription: false, status: 'none' },
    }),

    createBillingPortalSession: build.mutation({
      query: () => ({
        url: '/billing/portal',
        method: 'POST',
      }),
    }),

    getSubscriptions: build.query({
      query: () => '/user/subscriptions',
      providesTags: ['Subscriptions'],
    }),

    getUser: build.query({
      query: () => 'users',
      providesTags: ['User'],
    }),

   
    getCategories: build.query({
      query: () => 'categories',
      providesTags: ['Categories'],
    }),

   
    getPlaylistById: build.query({
      query: (categoryId) =>
        categoryId ? `categories/${categoryId}/playlists` : 'playlists',
      providesTags: (result, error, arg) =>
        arg ? [{ type: 'Playlists', id: arg }] : ['Playlists'],
    }),

    getDashboardFreePlaylists: build.query({
      query: () => 'dashboard/playlists/free',
      providesTags: ['Playlists'],
    }),

    getDashboardAllPlaylists: build.query({
      query: () => `dashboard/playlists`,          
      providesTags: ['Playlists'],
    }),

    getDashboardPlaylistById: build.query({
      query: (id) => `dashboard/playlists/${id}`,
      providesTags: (result) =>
        result ? [{ type: 'Playlists', id: result.id }] : [],
    }),

    getSongs: build.query({
      query: (playlistId) => `playlists/${playlistId}/songs`,
      providesTags: (result, error, arg) => [{ type: 'Songs', id: arg }],
    }),

    getSearchResults: build.query({
      query: (term) => ({
        url: '/search',
        params: { query: term },    
      }),
    }),

    getSongById: build.query({
      query: (songId) => `songs/${songId}`,
      providesTags: (result, error, id) => [{ type: 'Songs', id }],
    }),

    getSongBySlug: build.query({
      query: (slug) => `songs/slug/${slug}`,
    }),

    getDashboardNewReleases: build.query({
      /**
       * @arg {{ playlistLimit?: number, songLimit?: number }}
       */
      query: ({ playlistLimit = 12, songLimit = 8 } = {}) => ({
        url: `dashboard/playlists/new-releases`,
        params: { playlistLimit, songLimit }
      }),
      // no tags needed unless you invalidate
    }),

    getAllSongs: build.query({
      query: () => `dashboard/songs`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Songs', id })), { type: 'Songs', id: 'LIST' }]
          : [{ type: 'Songs', id: 'LIST' }],
    }),

    getUserPlaylists: build.query({
      query: () => 'user-playlists',
      providesTags: (result) =>
        result
          ? [
              ...result.playlists.map((p) => ({
                type: 'UserPlaylists',
                id: p.id
              })),
              { type: 'UserPlaylists', id: 'LIST' }
            ]
          : [{ type: 'UserPlaylists', id: 'LIST' }]
    }),

    createUserPlaylist: build.mutation({
      query: ({ title, artwork_filename }) => ({
        url: 'user-playlists',
        method: 'POST',
        body: { title, artwork_filename }
      }),
      invalidatesTags: [{ type: 'UserPlaylists', id: 'LIST' }]
    }),

    updateUserPlaylist: build.mutation({
      query: ({ id, ...body }) => ({
        url: `user-playlists/${id}`,
        method: 'PUT',
        body
      }),
      // transform so hook returns `payload.playlist` directly
      transformResponse: (response) => response.playlist,
      invalidatesTags: (result, error, { id }) => [
        { type: 'UserPlaylists', id },
        { type: 'UserPlaylists', id: 'LIST' },
      ],
    }),

    deleteUserPlaylist: build.mutation({
      query: (id) => ({
        url: `user-playlists/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'UserPlaylists', id: 'LIST' }]
    }),

    addSongToUserPlaylist: build.mutation({
      query: ({ playlistId, songId }) => ({
        url: `user-playlists/${playlistId}/songs`,
        method: 'POST',
        body: { songId }
      }),
      // you may want to re-fetch playlist details here
    }),

    removeSongFromUserPlaylist: build.mutation({
      query: ({ playlistId, songId }) => ({
        url: `user-playlists/${playlistId}/songs/${songId}`,
        method: 'DELETE'
      })
    }),

    getUserPlaylistDetails: build.query({
      query: (id) => `user-playlists/${id}`,
      providesTags: (result, error, id) => [{ type: 'UserPlaylists', id }]
    }),

    getUserPlaylistBySlug: build.query({
      query: (slug) => `user-playlists/slug/${slug}`,
      transformResponse: (response) => response.playlist,    // pull out the payload
      providesTags: (playlist) =>
        playlist ? [{ type: 'UserPlaylist', id: playlist.id }] : []
    }),

    recordPlay: build.mutation({
      query: (songId) => ({
        url: 'user/plays',
        method: 'POST',
        body: { songId },
      }),
      invalidatesTags: ['RecentPlays'],
    }),
    // get recent plays
    getRecentPlays: build.query({
      query: (limit = 20) => `user/recent-plays?limit=${limit}`,
      providesTags: ['RecentPlays'],
    }),

    toggleFavoriteSong: build.mutation({
      query: (songId) => ({
        url: 'user/favorites/songs',
        method: 'POST',
        body: { songId },
      }),
      invalidatesTags: ['FavSongs'],
    }),
    getFavoriteSongs: build.query({
      query: () => 'user/favorites/songs',
      providesTags: ['FavSongs'],
    }),

    toggleFavoritePlaylist: build.mutation({
      query: (playlistId) => ({
        url: 'user/favorites/playlists',
        method: 'POST',
        body: { playlistId },
      }),
      invalidatesTags: ['FavPlaylists'],
    }),
    getFavoritePlaylists: build.query({
      query: () => 'user/favorites/playlists',
      providesTags: ['FavPlaylists'],
    }),


    getRecentlyPlayed: build.query({
      query: () => 'playlists/recently-played',
      providesTags: ['Playlists'],
    }),
    getMostListened: build.query({
      query: () => 'playlists/most-listened',
      providesTags: ['Playlists'],
    }),
    getBlogs: build.query(
      { query: () => '/blogs' }
    ),
    getBlogBySlug: build.query(
      { query: (slug) => `/blogs/${slug}` }
    ),

    // Personalized Plan

    getMyQuestions: build.query({
      query: ({ page = 1, pageSize = 20 } = {}) => ({
        url: `personalize/questions`,
        params: { page, pageSize },
      }),
      providesTags: (result) =>
        result?.length
          ? [{ type: 'PQ', id: 'LIST' }, ...result.map((q) => ({ type: 'PQ', id: q.id }))]
          : [{ type: 'PQ', id: 'LIST' }],
    }),

    getMyQuestion: build.query({
      query: (id) => `personalize/questions/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'PQ', id }],
    }),

    createQuestion: build.mutation({
      query: (payload) => ({
        url: `personalize/questions`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'PQ', id: 'LIST' }],
    }),

    addMyMessage: build.mutation({
      query: ({ questionId, body, attachment_url = null }) => ({
        url: `personalize/questions/${questionId}/messages`,
        method: 'POST',
        body: { body, attachment_url },
      }),
      invalidatesTags: (_res, _err, { questionId }) => [{ type: 'PQ', id: questionId }],
    }),

    getMyRecommendation: build.query({
      query: (recId) => `personalize/recommendations/${recId}`,
      providesTags: (_res, _err, recId) => [{ type: 'REC', id: recId }],
    }),

    addItemFeedback: build.mutation({
      query: ({ itemId, feedback, comment = null }) => ({
        url: `personalize/items/${itemId}/feedback`,
        method: 'POST',
        body: { feedback, comment },
      }),
      // UI can update locally; no refetch strictly required
    }),

    listMyFollowups: build.query({
      query: ({ status = 'pending', limit = 50 } = {}) => ({
        url: `personalize/followups`,
        params: { status, limit },
      }),
      providesTags: (result) =>
        result?.length
          ? [{ type: 'FU', id: 'LIST' }, ...result.map((f) => ({ type: 'FU', id: f.id }))]
          : [{ type: 'FU', id: 'LIST' }],
    }),

    recordMyFollowupResponse: build.mutation({
      query: ({ followupId, response, notes = null }) => ({
        url: `personalize/followups/${followupId}/response`,
        method: 'POST',
        body: { response, notes },
      }),
      invalidatesTags: (_res, _err, { followupId }) => [{ type: 'FU', id: followupId }],
    }),

    // ---------- ADMIN: Personalized ----------
    adminListQuestions: build.query({
      query: (params = {}) => ({
        url: `personalize/admin/questions`,
        params, // { status, category, mood, urgency, assigned_admin_id, q, page, pageSize }
      }),
      providesTags: (result) =>
        result?.length
          ? [{ type: 'PQ', id: 'ADMIN_LIST' }, ...result.map((q) => ({ type: 'PQ', id: q.id }))]
          : [{ type: 'PQ', id: 'ADMIN_LIST' }],
    }),

    adminGetQuestion: build.query({
      query: (id) => `personalize/admin/questions/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'PQ', id }],
    }),

    adminAssignQuestion: build.mutation({
      query: ({ questionId, adminId }) => ({
        url: `personalize/admin/questions/${questionId}/assign`,
        method: 'POST',
        body: { adminId },
      }),
      invalidatesTags: (_res, _err, { questionId }) => [
        { type: 'PQ', id: questionId },
        { type: 'PQ', id: 'ADMIN_LIST' },
      ],
    }),

    adminAddMessage: build.mutation({
      query: ({ questionId, body, attachment_url = null }) => ({
        url: `personalize/admin/questions/${questionId}/messages`,
        method: 'POST',
        body: { body, attachment_url },
      }),
      // We'll optimistic-update the adminGetQuestion cache in UI
    }),

    adminUpdateQuestionStatus: build.mutation({
      query: ({ questionId, status }) => ({
        url: `personalize/admin/questions/${questionId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_res, _err, { questionId }) => [
        { type: 'PQ', id: questionId },
        { type: 'PQ', id: 'ADMIN_LIST' },
      ],
    }),

    adminCreateRecommendation: build.mutation({
      query: ({ questionId, summary_note, items = [] }) => ({
        url: `personalize/admin/recommendations`,
        method: 'POST',
        body: { questionId, summary_note, items },
      }),
      // we'll refetch the question thread to pull new rec list
      invalidatesTags: (_res, _err, { questionId }) => [{ type: 'PQ', id: questionId }],
    }),

    adminGetRecommendation: build.query({
      query: (recId) => `personalize/admin/recommendations/${recId}`,
      providesTags: (_res, _err, recId) => [{ type: 'REC', id: recId }],
    }),

    adminAddRecommendationItem: build.mutation({
      query: ({ recId, item_type, track_id, playlist_id, prescription_note, display_order }) => ({
        url: `personalize/admin/recommendations/${recId}/items`,
        method: 'POST',
        body: { item_type, track_id, playlist_id, prescription_note, display_order },
      }),
      invalidatesTags: (_r, _e, { recId }) => [{ type: 'REC', id: recId }],
    }),

    adminUpdateRecommendationItem: build.mutation({
      query: ({ itemId, patch }) => ({
        url: `personalize/admin/recommendations/items/${itemId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { recId }) => [{ type: 'REC', id: recId }],
    }),

    adminDeleteRecommendationItem: build.mutation({
      query: ({ itemId }) => ({
        url: `personalize/admin/recommendations/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { recId }) => [{ type: 'REC', id: recId }],
    }),

    adminSendRecommendation: build.mutation({
      query: ({ recId }) => ({
        url: `personalize/admin/recommendations/${recId}/send`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { recId }) => [{ type: 'REC', id: recId }],
    }),

    adminUpdateRecommendationStatus: build.mutation({
      query: ({ recId, status }) => ({
        url: `personalize/admin/recommendations/${recId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { recId }) => [{ type: 'REC', id: recId }],
    }),

    adminListTemplates: build.query({
      query: (params = {}) => ({ url: `personalize/admin/templates`, params }),
      // use local refetch in UI to avoid adding a new tag type
    }),

    adminCreateTemplate: build.mutation({
      query: (payload) => ({ url: `personalize/admin/templates`, method: 'POST', body: payload }),
    }),

    adminUpdateTemplate: build.mutation({
      query: ({ templateId, patch }) => ({
        url: `personalize/admin/templates/${templateId}`,
        method: 'PATCH',
        body: patch,
      }),
    }),

    adminDeleteTemplate: build.mutation({
      query: ({ templateId }) => ({
        url: `personalize/admin/templates/${templateId}`,
        method: 'DELETE',
      }),
    }),

    adminListFollowups: build.query({
      query: (params = {}) => ({ url: `personalize/admin/followups`, params }),
      providesTags: (result) =>
        result?.length
          ? [{ type: 'FU', id: 'ADMIN_LIST' }, ...result.map((f) => ({ type: 'FU', id: f.id }))]
          : [{ type: 'FU', id: 'ADMIN_LIST' }],
    }),

    adminMarkFollowupSent: build.mutation({
      query: ({ followupId }) => ({
        url: `personalize/admin/followups/${followupId}/sent`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { followupId }) => [{ type: 'FU', id: followupId }, { type: 'FU', id: 'ADMIN_LIST' }],
    }),
    // ---------- END ADMIN: Personalized ----------

     /* -------- PB Admin: list recs for a user -------- */
      createPersonalizeBasicRequest: build.mutation({
        query: (payload) => ({
          url: 'personalize-basic/request',
          method: 'POST',
          body: payload, // { name, email, mobile?, notes? }
        }),
        invalidatesTags: [], // none for now
      }),

      // --- PB Admin searches (no default list; requires q) ---
      adminPbSearchUsers: build.query({
        query: ({ q }) => ({
          url: '/admin/pb/search/users',
          params: { q },   // now q is a string
        }),
      }),
      adminPbSearchSongs: build.query({
        query: ({ q }) => ({
          url: '/admin/pb/search/songs',
          params: { q },
        }),
      }),
      adminPbSearchPlaylists: build.query({
        query: ({ q }) => ({
          url: '/admin/pb/search/playlists',
          params: { q },
        }),
      }),


      // --- PB Admin CRUD ---
      adminPbListForUser: build.query({
        query: ({ userId }) => ({ url: '/admin/pb/recommendations', params: { userId } }),
        providesTags: (result) => [
          { type: 'REC', id: 'LIST' },
          ...(result?.map?.((r) => ({ type: 'REC', id: r.id })) ?? []),
        ],
      }),
      adminPbCreate: build.mutation({
        query: ({ userId, title, summary_note, items }) => ({
          url: '/admin/pb/recommendations',
          method: 'POST',
          body: { userId, title, summary_note, items },
        }),
      }),
      adminPbGetOne: build.query({
        query: (recId) => `/admin/pb/recommendations/${recId}`,
        providesTags: (_res, _err, recId) => [{ type: 'REC', id: recId }],
      }),
      adminPbAddItem: build.mutation({
        query: ({ recId, item_type, track_id, playlist_id, prescription_note, display_order }) => ({
          url: `/admin/pb/recommendations/${recId}/items`,
          method: 'POST',
          body: { item_type, track_id, playlist_id, prescription_note, display_order },
        }),
        invalidatesTags: (_res, _err, { recId }) => [{ type: 'REC', id: recId }],
      }),
      adminPbUpdateItem: build.mutation({
        query: ({ itemId, patch }) => ({
          url: `/admin/pb/recommendations/items/${itemId}`,
          method: 'PUT',
          body: patch,
        }),
      }),

      adminPbDeleteItem: build.mutation({
        query: (itemId) => ({
          url: `/admin/pb/recommendations/items/${itemId}`,
          method: 'DELETE',
        }),
      }),

      // --- Admin PB Recommendations ---
      deletePbRecommendation: build.mutation({
        query: ({ id, cascade = true }) => ({
          url: `/admin/pb/recommendations/${id}?cascade=${cascade}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['AdminPBRecommendations'], // optional, depends on how you tag caching
      }),

      restorePbRecommendation: build.mutation({
        query: ({ id, cascade = true }) => ({
          url: `/admin/pb/recommendations/${id}/restore?cascade=${cascade}`,
          method: 'POST',
        }),
        invalidatesTags: ['AdminPBRecommendations'],
      }),

      adminPbListDeletedForUser: build.query({
        query: (userId) => `/admin/pb/recommendations/deleted/${userId}`,
        providesTags: ['AdminPBRecommendations'],
      }),

      hardDeletePbRecommendation: build.mutation({
        query: (id) => ({
          url: `/admin/pb/recommendations/${id}/hard`,
          method: 'DELETE',
        }),
        invalidatesTags: ['AdminPBRecommendations'],
      }),

      adminPbUpdateStatus: build.mutation({
        query: ({ recId, status }) => ({
          url: `/admin/pb/recommendations/${recId}/status`,
          method: 'PUT',
          body: { status },
        }),
      }),
      adminPbSendNow: build.mutation({
        query: (recId) => ({
          url: `/admin/pb/recommendations/${recId}/send`,
          method: 'POST',
        }),
        invalidatesTags: (_res, _err, recId) => [{ type: 'REC', id: recId }],
      }),


      /* -------- PB User: list my recommendations (with items) -------- */
        listMyPbRecommendations: build.query({
          query: () => ({
            url: '/pb/my-recommendations',
            method: 'GET',
          }),
          providesTags: (result) =>
            Array.isArray(result)
              ? [
                  ...result.map((r) => ({ type: 'PB', id: r?.recommendation?.id })),
                  { type: 'PB', id: 'MINE' },
                ]
              : [{ type: 'PB', id: 'MINE' }],
        }),

        adminPbGetAllUsersWithRecommendations: build.query({
              query: ({ page = 1, pageSize = 20 } = {}) => ({
                url: '/admin/personalize/users-with-recommendations',
                params: { page, pageSize },
              }),
              transformResponse: (response) => ({
                data: response.data || [],
                total: response.total || 0,
                page: response.page || 1,
                pageSize: response.pageSize || 20,
              }),
              providesTags: (result) =>
                result?.data
                  ? [
                      ...result.data.map((u) => ({ type: 'PersonalizeUser', id: u.id })),
                      { type: 'PersonalizeUser', id: 'LIST' },
                    ]
                  : [{ type: 'PersonalizeUser', id: 'LIST' }],
            }),

            // In your API file where you define the queries
createPbPaymentLink: build.mutation({
  query: ({ recommendationId, price }) => ({
    url: '/pb-payment/admin/create-link',
    method: 'POST',
    body: { recommendationId, price },
  }),
  // ✅ ADDED: Invalidate payment status cache after creating link
  invalidatesTags: (result, error, { recommendationId }) => [
    { type: 'PbPaymentStatus', id: recommendationId },
    { type: 'PbRecommendation', id: recommendationId },
  ],
}),

getPbPaymentStatus: build.query({
  query: (id) => `/pb-payment/status/${id}`,
  // ✅ ADDED: Tag this query so it can be invalidated
  providesTags: (result, error, id) => [{ type: 'PbPaymentStatus', id }],
}),


  }),
});


export const {
  useGetR2PresignUrlQuery,
  useAdminLoginMutation,
  useListUsersQuery,
  useGetAdminsQuery,
  useGetAdminUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useRetryPaymentMutation,
  useListCategoriesQuery,
  useGetAdminCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useListPlaylistsQuery,
  useGetAdminPlaylistQuery,
  useCreatePlaylistMutation,
  useUpdatePlaylistMutation,
  useGetAdminSongsQuery,
  useGetAdminSongQuery,
  useCreateAdminSongMutation,
  useUpdateAdminSongMutation,
  useDeleteAdminSongMutation,
  useDeletePlaylistMutation,
  useListR2ObjectsQuery,
  useGetR2ObjectMetaQuery,
  useCreateR2FolderMutation,
  useUploadR2FilesMutation,
  useDeleteR2FileMutation,
  useDeleteR2FolderMutation,
  useLoginUserMutation,
  useRegisterUserMutation,
  useRefreshTokenQuery,
  useLogoutUserMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteProfileMutation,
  useRestoreAccountMutation,
  useCheckoutSubscriptionMutation,
  useCheckoutAddonMutation,
  useGetSubscriptionSummaryQuery,
  useCreateBillingPortalSessionMutation,
  useGetSubscriptionsQuery,
  useCreateCheckoutSessionMutation,
  useGetUserQuery,
  useGetCategoriesQuery,
  useGetPlaylistByIdQuery,
  useGetDashboardFreePlaylistsQuery,
  useGetDashboardAllPlaylistsQuery,
  useGetDashboardPlaylistByIdQuery,
  useGetSongsQuery,
  useGetSongByIdQuery,
  useGetSongBySlugQuery,
  useGetDashboardNewReleasesQuery,
  useGetAllSongsQuery,
  useCreateUserPlaylistMutation,
  useGetUserPlaylistsQuery,
  useGetUserPlaylistBySlugQuery,
  useGetUserPlaylistDetailsQuery,
  useUpdateUserPlaylistMutation,
  useDeleteUserPlaylistMutation,
  useAddSongToUserPlaylistMutation,
  useRemoveSongFromUserPlaylistMutation,
  useGetSearchResultsQuery,
  useRecordPlayMutation,
  useGetRecentPlaysQuery,
  useToggleFavoriteSongMutation,
  useGetFavoriteSongsQuery,
  useToggleFavoritePlaylistMutation,
  useGetFavoritePlaylistsQuery,
  useGetRecentlyPlayedQuery,
  useGetMostListenedQuery,
  useGetBlogsQuery,
  useGetBlogBySlugQuery,

  //personalized service
  useGetMyQuestionsQuery,
  useGetMyQuestionQuery,
  useCreateQuestionMutation,
  useAddMyMessageMutation,
  useGetMyRecommendationQuery,
  useAddItemFeedbackMutation,
  useListMyFollowupsQuery,
  useRecordMyFollowupResponseMutation,

  //Admin personalized service
  useAdminListQuestionsQuery,
  useAdminGetQuestionQuery,
  useAdminAssignQuestionMutation,
  useAdminAddMessageMutation,
  useAdminUpdateQuestionStatusMutation,
  useAdminCreateRecommendationMutation,
  useAdminGetRecommendationQuery,
  useAdminAddRecommendationItemMutation,
  useAdminUpdateRecommendationItemMutation,
  useAdminDeleteRecommendationItemMutation,
  useAdminSendRecommendationMutation,
  useAdminUpdateRecommendationStatusMutation,
  useAdminListTemplatesQuery,
  useAdminCreateTemplateMutation,
  useAdminUpdateTemplateMutation,
  useAdminDeleteTemplateMutation,
  useAdminListFollowupsQuery,
  useAdminMarkFollowupSentMutation,

  // Personalize Basic
  useCreatePersonalizeBasicRequestMutation,
  useAdminPbSearchUsersQuery,
  useAdminPbSearchSongsQuery,
  useAdminPbSearchPlaylistsQuery,

  useAdminPbListForUserQuery,
  useAdminPbCreateMutation,
  useAdminPbGetOneQuery,
  useAdminPbAddItemMutation,
  useAdminPbUpdateItemMutation,
  useAdminPbDeleteItemMutation,
  useDeletePbRecommendationMutation,
  useRestorePbRecommendationMutation,
  useAdminPbListDeletedForUserQuery,
  useHardDeletePbRecommendationMutation,
  useAdminPbUpdateStatusMutation,
  useAdminPbSendNowMutation,

  // PB User
  useListMyPbRecommendationsQuery,
  useAdminPbGetAllUsersWithRecommendationsQuery,
  useCreatePbPaymentLinkMutation,
  useGetPbPaymentStatusQuery,
} = api;


