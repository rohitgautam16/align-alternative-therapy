// src/components/ui/PlaylistCard.jsx
import React from 'react';
import LockedOverlay from '../dashboard/LockedOverlay';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setQueue, setTrack, setIsPlaying } from '../../store/playerSlice';
import { Play, Lock } from 'lucide-react';
import { useGetSongsQuery } from '../../utils/api';
import { useSubscription } from '../../context/SubscriptionContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function PlaylistCard({ playlist }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // New entitlement flags from context
  const { baseEntitled } = useSubscription();

  // Paid playlists require BASE entitlement
  const locked = playlist?.paid === 1 && !baseEntitled;

  // You can keep fetching songs even if locked (for card UX), or skip to save calls:
  // const { data: songs = [] } = useGetSongsQuery(playlist.id, { skip: locked });
  const { data: songs = [] } = useGetSongsQuery(playlist.id);

  const handlePlaySong = (e, song) => {
    e.stopPropagation();
    if (locked || !song) return;
    dispatch(setQueue(songs));
    dispatch(setTrack({
      id:       song.id,
      title:    song.name || song.title,
      artist:   song.artistName,
      image:    song.image || FALLBACK_IMAGE,
      audioUrl: song.audioUrl,
    }));
    dispatch(setIsPlaying(true));
  };

  const handleCardClick = () => {
    if (locked) return;
    if (playlist.slug) {
      navigate(`/dashboard/playlist/${playlist.slug}`);
    } else {
      navigate(`/dashboard/user-playlist/${playlist.id}`);
    }
  };

  const firstSong = songs?.[0];

  return (
    <div className="flex flex-col items-start">
      <div
        className="relative group/item w-65 aspect-square flex-shrink-0 overflow-hidden rounded-lg
                   cursor-pointer transform transition-all duration-500 hover:scale-100"
        onClick={handleCardClick}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
      >
        {/* Cover Image */}
        <img
          src={playlist.image || FALLBACK_IMAGE}
          alt={playlist.name || playlist.title || 'Playlist'}
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
          onClick={(e) => handlePlaySong(e, firstSong)}
          disabled={locked}
          className="absolute bottom-4 right-4 w-12 h-12 bg-secondary rounded-full flex 
                     items-center justify-center transform translate-y-4 opacity-0 
                     group-hover/item:translate-y-0 group-hover/item:opacity-100
                     transition-all duration-300 hover:bg-secondary/70 hover:scale-110
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
          {playlist.name || playlist.title}
        </h3>
      </div>
    </div>
  );
}
