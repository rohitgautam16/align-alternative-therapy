// src/utils/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers) => {
      // Attach auth token if available
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['User', 'Categories', 'Playlists', 'Songs'],
  endpoints: (build) => ({
    
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
    getRecentlyPlayed: build.query({
      query: () => 'playlists/recently-played',
      providesTags: ['Playlists'],
    }),
    getMostListened: build.query({
      query: () => 'playlists/most-listened',
      providesTags: ['Playlists'],
    }),
    getNewReleases: build.query({
      query: () => 'albums/new-releases',
      providesTags: ['Playlists'],
    }),
  }),
});


export const {
  useGetUserQuery,
  useGetCategoriesQuery,
  useGetPlaylistByIdQuery,
  useGetSongsQuery,
  useGetSearchResultsQuery,
  useGetRecentlyPlayedQuery,
  useGetMostListenedQuery,
  useGetNewReleasesQuery,
} = api;


