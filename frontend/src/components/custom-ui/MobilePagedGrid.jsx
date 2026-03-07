import React, {
  useState,
  useMemo,
  useRef,
  useEffect
} from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../../context/SubscriptionContext';
import { canAccessContent } from '../../utils/permissions';

const DEFAULT_ITEMS_PER_PAGE = 9;
const AUTO_SLIDE_INTERVAL = 100000;
const FALLBACK_IMAGE ='https://cdn.align-alternativetherapy.com/static-pages-media/Align-fallback-img.png';
const LOCKED_PLAYLIST_MESSAGE = 'This playlist is available only for premium subscribers.';
const LOCKED_CONTENT_MESSAGE =
  'This content is not included in your plan. Subscribe to a premium plan.';


function GridSkeleton({ itemsPerPage = 9 }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 animate-pulse">
      {Array.from({ length: itemsPerPage }).map((_, idx) => (
        <div
          key={idx}
          className="aspect-square rounded-xl bg-white/10"
        />
      ))}
    </div>
  );
}

export default React.memo(function MobilePagedGrid({
  title,
  items = [],
  renderItem,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  autoSlide = false,
  isLoading = false,
  disableTierCheck = false
}) {
  const navigate = useNavigate();
  const { userTier, loading: subscriptionLoading } = useSubscription();
  const [page, setPage] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const touchStartX = useRef(null);
  const autoSlideRef = useRef(null);

  const openLockPopup = (type) => {
    setPopupMessage(type === 'playlist' ? LOCKED_PLAYLIST_MESSAGE : LOCKED_CONTENT_MESSAGE);
    setShowPopup(true);
  };

  const isItemLocked = (item) => {
    if (disableTierCheck || subscriptionLoading || !item?.data) {
      return false;
    }

    if (item.type === 'playlist') {
      return !canAccessContent(userTier, item.data);
    }

    if (item.type === 'song') {
      const playlist = item.data?.playlist || item.data?.playlistData || null;
      return !canAccessContent(userTier, playlist, item.data);
    }

    return false;
  };

  // Chunk items
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < items.length; i += itemsPerPage) {
      chunks.push(items.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [items, itemsPerPage]);

  const totalPages = pages.length;

  const canScrollLeft = page > 0;
  const canScrollRight = page < totalPages - 1;

  const goToPage = (index) => {
    if (index >= 0 && index < totalPages) {
      setPage(index);
    }
  };

  const scroll = (direction) => {
    if (direction === 'left' && canScrollLeft) {
      setPage(p => p - 1);
    }
    if (direction === 'right' && canScrollRight) {
      setPage(p => p + 1);
    }
  };

  // Auto Slide
  useEffect(() => {
    if (!autoSlide || totalPages <= 1 || isInteracting) return;

    autoSlideRef.current = setInterval(() => {
      setPage(prev => (prev + 1) % totalPages);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(autoSlideRef.current);
  }, [autoSlide, totalPages, isInteracting]);

  useEffect(() => {
  setPage(0);
}, [items]);

  // Swipe Gesture
  const handleTouchStart = (e) => {
    setIsInteracting(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;

    if (diff > 50 && canScrollRight) scroll('right');
    if (diff < -50 && canScrollLeft) scroll('left');

    setIsInteracting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 px-4 py-2">
        {title && (
          <h2 className="text-lg font-semibold">{title}</h2>
        )}
        <GridSkeleton itemsPerPage={itemsPerPage} />
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="space-y-3 px-4 py-2 lg:hidden">

      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{title}</h2>

          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`
                p-2 rounded-full border border-white
                text-white
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
                p-2 rounded-full border border-white
                text-white
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
      )}

      {/* Viewport */}
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="w-full shrink-0 grid grid-cols-3 gap-1.5"
            >
              {group.map((item, idx) => {
                const locked = isItemLocked(item);
                const key = item?.data?.id
                  ? `${item.type}-${item.data.id}-${idx}`
                  : `${groupIndex}-${idx}`;

                return (
                  <div
                    key={key}
                    className="relative animate-fadeInUp"
                    style={{
                      animationDelay: `${idx * 60}ms`
                    }}
                  >
                    {renderItem(item, FALLBACK_IMAGE)}

                    {locked && (
                      <div
                        className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex items-center justify-center rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLockPopup(item.type);
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLockPopup(item.type);
                          }}
                          className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 cursor-pointer transition"
                        >
                          <Lock className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Page Indicator Dots */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-1">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300
                ${page === idx ? 'bg-secondary scale-110' : 'bg-white/40'}
              `}
            />
          ))}
        </div>
      )}

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
})
