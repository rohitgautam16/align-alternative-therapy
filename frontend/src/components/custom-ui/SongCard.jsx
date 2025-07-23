// src/components/custom-ui/SongCard.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setQueue, setTrack, setIsPlaying } from '../../store/playerSlice';
import { Play, Lock } from 'lucide-react';
import LockedOverlay from '../dashboard/LockedOverlay';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { useGetDashboardAllPlaylistsQuery } from '../../utils/api';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function SongCard({ song }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useAuthUser();
  const isSubscriber = Number(user?.is_subscribed) === 1;

  // Grab all playlists once
  const { data: allPLs = [], isLoading: plsLoading } = useGetDashboardAllPlaylistsQuery();

  // Memoize a map id → paid
  const paidMap = useMemo(() => {
    const m = {};
    allPLs.forEach(pl => {
      m[pl.id] = pl.paid === 1;
    });
    return m;
  }, [allPLs]);

  // Determine locked state
  const isPaidParent = paidMap[song.playlistId];
  const locked = !plsLoading && isPaidParent && !isSubscriber;

  const handlePlay = e => {
    e.stopPropagation();
    if (locked) return;
    dispatch(setQueue([song]));
    dispatch(setTrack({
      id:       song.id,
      title:    song.title,
      artist:   song.artist,
      image:    song.image || FALLBACK_IMAGE,
      audioUrl: song.audioUrl,
    }));
    dispatch(setIsPlaying(true));
  };

  const handleCardClick = () => {
    if (locked) return;
    navigate(`/dashboard/song/${song.id}`);
  };

  return (
    <div className="flex flex-col items-start">
      <div
        className="relative group/item w-64 h-64 overflow-hidden rounded-lg cursor-pointer
                   transform transition-all duration-500 hover:scale-100"
        onClick={handleCardClick}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleCardClick()}
      >
        <img
          src={song.image || FALLBACK_IMAGE}
          alt={song.title}
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover/item:scale-115"
        />

        {locked && <LockedOverlay />}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent
                        opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />

        <button
          onClick={handlePlay}
          disabled={locked}
          className="absolute bottom-4 right-4 w-12 h-12 bg-red-500 rounded-full flex 
                     items-center justify-center opacity-0 group-hover/item:opacity-100 
                     transform group-hover/item:translate-y-0 translate-y-4 transition-all
                     duration-300 hover:bg-red-600 hover:scale-110 disabled:bg-transparent disabled:cursor-not-allowed"
        >
          {locked
            ? <Lock className="w-6 h-6 text-gray-300" />
            : <Play className="w-6 h-6 text-black" />
          }
        </button>

        <h3 className="absolute bottom-4 left-4 text-white font-semibold text-base 
                     truncate max-w-[calc(100%-4rem)]">
          {song.title}
        </h3>
      </div>
    </div>
  );
}
