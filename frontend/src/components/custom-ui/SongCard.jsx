// src/components/custom-ui/SongCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setQueue, setTrack, setIsPlaying } from '../../store/playerSlice';
import { Play, Lock } from 'lucide-react';
import LockedOverlay from '../dashboard/LockedOverlay';
import { useGetDashboardAllPlaylistsQuery } from '../../utils/api';
import { useSubscription } from '../../context/SubscriptionContext';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function SongCard({ song }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Use latest entitlement flags
  const { baseEntitled } = useSubscription();

  // Fetch all playlists once (RTK caches)
  const { data: allPLs = [], isLoading: plsLoading } = useGetDashboardAllPlaylistsQuery();

  // Map: playlistId -> paid?
  const paidMap = React.useMemo(() => {
    const m = {};
    for (const pl of allPLs) if (pl?.id) m[pl.id] = pl.paid === 1;
    return m;
  }, [allPLs]);

  // Support both camelCase and snake_case
  const parentId = song?.playlistId ?? song?.playlist_id;

  // If a parent playlist exists, use its paid flag. If not, require base subscription.
  const isPaidParent = parentId ? Boolean(paidMap[parentId]) : false;
  const requiresBase = parentId ? isPaidParent : true;

  // Lock when content requires base and user lacks base entitlement
  const locked = !plsLoading && requiresBase && !baseEntitled;

  // Robust image fallback
  const [imgSrc, setImgSrc] = React.useState(song?.image || FALLBACK_IMAGE);
  const onImgError = React.useCallback(() => {
    if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE);
  }, [imgSrc]);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (locked) return;
    dispatch(setQueue([song]));
    dispatch(
      setTrack({
        id: song.id,
        title: song.title,
        artist: song.artist || song.artistName,
        image: imgSrc || FALLBACK_IMAGE,
        audioUrl: song.audioUrl,
      })
    );
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
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      >
        <img
          src={imgSrc}
          onError={onImgError}
          alt={song?.title || 'Song'}
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover/item:scale-115"
          loading="lazy"
          decoding="async"
        />

        {locked && <LockedOverlay />}

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent
                     opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"
        />

        <button
          onClick={handlePlay}
          disabled={locked}
          className="absolute bottom-4 right-4 w-12 h-12 bg-secondary rounded-full flex 
                     items-center justify-center opacity-0 group-hover/item:opacity-100 
                     transform group-hover/item:translate-y-0 translate-y-4 transition-all
                     duration-300 hover:bg-secondary/70 hover:scale-110 disabled:bg-transparent disabled:cursor-not-allowed"
        >
          {locked ? (
            <Lock className="w-6 h-6 text-gray-300" />
          ) : (
            <Play className="w-6 h-6 text-black" />
          )}
        </button>

        <h3
          className="absolute bottom-4 left-4 text-white font-semibold text-base 
                     truncate max-w-[calc(100%-4rem)]"
          title={song?.title}
        >
          {song?.title}
        </h3>
      </div>
    </div>
  );
}
