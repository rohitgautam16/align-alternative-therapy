// src/components/custom-ui/SongCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Play, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setQueue, setTrack, setIsPlaying } from '../../store/playerSlice';
import { useSubscription } from '../../context/SubscriptionContext';
import { canAccessContent } from '../../utils/permissions';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function SongCard({ song, playlist }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userTier } = useSubscription();

  const locked = !canAccessContent(userTier, playlist, song);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const handlePlay = (e) => {
    e.stopPropagation();
    if (locked) {
      setPopupMessage(
        'This content is not included in your plan. Subscribe to a premium plan.'
      );
      setShowPopup(true);
      return;
    }

    dispatch(setQueue([song]));
    dispatch(
      setTrack({
        id: song.id,
        title: song.title,
        artist: song.artist || song.artistName,
        image: song.image || FALLBACK_IMAGE,
        audioUrl: song.audioUrl,
        description: song.description,
      })
    );
    dispatch(setIsPlaying(true));
  };

  const handleCardClick = () => {
    if (locked) {
      setPopupMessage('You need to unlock this section to explore more playlists.');
      setShowPopup(true);
      return;
    }
    navigate(`/dashboard/song/${song.slug}`);
  };

  return (
    <div className="flex flex-col items-start relative">
      <div
        className="relative group/item w-64 h-64 overflow-hidden rounded-lg cursor-pointer
                   transition-all duration-500 hover:scale-100"
        onClick={handleCardClick}
        tabIndex={0}
      >
        <img
          src={song.image || FALLBACK_IMAGE}
          alt={song.title || 'Song'}
          className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
          onError={(e) => (e.target.src = FALLBACK_IMAGE)}
        />

        {/* 🔒 LOCK OVERLAY (matches PlaylistCard style) */}
        {locked ? (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]hover:backdrop-blur-[0px] flex items-center justify-center rounded-md">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPopupMessage(
                  'This playlist is available only for premium subscribers.'
                );
                setShowPopup(true);
              }}
              className="p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 cursor-pointer transition"
            >
              <Lock className="w-8 h-8 text-white" />
            </button>
          </div>
        ) : (
          <>
            {/* PLAY BUTTON */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent
                         opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"
            />
            <button
              onClick={handlePlay}
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
          {song.name || song.title}
        </h3>
      </div>

      {/* ✨ LOCK POPUP (identical to previous implementation) */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative bg-white/10 backdrop-blur-xl border border-white/20 
                         p-6 rounded-2xl shadow-md text-center max-w-md w-[90%] 
                         text-white flex flex-col items-center space-y-4"
            >
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-3 right-3 text-white/70 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <Lock className="w-10 h-10 text-secondary mb-3" />
              <p className="text-white text-lg font-medium mb-5">{popupMessage}</p>

              <button
                onClick={() => navigate('/pricing')}
                className="bg-secondary text-gray-900 px-5 py-2.5 cursor-pointer rounded-full hover:bg-secondary/80 transition"
              >
                View Plans
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
