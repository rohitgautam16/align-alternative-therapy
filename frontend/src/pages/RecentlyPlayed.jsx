// src/components/RecentlyPlayed.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetRecentPlaysQuery, useGetRecentPlaylistsQuery } from '../utils/api';
import SongCard from '../components/custom-ui/SongCard';
import PlaylistCard from '../components/custom-ui/PlaylistCard';

const panelVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function RecentlyPlayed() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // fetch data
  const { data: recentRaw, isLoading: songsLoading, isError: songsError } = useGetRecentPlaysQuery(10);
  const { data: recentPlaylistsRaw, isLoading: plsLoading, isError: plsError } = useGetRecentPlaylistsQuery(8);

  // normalize shapes
  const recentSongs = useMemo(() => (Array.isArray(recentRaw) ? recentRaw : (recentRaw?.items ?? [])), [recentRaw]);
  const recentPlaylists = useMemo(() => (Array.isArray(recentPlaylistsRaw) ? recentPlaylistsRaw : (recentPlaylistsRaw?.items ?? [])), [recentPlaylistsRaw]);

  // tab state: 'songs' | 'playlists'
  const [tab, setTab] = useState('songs');

  // counts
  const songsCount = recentSongs.length;
  const plsCount = recentPlaylists.length;

  const anyLoading = songsLoading || plsLoading;

  return (
    <section className="w-full min-h-screen px-4 py-12 bg-gradient-to-b from-black to-gray-900 rounded-lg">
      <header className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-white mb-2">Recently Played</h2>
        <p className="text-center text-gray-400 mb-6">Catch up with the tracks and playlists you’ve enjoyed most recently.</p>

        {/* Outline tab buttons (not a toggle) */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex space-x-3">
            <button
              type="button"
              onClick={() => setTab('songs')}
              aria-pressed={tab === 'songs'}
              className={`px-5 py-2 rounded-full text-sm cursor-pointer font-medium transition border ${
                tab === 'songs'
                  ? 'bg-secondary text-black'
                  : 'text-gray-300 border-gray-700 hover:border-gray-500'
              }`}
            >
              Songs <span className="ml-2 text-xs text-gray-300">({songsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('playlists')}
              aria-pressed={tab === 'playlists'}
              className={`px-5 py-2 rounded-full text-sm cursor-pointer font-medium transition border ${
                tab === 'playlists'
                  ? 'bg-secondary text-black'
                  : 'text-gray-300 border-gray-700 hover:border-gray-500'
              }`}
            >
              Playlists <span className="ml-2 text-xs text-gray-300">({plsCount})</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait" initial={false}>
          {tab === 'songs' ? (
            <motion.div
              key="songs"
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18 }}
            >
              {songsLoading ? (
                <div className="text-center py-12 text-gray-400">Loading your recent songs…</div>
              ) : songsError ? (
                <div className="text-center py-12 text-red-500">Couldn’t load recent songs.</div>
              ) : recentSongs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 italic">You haven’t played anything yet.</div>
              ) : (
                <div className="flex flex-wrap gap-6 justify-center sm:justify-center md:justify-center lg:justify-start">
                  {recentSongs.map((song) => {
                    const slug = song?.slug ?? song?.song_slug ?? null;
                    const key = slug ? `${song.id}-${slug}` : `id-${song.id}`;
                    // If the song has an intrinsic playlist id, pass minimal playlist object so SongCard can use it
                    const songPlaylist = song.playlist ?? song.playlist_id ?? null;
                    return (
                      <div key={key} className="flex-none">
                        <SongCard song={song} playlist={songPlaylist ? { id: songPlaylist } : undefined} />
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="playlists"
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18 }}
            >
              {plsLoading ? (
                <div className="text-center py-12 text-gray-400">Loading your recent playlists…</div>
              ) : plsError ? (
                <div className="text-center py-12 text-red-500">Couldn’t load recent playlists.</div>
              ) : recentPlaylists.length === 0 ? (
                <div className="text-center py-12 text-gray-500 italic">You haven’t listened to any playlists yet.</div>
              ) : (
                <div className="flex flex-wrap gap-6 justify-center sm:justify-center md:justify-center lg:justify-start">
                  {recentPlaylists.map(pl => (
                    <motion.div
                      key={`pl-${pl.id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="cursor-pointer"
                    >
                      <PlaylistCard playlist={pl} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {anyLoading && (
          <div className="text-center mt-6 text-gray-500">Loading…</div>
        )}
      </main>
    </section>
  );
}
