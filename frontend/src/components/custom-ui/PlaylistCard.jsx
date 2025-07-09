// src/components/ui/PlaylistCard.jsx
import React from 'react';
import LockedOverlay from '../dashboard/LockedOverlay';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setQueue, setTrack, setIsPlaying, togglePlay } from '../../store/playerSlice';
import { Play, Lock } from 'lucide-react';
import { X } from 'lucide-react';
import {
  useGetCategoriesQuery,
  useGetPlaylistByIdQuery,
  useGetSongsQuery,
  useGetUserQuery,
} from '../../utils/api';

import useAuthUser from 'react-auth-kit/hooks/useAuthUser';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function PlaylistCard({ playlist }) {

  const user = useAuthUser();


// lock if they are not subscribed AND this playlist isn’t free
   const isSubscriber = Number(user?.is_subscribed) === 1;
  const locked = !isSubscriber;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: songs = [], isLoading: songsLoading, isError: songsError } = useGetSongsQuery(playlist?.id);

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

    const handlePlaySong = (song) => {
    
    dispatch(setQueue(songs));
  
    
    dispatch(setTrack({
      id:       song.id,
      title:    song.name || song.title,
      artist:   song.artistName,
      image:    song.image || FALLBACK_BG,
      audioUrl: song.audioUrl,
      audio_src: song.audio_src
    }));
  
    
    dispatch(setIsPlaying(true));
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

      {/* Play/Lock button */}
      <button
        onClick={() => handlePlaySong(songs[0], 0)}
        disabled={locked}
        className="absolute bottom-4 right-4 w-12 h-12 bg-red-500 rounded-full flex 
                   items-center justify-center transform translate-y-4 opacity-0 
                   group-hover/item:translate-y-0 group-hover/item:opacity-100
                   transition-all duration-300 hover:bg-red-600 hover:scale-110
                   disabled:bg-transparent disabled:cursor-not-allowed"
      >
        {locked ? (
          <Lock className="w-6 h-6 text-gray-300" />
        ) : (
          <Play className="w-6 h-6 text-gray-800" />
        )}
      </button>

      {/* Playlist title inside the card */}
      <h3 className="absolute bottom-4 left-4 text-white font-semibold text-base 
                     truncate max-w-[calc(100%-4rem)]">
        {playlist.name}
      </h3>
    </div>
  </div>
);
}
