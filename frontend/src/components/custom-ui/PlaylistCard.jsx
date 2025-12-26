import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Play, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setQueue, setTrack, setIsPlaying } from '../../store/playerSlice';
import { useGetSongsQuery, useRecordPlayMutation  } from '../../utils/api';
import { useSubscription } from '../../context/SubscriptionContext';
import { canAccessContent } from '../../utils/permissions';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function PlaylistCard({ playlist, isLockedOverlay = false, disableTierCheck = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userTier, loading } = useSubscription();
  const { data: songs = [] } = useGetSongsQuery(playlist.id);
  const firstSong = songs?.[0];

  const locked = disableTierCheck
  ? false
  : loading
    ? false            
    : !canAccessContent(userTier, playlist);


  const [recordPlay] = useRecordPlayMutation();

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const lastRecordedRef = useRef({ songId: null, ts: 0 });

  const handlePlaySong = async (e, song) => {
    e.stopPropagation();

    if (locked || isLockedOverlay) {
      setPopupMessage(
        'This content is not included in your plan. Subscribe to a premium plan.'
      );
      setShowPopup(true);
      return;
    }

    dispatch(setQueue(songs));
    dispatch(
      setTrack({
        id: song.id,
        title: song.name || song.title,
        artist: song.artistName,
        image: song.image || FALLBACK_IMAGE,
        audioUrl: song.audioUrl,
        description: song.description,
      })
    );
    dispatch(setIsPlaying(true));

    const now = Date.now();
    if (lastRecordedRef.current.songId === song.id && (now - lastRecordedRef.current.ts) < RECORD_DEBOUNCE_MS) {
      return;
    }
    lastRecordedRef.current = { songId: song.id, ts: now };

    try {
      await recordPlay({ songId: song.id, sourcePlaylistId: playlist?.id ?? null }).unwrap();
    } catch (err) {
      console.error('recordPlay failed from PlaylistCard', err);
    }
  };


  const handleCardClick = () => {
    if (locked || isLockedOverlay) {
      const msg = isLockedOverlay
        ? 'This content is not included in your plan. Subscribe to a premium plan.'
        : 'This playlist is available only for premium subscribers.';
      setPopupMessage(msg);
      setShowPopup(true);
      return;
    }

    navigate(
      playlist.slug
        ? `/dashboard/playlist/${playlist.slug}`
        : `/dashboard/user-playlist/${playlist.id}`
    );
  };

  const handleLockClick = (e) => {
    e.stopPropagation();
    setPopupMessage('This playlist is available only for premium subscribers.');
    setShowPopup(true);
  };

  return (
    <div className="flex flex-col items-start relative">
      {/* Main card */}
      <div
        className={`relative group/item w-65 aspect-square shrink-0 overflow-hidden rounded-lg
                   cursor-pointer transform transition-all duration-500 hover:scale-100`}
        onClick={handleCardClick}
        tabIndex={0}
      >
        <img
          src={playlist.image || FALLBACK_IMAGE}
          alt={playlist.name || 'Playlist'}
          className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-115"
          onError={(e) => (e.target.src = FALLBACK_IMAGE)}
        />

        {/* Locked overlay - only icon */}
        {locked && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <button
              onClick={handleLockClick}
              className="p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 cursor-pointer transition"
            >
              <Lock className="w-8 h-8 text-white" />
            </button>
          </div>
        )}

        {/* Extra overlay lock (for category view / limited access) */}
        {isLockedOverlay && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none">
            <button
              className="p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
            >
              <Lock className="w-8 h-8 text-white" />
            </button>
          </div>
        )}

        {/* Gradient + Play button if unlocked */}
        {!locked && !isLockedOverlay && (
          <>
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-transparent
                            opacity-0 group-hover/item:opacity-100 transition-all duration-300" />
            <button
              onClick={(e) => handlePlaySong(e, firstSong)}
              className="absolute bottom-4 right-4 w-12 h-12 bg-secondary rounded-full flex 
                         items-center justify-center transform translate-y-4 opacity-0 
                         group-hover/item:translate-y-0 group-hover/item:opacity-100 cursor-pointer
                         transition-all duration-300 hover:bg-secondary/70 hover:scale-110"
            >
              <Play className="w-6 h-6 text-gray-800" />
            </button>
          </>
        )}

        <h3 className="absolute bottom-4 left-4 text-white font-semibold text-base truncate max-w-[calc(100%-4rem)]">
          {playlist.name || playlist.title}
        </h3>
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 12 }}
              className="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 w-[90%] max-w-md text-center shadow-md"
            >
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-3 right-3 cursor-pointer text-white hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex flex-col items-center">
                <Lock className="w-10 h-10 text-secondary mb-3" />
                <p className="text-white text-lg font-medium mb-5">{popupMessage}</p>
                <button
                  onClick={() => {
                    setShowPopup(false);
                    navigate('/pricing');
                  }}
                  className="bg-secondary text-gray-900 px-5 py-2.5 cursor-pointer rounded-full hover:bg-secondary/80 transition"
                >
                  View Plans
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
