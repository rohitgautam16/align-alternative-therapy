import React, { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../../context/SubscriptionContext';
import { canAccessContent } from '../../utils/permissions';

const FALLBACK_IMAGE =
  'https://cdn.align-alternativetherapy.com/static-pages-media/Align-fallback-img.png';

const ITEMS_PER_PAGE = 6;
const LOCKED_PLAYLIST_MESSAGE = 'This playlist is available only for premium subscribers.';
const LOCKED_CONTENT_MESSAGE =
  'This content is not included in your plan. Subscribe to a premium plan.';

/* ---------------- Skeleton ---------------- */

function StripSkeleton() {
  return (
    <div className="flex items-center gap-4 p-2 animate-pulse">
      <div className="w-14 h-14 bg-white/20 rounded-md shrink-0" />
      <div className="flex-1">
        <div className="h-4 w-40 bg-white/20 rounded mb-2" />
        <div className="h-3 w-28 bg-white/15 rounded mb-1" />
        <div className="h-3 w-20 bg-white/10 rounded" />
      </div>
    </div>
  );
}

/* ---------------- Component ---------------- */

export default function VerticalStripCarousel({
  title,
  items = [],
  isLoading = false,
  disableTierCheck = false
}) {
  const [page, setPage] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const navigate = useNavigate();
  const { userTier, loading: subscriptionLoading } = useSubscription();

  /* Reset page when items change (important on tag change) */
  useEffect(() => {
    setPage(0);
  }, [items]);

  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
      chunks.push(items.slice(i, i + ITEMS_PER_PAGE));
    }
    return chunks;
  }, [items]);

  const totalPages = pages.length;

  const canScrollLeft = page > 0;
  const canScrollRight = page < totalPages - 1;

  const scroll = (direction) => {
    if (direction === 'left' && canScrollLeft) {
      setPage((p) => p - 1);
    }
    if (direction === 'right' && canScrollRight) {
      setPage((p) => p + 1);
    }
  };

  const openLockPopup = (type) => {
    setPopupMessage(type === 'playlist' ? LOCKED_PLAYLIST_MESSAGE : LOCKED_CONTENT_MESSAGE);
    setShowPopup(true);
  };

  const isItemLocked = ({ type, data }) => {
    if (disableTierCheck || subscriptionLoading || !data) {
      return false;
    }

    if (type === 'playlist') {
      return !canAccessContent(userTier, data);
    }

    if (type === 'song') {
      const playlist = data?.playlist || data?.playlistData || null;
      return !canAccessContent(userTier, playlist, data);
    }

    return false;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 px-6 py-2">
        {Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
          <StripSkeleton key={idx} />
        ))}
      </div>
    );
  }


  return (
    <div className="space-y-4 px-4 py-2">
      {/* Header */}
      <div className="flex items-center justify-between relative">
        <h2 className="text-2xl font-semibold">{title}</h2>

        <div className="flex top-2 absolute -right-1 space-x-2 z-50">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`
              p-2 rounded-full border border-white text-white
              transition-all duration-300 ease-out
              active:scale-95
              active:bg-secondary active:text-black active:border-secondary
              ${canScrollLeft ? 'opacity-100' : 'opacity-0 cursor-not-allowed'}
            `}
          >
            <FiChevronLeft size={16} />
          </button>

          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`
              p-2 rounded-full border border-white text-white
              transition-all duration-300 ease-out
              active:scale-95
              active:bg-secondary active:text-black active:border-secondary
              ${canScrollRight ? 'opacity-100' : 'opacity-0 cursor-not-allowed'}
            `}
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Sliding Viewport */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${page * 100}%)`
          }}
        >
          {pages.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="w-full shrink-0 grid grid-cols-2 auto-rows-min gap-3 h-fit content-start"
            >
              {group.map(({ type, data }, idx) => {
                const locked = isItemLocked({ type, data });
                const image =
                  data.image ||
                  data.artwork_filename ||
                  data.cover_image ||
                  FALLBACK_IMAGE;

                const artist =
                  data.artist || data.author || 'Align Alternative Therapy';

                let subtitle = '';

                if (type === 'song') {
                  const playlistName = data.playlistTitle || data.playlist_name;
                  subtitle = playlistName ? `${playlistName}` : '';
                } else {
                  const categoryName = data.category_name;
                  subtitle = categoryName ? `${categoryName}` : '';
                }

                const link =
                  type === 'song'
                    ? `/dashboard/song/${data.slug || data.song_slug || data.id}`
                    : `/dashboard/playlist/${data.slug || data.playlist_slug || data.id}`;

                return (
                  <div
                    key={`${type}-${data.id}-${idx}`}
                    className={`relative flex items-center gap-4 p-2 rounded-lg cursor-pointer transition bg-secondary/20 ${
                      locked ? 'bg-black/35' : 'hover:bg-secondary/30'
                    }`}
                    onClick={() => {
                      if (locked) {
                        openLockPopup(type);
                        return;
                      }
                      navigate(link);
                    }}
                  >
                    <img
                      src={image}
                      alt={data.title}
                      className="w-14 h-14 rounded-md object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-semibold wrap-break-word leading-tight line-clamp-2">
                        {data.title}
                      </p>

                      {/* <p className="text-sm text-gray-300 truncate">
                        {artist}
                      </p> */}

                      {subtitle && (
                        <p className="text-xs text-gray-400 wrap-break-word leading-tight">
                          {subtitle}
                        </p>
                      )}
                    </div>

                    {locked && (
                      <div className="absolute inset-0 rounded-lg bg-black/45 backdrop-blur-[2px] pointer-events-none" />
                    )}

                    {locked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openLockPopup(type);
                        }}
                        className="relative z-10 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 cursor-pointer transition"
                      >
                        <Lock className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

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
              className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-md text-center max-w-md w-[90%] text-white flex flex-col items-center space-y-4"
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
                onClick={() => {
                  setShowPopup(false);
                  navigate('/pricing');
                }}
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
