// src/pages/Search.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { useGetSearchResultsQuery } from '../utils/api';
import PlaylistCard from '../components/custom-ui/PlaylistCard';
import CategoryBanner from '../components/custom-ui/CategoryBanner';
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
      audioUrl: song.audioUrl || song.cdn_url, // Using cdn_url as fallback
    }));
    dispatch(setIsPlaying(true));
  };

  // Loading state
  if (isLoading && debouncedTerm) {
    return (
      <div className="flex items-center justify-center py-12">
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
    <div className="space-y-6 p-6">
      {/* Search Term Display */}
      {debouncedTerm && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Search results for "{debouncedTerm}"</h1>
          {data.total > 0 && <p className="text-gray-400">Found {data.total} results</p>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 py-2 rounded-full border transition whitespace-nowrap ${
              activeTab === tab
                ? 'text-white border-gray-400 bg-red-700'
                : 'text-gray-400 border-gray-400 hover:text-white hover:border-white'
            }`}
          >
            {tab}
            {/* Show counts */}
            {tab === 'Songs' && songs.length > 0 && ` (${songs.length})`}
            {tab === 'Playlists' && playlists.length > 0 && ` (${playlists.length})`}
            {tab === 'Categories' && categories.length > 0 && ` (${categories.length})`}
          </button>
        ))}
      </div>

      {/* Songs Section */}
      {showSection('Songs') && songs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Songs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {songs.map((song, idx) => (
              <div
                key={song.id}
                className="flex items-center gap-4 text-white p-4 hover:bg-red-700/30 rounded-lg cursor-pointer transition"
                onClick={() => navigate(`/dashboard/song/${song.slug}`)}
              >
                <span className="text-gray-400 w-6">{idx + 1}</span>
                <img
                  src={song.image || song.artwork_filename || FALLBACK_IMAGE}
                  alt={song.title}
                  className="w-16 h-16 rounded-md object-cover"
                  onError={(e) => {
                    console.log('Song image failed to load:', song.artwork_filename);
                    e.target.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{song.title}</p>
                  <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                  {song.playlistTitle && (
                    <p className="text-gray-500 text-xs truncate">from {song.playlistTitle}</p>
                  )}
                </div>
                <button
                  className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-black hover:bg-red-600 transition flex-shrink-0"
                  onClick={e => { 
                    e.stopPropagation(); 
                    playSong(song); 
                  }}
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Playlists Section */}
      {showSection('Playlists') && playlists.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Playlists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className="cursor-pointer transform hover:scale-105 transition-transform"
                onClick={() => navigate(`/dashboard/playlist/${playlist.slug}`)}
              >
                <PlaylistCard 
                  playlist={{
                    ...playlist,
                    image: playlist.image || playlist.artwork_filename || FALLBACK_IMAGE
                  }} 
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories Section */}
      {showSection('Categories') && categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(category => {
              console.log('Rendering category:', category); // Debug log
              return (
                <CategoryBanner
                  key={category.id}
                  category={category}
                />
              );
            })}
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
