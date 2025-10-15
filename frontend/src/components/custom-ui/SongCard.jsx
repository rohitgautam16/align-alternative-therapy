import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setQueue, setTrack, setIsPlaying } from '../../store/playerSlice';
import { Play, Lock } from 'lucide-react';
import { useGetDashboardAllPlaylistsQuery } from '../../utils/api';
import { useSubscription } from '../../context/SubscriptionContext';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function SongCard({ song }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const slug = song?.slug ?? song?.song_slug ?? null;
  const { baseEntitled } = useSubscription();

  const { data: allPLs = [], isLoading: plsLoading } = useGetDashboardAllPlaylistsQuery();

  const paidMap = React.useMemo(() => {
    const m = {};
    for (const pl of allPLs) if (pl?.id) m[pl.id] = pl.paid === 1;
    return m;
  }, [allPLs]);

  const parentId = song?.playlistId ?? song?.playlist_id;
  const isPaidParent = parentId ? Boolean(paidMap[parentId]) : false;
  const requiresBase = parentId ? isPaidParent : true;

  const locked = !plsLoading && requiresBase && !baseEntitled;

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
    if (!slug) return;
    navigate(`/dashboard/song/${slug}`);
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

        {/* --- LOCKED STATE OVERLAY --- */}
        {locked && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center px-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/pricing');
              }}
              className="flex items-center gap-2 bg-transparent backdrop-blur-lg border border-white hover:bg-secondary hover:border-secondary 
                        text-white text-xs font-medium px-5 py-2.5 rounded-full cursor-pointer
                        transition-all shadow-md"
            >
              <Lock className="w-3 h-3 text-white" />
              <span>Subscribe to Unlock</span>
            </button>
          </div>
        )}

        {/* Gradient overlay on hover (only when unlocked) */}
        {!locked && (
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent
                       opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"
          />
        )}

        {/* Play button (only when unlocked) */}
        {!locked && (
          <button
            onClick={handlePlay}
            className="absolute bottom-4 right-4 w-12 h-12 bg-secondary rounded-full flex 
                       items-center justify-center transform translate-y-4 opacity-0 
                       group-hover/item:translate-y-0 group-hover/item:opacity-100 cursor-pointer
                       transition-all duration-300 hover:bg-secondary/70 hover:scale-110"
          >
            <Play className="w-6 h-6 text-gray-800" />
          </button>
        )}

        <h3
          className={`absolute bottom-4 left-4 text-white font-semibold text-base 
                      truncate max-w-[calc(100%-4rem)] ${locked ? 'opacity-80' : ''}`}
          title={song?.title}
        >
          {song?.name || song?.title}
        </h3>
      </div>
    </div>
  );
}
