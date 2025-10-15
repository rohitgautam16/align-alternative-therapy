// src/pages/CategoryView.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetCategoriesQuery, useGetDashboardAllPlaylistsQuery } from '../utils/api';
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
  } = useGetDashboardAllPlaylistsQuery();

  const loading  = catLoading || plLoading;
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

const bgImage = category?.image
  ? category.image.startsWith('http')
    ? category.image.includes('%20')
      ? category.image // already encoded → leave as-is
      : category.image.replace(/ /g, '%20') // encode only spaces
    : `https://cdn.align-alternativetherapy.com/align-images/categories/${encodeURIComponent(category.image)}`
  : category?.artwork_filename
  ? `https://cdn.align-alternativetherapy.com/align-images/categories/${encodeURIComponent(category.artwork_filename)}`
  : FALLBACK_BG;


const bgUrl = bgImage
  ? `linear-gradient(to bottom, rgba(0,0,0,0.4), black), url(${bgImage})`
  : 'transparent';

console.log(category.image, category.artwork_filename);

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ background: bgUrl, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Page content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        {/* Back button / skeleton */}
        {loading ? (
          <div className="w-20 h-6 bg-gray-700/60 rounded animate-pulse" />
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white flex items-center gap-2"
          >
            ← Back
          </button>
        )}

        {/* Title + Description block */}
        <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col items-center text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-48 h-10 bg-gray-700/60 rounded animate-pulse" />
              <div className="w-80 sm:w-96 h-4 bg-gray-700/60 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                {category?.title}
              </h1>
              <p className="max-w-2xl mt-3 sm:mt-4 text-sm sm:text-base text-gray-300">
                {category?.description || 'No description available for this category.'}
              </p>
            </>
          )}
        </div>

        {/* Playlists list */}
        <div className="mt-10 sm:mt-12">
          {loading ? (
            // Skeletons aligned to the same layout (flex wrap, fixed-size items)
            <div className="flex flex-wrap gap-6 justify-center sm:justify-center md:justify-center lg:justify-start">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-none">
                  {/* Match approximate card footprint (square, fixed width) */}
                  <div className="w-[17rem] h-[17rem] bg-gray-700/60 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          ) : categoryPlaylists.length === 0 ? (
            <p className="text-white text-center py-10">
              No playlists found in {category?.title}.
            </p>
          ) : (
            /**
             * IMPORTANT LAYOUT NOTE:
             * - We use flex-wrap + flex-none wrappers so each PlaylistCard preserves its fixed width (w-65) and aspect-square.
             * - This prevents column shrink/overlap at any viewport.
             * - On mobile we center; from sm+ we left-align for a denser look.
             */
            <div className="flex flex-wrap gap-6 justify-center sm:justify-center md:justify-center lg:justify-start items-start">
              {categoryPlaylists.map((pl) => (
                <div key={pl.id} className="flex-none">
                  <PlaylistCard playlist={pl} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
