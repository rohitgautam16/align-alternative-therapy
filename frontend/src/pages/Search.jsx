// src/pages/Search.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { useGetSearchResultsQuery } from '../utils/api';
import PlaylistCard from '../components/custom-ui/PlaylistCard';
import CategoryBanner from '../components/custom-ui/CategoryBanner';
import CarouselSection from '../components/dashboard/CarouselSection';
import { Play } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setQueue, setTrack, setIsPlaying } from '../store/playerSlice';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';
const TABS = ['All', 'Songs', 'Playlists', 'Categories'];

export default function Search() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const term = searchParams.get('q')?.trim() || '';
  const debouncedTerm = useDebounce(term, 300);

  const {
    data = { songs: [], playlists: [], categories: [], total: 0 },
    isLoading,
    isError,
    error
  } = useGetSearchResultsQuery(debouncedTerm, { 
    skip: debouncedTerm.length < 1 
  });

  const { songs, playlists, categories } = data;

  const playSong = (song) => {
    if (!song) return;
    dispatch(setQueue([song]));
    dispatch(setTrack({
      id: song.id,
      title: song.title,
      artist: song.artist,
      image: song.image || song.artwork_filename || FALLBACK_IMAGE,
      audioUrl: song.audioUrl || song.cdn_url,
    }));
    dispatch(setIsPlaying(true));
  };

  // Loading state
  if (isLoading && debouncedTerm) {
    return (
      <div className="flex items-center justify-center py-12">
        {/* keeping as-is per your logic; border still red */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-2">Searching "{debouncedTerm}"...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    console.error('Search error:', error);
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error searching for "{debouncedTerm}"</p>
        <p className="text-sm mt-2">{error?.message || 'Please try again'}</p>
      </div>
    );
  }

  const showSection = (section) => activeTab === 'All' || activeTab === section;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Search Term Display */}
      {debouncedTerm && (
        <div className="mb-2 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold break-words">
            Search results for "{debouncedTerm}"
          </h1>
          {data.total > 0 && (
            <p className="text-gray-400 text-sm sm:text-base">
              Found {data.total} results
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto snap-x">
          {TABS.map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "snap-start pb-2 px-4 py-2 rounded-full border transition whitespace-nowrap text-sm sm:text-base",
                  isActive
                    ? "text-white border-gray-400 bg-secondary"
                    : "text-gray-300 border-gray-500 hover:text-white hover:border-white"
                ].join(' ')}
              >
                {tab}
                {tab === 'Songs' && songs.length > 0 && ` (${songs.length})`}
                {tab === 'Playlists' && playlists.length > 0 && ` (${playlists.length})`}
                {tab === 'Categories' && categories.length > 0 && ` (${categories.length})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Songs Section — strip layout; play shows on hover only on desktop */}
      {showSection('Songs') && songs.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-2xl font-semibold">Songs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {songs.map((song, idx) => (
              <div
                key={song.id}
                className="group flex items-center gap-4 text-white p-4 hover:bg-secondary/30 rounded-lg cursor-pointer transition"
                onClick={() => navigate(`/dashboard/song/${song.slug}`)}
              >
                <span className="text-gray-400 w-6 shrink-0">{idx + 1}</span>

                <img
                  src={song.image || song.artwork_filename || FALLBACK_IMAGE}
                  alt={song.title}
                  className="w-16 h-16 rounded-md object-cover shrink-0"
                  onError={(e) => {
                    console.log('Song image failed to load:', song.artwork_filename);
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{song.title}</p>
                  <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                  {song.playlistTitle && (
                    <p className="text-gray-500 text-xs truncate">from {song.playlistTitle}</p>
                  )}
                </div>

                {/* Mobile: visible; Desktop: show on hover */}
                <button
                  className="ms-2 w-9 h-9 bg-secondary rounded-full flex items-center justify-center text-black transition shrink-0
                             md:opacity-0 md:group-hover:opacity-100"
                  onClick={e => { 
                    e.stopPropagation(); 
                    playSong(song); 
                  }}
                  aria-label={`Play ${song.title}`}
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Playlists Section — rendered via CarouselSection like DashboardHome */}
      {showSection('Playlists') && playlists.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-2xl font-semibold">Playlists</h2>

          <CarouselSection
            title=""
            items={playlists}
            renderItem={(pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={{
                  ...pl,
                  image: pl.image || pl.artwork_filename || FALLBACK_IMAGE
                }}
              />
            )}
          />
        </section>
      )}

      {/* Categories Section */}
      {showSection('Categories') && categories.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-2xl font-semibold">Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {categories.map(category => (
              <CategoryBanner
                key={category.id}
                category={category}
              />
            ))}
          </div>
        </section>
      )}

      {/* No Results */}
      {debouncedTerm && data.total === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No results found for "{debouncedTerm}"</p>
          <p className="text-gray-400 mt-2">Try searching for something else</p>
        </div>
      )}

      {/* Empty State */}
      {!debouncedTerm && (
        <div className="text-center py-12">
          <p className="text-gray-500">Start typing to search for songs, playlists, and categories</p>
        </div>
      )}
    </div>
  );
}
