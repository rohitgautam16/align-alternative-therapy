// src/pages/Search.jsx
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { useGetSearchResultsQuery } from '../utils/api';
import PlaylistCard from '../components/custom-ui/PlaylistCard';
import CategoryBanner from '../components/custom-ui/CategoryBanner';
import { Play } from 'lucide-react';

const FALLBACK_SONG =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

const TABS = ['All', 'Songs', 'Playlists', 'Categories'];

export default function Search() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchParams] = useSearchParams();
  const term = searchParams.get('q')?.trim() || '';
  const debouncedTerm = useDebounce(term, 300);

  const {
    data: raw = { songs: [], playlists: [], categories: [] },
    isLoading,
    isError,
  } = useGetSearchResultsQuery(debouncedTerm, {
    skip: debouncedTerm.length < 1,
  });

  const { songs, playlists, categories } = raw;

  if (isLoading) {
    return <p className="text-center py-8">Searching “{debouncedTerm}”…</p>;
  }
  if (isError) {
    return (
      <p className="text-center py-8 text-red-500">
        Error searching for "{debouncedTerm}"
      </p>
    );
  }

  
  const showSection = (section) =>
    activeTab === 'All' || activeTab === section;

  return (
    <div className="space-y-6 p-6">
      {/* <h1 className="text-xl text-gray-400">
        Results for “{debouncedTerm}”
      </h1> */}

      {/* Tab bar */}
      <div className="flex space-x-4 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 ${
              activeTab === tab
                ? 'text-white border border-gray-400 cursor-pointer py-2 px-4 bg-red-700 rounded-full'
                : 'text-gray border border-gray-400 cursor-pointer py-2 px-4 rounded-full hover:text-white'
            } transition`}
          >
            {tab}
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
                className="flex items-center gap-4 text-white p-4 hover:bg-red-700/30 rounded-lg transition cursor-pointer"
                onClick={() => {
                  
                }}
              >
                <span className="text-gray-400 w-6">{idx + 1}</span>
                <img
                  src={song.artworkFilename || FALLBACK_SONG}
                  alt={song.title}
                  className="w-16 h-16 rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold">{song.title}</p>
                  <p className="text-gray-400 text-sm">{song.artist}</p>
                </div>
                <button
                  className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-black hover:bg-red-600 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    
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
          <div className="flex space-x-4 overflow-x-auto pb-2 snap-x">
            {playlists.map((pl) => (
              <div key={pl.id} className="snap-start">
                <PlaylistCard playlist={pl} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories Section */}
      {showSection('Categories') && categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Categories</h2>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <CategoryBanner key={cat.id} category={cat} />
            ))}
          </div>
        </section>
      )}

      {/* No results */}
      {debouncedTerm &&
        songs.length === 0 &&
        playlists.length === 0 &&
        categories.length === 0 && (
          <p className="text-center text-gray-500">
            No results found for "{debouncedTerm}".
          </p>
        )}
    </div>
  );
}
