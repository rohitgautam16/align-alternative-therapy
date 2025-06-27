// src/pages/CategoryView.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetCategoriesQuery, useGetPlaylistByIdQuery } from '../utils/api';
import PlaylistCard from '../components/custom-ui/PlaylistCard';

const FALLBACK_BG =
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&h=900&fit=crop';

export default function CategoryView() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const {
    data: categories = [],
    isLoading: catLoading,
    isError: catError,
  } = useGetCategoriesQuery();

  const {
    data: playlists = [],
    isLoading: plLoading,
    isError: plError,
  } = useGetPlaylistByIdQuery();


  const loading = catLoading || plLoading;


  const category = !catLoading && categories.find((c) => c.slug === slug);


  const categoryPlaylists = !loading
    ? playlists.filter((pl) => pl.categoryId === category?.id)
    : [];


  if (catError || plError) {
    return (
      <p className="text-red-500 text-center py-20">
        Error loading data.
      </p>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{
        background: loading
          ? 'black'
          : `linear-gradient(to bottom, rgba(0,0,0,0.4), black), url(${
              category?.image || FALLBACK_BG
            })`,
        backgroundSize: 'cover',
      }}
    >
      {/* Overlay */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black" /> */}

    
      <div className="relative z-10 p-8 space-y-6">
        {/* Back button skeleton */}
        {loading ? (
          <div className="w-20 h-6 bg-gray-700 rounded animate-pulse" />
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white flex items-center gap-2"
          >
            ← Back
          </button>
        )}

        
        <div className="space-y-8 flex flex-col items-center p-20">
          {loading ? (
            <>
              <div className="w-48 h-10 bg-gray-700 rounded animate-pulse" />
              <div className="w-96 h-4 bg-gray-700 rounded animate-pulse" />
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {category.title}
              </h1>
              <p className="max-w-2xl text-gray-300">
                {category.description ||
                  'No description available for this category.'}
              </p>
            </>
          )}
        </div>

        {/* Playlists grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-48 bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : categoryPlaylists.length === 0 ? (
          <p className="text-white text-center py-10">
            No playlists found in “{category.name}.”
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categoryPlaylists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
