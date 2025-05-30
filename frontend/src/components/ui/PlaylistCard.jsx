// src/components/ui/PlaylistCard.jsx
import React from 'react';
import { useGetUserQuery } from '../../utils/api';
import LockedOverlay from '../dashboard/LockedOverlay';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setTrack, togglePlay } from '../../store/playerSlice';
import { Play } from 'lucide-react';
import { X } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function PlaylistCard({ playlist }) {
  const { data: user } = useGetUserQuery();
  const locked = user?.subscriptionTier === 'free' && !playlist.isFree;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handlePlay = (e) => {
    e.stopPropagation();
    if (locked) return;
    dispatch(setTrack({
      id: playlist.id,
      title: playlist.name,
      artist: playlist.ownerName,
      image: playlist.image || FALLBACK_IMAGE,
      audioUrl: playlist.previewUrl,
    }));
    dispatch(togglePlay());
  };

  const handleCardClick = () => {
    if (!locked) navigate(`/dashboard/playlist/${playlist.slug}`);
  };

  return (
    <div className="flex flex-col items-start">
      
      <div
        className="relative group/item w-65 h-65 flex-shrink-0 overflow-hidden rounded-lg
                   cursor-pointer transform transition-all duration-500 hover:scale-100"
        onClick={handleCardClick}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
      >
        {/* Cover Image */}
        <img
          src={playlist.image || FALLBACK_IMAGE}
          alt={playlist.name}
          className="w-full h-full object-cover transform transition-transform duration-700
                     group-hover/item:scale-115"
        />

        {/* Locked overlay */}
        {locked && <LockedOverlay />}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent
                        opacity-0 group-hover/item:opacity-100 transition-all duration-300" />

        {/* Play button overlay */}
        <button
          onClick={handlePlay}
          disabled={locked}
          className="absolute bottom-4 right-4 w-12 h-12 bg-red-500 rounded-full flex 
                     items-center justify-center transform translate-y-4 opacity-0 
                     group-hover/item:translate-y-0 group-hover/item:opacity-100
                     transition-all duration-300 hover:bg-red-600 hover:scale-110
                     disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          <Play className="w-6 h-6 text-gray-800" />
        </button>
      </div>

     
      <h3 className="mt-2 text-white font-semibold text-lg truncate w-65">
        {playlist.name}
      </h3>
    </div>
  );
}
