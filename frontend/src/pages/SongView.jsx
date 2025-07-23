// src/pages/SongView.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Share2, ArrowLeft, ArrowRight, X, Clock } from 'lucide-react';
import {
  FaTwitter,
  FaFacebookF,
  FaLinkedinIn,
  FaPinterestP,
  FaTelegramPlane,
} from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { useGetSongByIdQuery, useRecordPlayMutation } from '../utils/api';
import { setQueue, setTrack, setIsPlaying } from '../store/playerSlice';
import { AnimatePresence, motion } from 'framer-motion';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';
const FALLBACK_DESC = 'No description available for this track.';

export default function SongView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showShare, setShowShare] = useState(false);

  const { data: song, isLoading, isError } = useGetSongByIdQuery(id);
  const [recordPlay] = useRecordPlayMutation();

  const handlePlay = () => {
    dispatch(setQueue([song]));
    dispatch(setTrack({
      id:        song.id,
      title:     song.title || song.name,
      artist:    song.artist,
      image:     song.image || FALLBACK_IMG,
      audioUrl:  song.audioUrl,
    }));
    dispatch(setIsPlaying(true));
    recordPlay(song.id);
  };

  if (isLoading) {
    return <div className="text-white text-center py-20">Loading song…</div>;
  }

  if (isError || !song) {
    return <div className="text-red-500 text-center py-20">Error loading song.</div>;
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: `linear-gradient(to bottom, rgba(0,0,0,0.7), black), url(${song.image || FALLBACK_IMG})`,
        backgroundSize: 'cover',
      }}
    >
      {/* Top nav */}
      <div className="flex justify-between px-8 py-4">
        <button onClick={() => navigate(-1)} className="text-gray-300 hover:text-white flex items-center gap-2">
          <ArrowLeft /> Back
        </button>
        <button onClick={() => navigate('/dashboard')} className="text-gray-300 hover:text-white flex items-center gap-2">
          <ArrowRight /> All Songs
        </button>
      </div>

      {/* Header */}
      <div className="p-8 flex items-end gap-6">
        <img
          src={song.image || FALLBACK_IMG}
          alt={song.title}
          className="w-48 h-48 rounded-lg object-cover shadow-lg"
        />
        <div>
          <p className="text-sm uppercase font-semibold">Track</p>
          <h1 className="text-5xl font-semibold">{song.name || song.title}</h1>
          <p className="mt-2 text-gray-400">{song.artist}</p>
          <p className="mt-4 max-w-lg text-gray-300">{song.tags || FALLBACK_DESC}</p>
          <p className="mt-2 text-sm text-gray-400">
            • Released: {new Date(song.createdAt).toLocaleDateString()} • {song.category || 'Uncategorized'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 px-8">
        <button
          onClick={handlePlay}
          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition"
        >
          <Play className="w-8 h-8 text-black" />
        </button>

        <button
          onClick={() => setShowShare(true)}
          className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center hover:bg-white/40 transition"
        >
          <Share2 className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Song table */}
      <div className="px-8 pb-12">
        <div className="grid grid-cols-[50px_1fr_1fr_50px] items-center text-gray-400 text-sm border-b border-gray-700 pb-2 mb-4">
          <span>#</span>
          <span>Title</span>
          <span>Category</span>
          <Clock />
        </div>

        <div
          className="grid grid-cols-[50px_1fr_1fr_50px] items-center text-white py-3 hover:bg-red-700/30 rounded-lg px-2 cursor-pointer transition"
          onClick={handlePlay}
        >
          <span className="text-gray-400">1</span>

          <div className="flex items-center gap-4">
            <img
              src={song.image || FALLBACK_IMG}
              alt={song.title || song.name}
              className="w-12 h-12 rounded-md object-cover"
            />
            <div>
              <p className="font-semibold">{song.name || song.title}</p>
              <p className="text-gray-400 text-sm">{song.artist}</p>
            </div>
          </div>

          <span className="text-gray-400">{song.category || '—'}</span>

          <span className="text-gray-400">—:—</span> {/* Optional duration */}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShare(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-60 p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div
                className="bg-gray-900 p-6 rounded-lg space-y-4 max-w-sm w-full relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowShare(false)}
                  className="absolute top-3 right-3 p-1 hover:bg-red-800 rounded transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
                <h2 className="text-white text-xl font-semibold">Share Track</h2>
                <p className="text-gray-300 mb-2">Share via</p>
                <div className="flex space-x-3 mb-4">
                  {[FaTwitter, FaFacebookF, FaLinkedinIn, FaPinterestP, FaTelegramPlane].map((Icon, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        window.open(
                          `${Icon === FaTelegramPlane
                            ? 'https://t.me/share/url'
                            : Icon === FaTwitter
                              ? 'https://twitter.com/intent/tweet'
                              : Icon === FaFacebookF
                                ? 'https://www.facebook.com/sharer/sharer.php'
                                : 'https://www.linkedin.com/shareArticle'
                          }?url=${encodeURIComponent(window.location.href)}`
                        )
                      }
                      className="p-2 bg-white/30 rounded-full hover:bg-white/70 transition"
                    >
                      <Icon className="w-6 h-6 text-white hover:text-red-700 transition-colors" />
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-gray-300 mb-2">Copy direct link</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="flex items-center justify-center w-full py-2 bg-white/30 hover:bg-red-700 text-gray-200 rounded transition"
                  >
                    <FaTelegramPlane className="w-5 h-5 mr-2" /> Copy link
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
