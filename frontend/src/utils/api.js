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
  tagTypes: ['User', 'Categories', 'Playlists', 'Songs'],
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
      query: ({ page = 1, pageSize = 20 } = {}) => ({
        url: '/admin/users',
        params: { page, pageSize },
      }),
      transformResponse: (response) => ({
        data: response.data || [],
        total: response.total || 0,
        page: response.page || 1,
        pageSize: response.pageSize || 20,
      }),
      providesTags: (result) =>
        result.data
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
      query: ({ plan, trial = false }) => ({
        url: '/subscribe/checkout',
        method: 'POST',
        body: { plan, trial },
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
  useGetBlogBySlugQuery
} = api;


