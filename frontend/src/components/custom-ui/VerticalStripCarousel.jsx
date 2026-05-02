import React, { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../../context/SubscriptionContext';
import { canAccessContent } from '../../utils/permissions';
import OptimizedImage from '../common/OptimizedImage';

const FALLBACK_IMAGE =
  'https://cdn.align-alternativetherapy.com/static-pages-media/Align-fallback-img.png';

const DEFAULT_ITEMS_PER_PAGE = 6;
const STRIP_IMAGE_SIZE = 112;
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

export function VerticalStripSkeleton() {
  return <StripSkeleton />;
}

export function VerticalStripItem({
  type,
  data,
  disableTierCheck = false,
  lockedOverride,
  titleOverride,
  subtitleOverride,
  badge,
  linkOverride,
  onLocked,
  className = '',
}) {
  const navigate = useNavigate();
  const { userTier, loading: subscriptionLoading } = useSubscription();

  const permissionLocked = useMemo(() => {
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
  }, [data, disableTierCheck, subscriptionLoading, type, userTier]);

  const locked =
    typeof lockedOverride === 'boolean' ? lockedOverride : permissionLocked;

  const image =
    data?.image ||
    data?.artwork_filename ||
    data?.cover_image ||
    FALLBACK_IMAGE;

  const title = titleOverride || data?.title || data?.name || 'Untitled';
  let subtitle = subtitleOverride;

  if (subtitle === undefined) {
    if (type === 'song') {
      const playlistName = data?.playlistTitle || data?.playlist_name;
      subtitle = playlistName ? `${playlistName}` : '';
    } else {
      const categoryName = data?.category_name;
      subtitle = categoryName ? `${categoryName}` : '';
    }
  }

  const defaultLink =
    type === 'song'
      ? `/dashboard/song/${data?.slug || data?.song_slug || data?.id}`
      : `/dashboard/playlist/${data?.slug || data?.playlist_slug || data?.id}`;
  const link = linkOverride || defaultLink;

  const handleLocked = () => {
    if (onLocked) {
      onLocked(type, data);
    }
  };

  return (
    <div
      className={`relative flex cursor-pointer items-center gap-4 rounded-lg bg-secondary/20 p-2 transition ${
        locked ? 'bg-black/35' : 'hover:bg-secondary/30'
      } ${className}`.trim()}
      onClick={() => {
        if (locked) {
          handleLocked();
          return;
        }
        navigate(link);
      }}
    >
      <OptimizedImage
        src={image}
        widths={[56, 112, 168]}
        sizes="3.5rem"
        width={STRIP_IMAGE_SIZE}
        height={STRIP_IMAGE_SIZE}
        alt={title}
        fallback={FALLBACK_IMAGE}
        className="h-14 w-14 shrink-0 rounded-md object-cover"
      />

      <div className="min-w-0 flex-1 overflow-hidden">
        {badge && (
          <span className="mb-1 inline-flex max-w-full items-center truncate rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] leading-none text-white/80">
            {badge}
          </span>
        )}
        <p className="font-semibold leading-tight line-clamp-2">
          {title}
        </p>

        {subtitle && (
          <p className="line-clamp-1 text-xs leading-tight text-gray-400">
            {subtitle}
          </p>
        )}
      </div>

      {locked && (
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-black/45 backdrop-blur-[2px]" />
      )}

      {locked && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLocked();
          }}
          aria-label="View subscription details"
          className="relative z-10 cursor-pointer rounded-full bg-white/10 p-2 transition hover:bg-white/20"
        >
          <Lock className="h-4 w-4 text-white" />
        </button>
      )}
    </div>
  );
}

/* ---------------- Component ---------------- */

export default function VerticalStripCarousel({
  title,
  items = [],
  isLoading = false,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  disableTierCheck = false,
  renderItem,
  wrapperClassName = '',
  titleClassName = '',
  pageClassName = 'w-full shrink-0 grid grid-cols-2 auto-rows-min gap-3 h-fit content-start',
}) {
  const [page, setPage] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const navigate = useNavigate();

  /* Reset page when items change (important on tag change) */
  useEffect(() => {
    setPage(0);
  }, [items]);

  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < items.length; i += itemsPerPage) {
      chunks.push(items.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [items, itemsPerPage]);

  const totalPages = pages.length;
  const hasTitle = Boolean(title);
  const showControls = totalPages > 1;
  const wrapperClasses = ['space-y-4 px-4 py-2', wrapperClassName].filter(Boolean).join(' ');
  const titleClasses = ['text-2xl font-semibold', titleClassName].filter(Boolean).join(' ');

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

  const header = (hasTitle || showControls) ? (
    <div
      className={`flex items-center ${
        hasTitle ? 'justify-between relative' : 'justify-end'
      }`}
    >
      {hasTitle && <h2 className={titleClasses}>{title}</h2>}

      {showControls && (
        <div
          className={`flex space-x-2 z-50 ${
            hasTitle ? 'top-2 absolute -right-1' : ''
          }`}
        >
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label={`Previous ${title || 'items'} page`}
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
            aria-label={`Next ${title || 'items'} page`}
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
      )}
    </div>
  ) : null;

  if (isLoading) {
    return (
      <div className={wrapperClasses}>
        {header}
        {Array.from({ length: itemsPerPage }).map((_, idx) => (
          <StripSkeleton key={idx} />
        ))}
      </div>
    );
  }


  return (
    <div className={wrapperClasses}>
      {header}

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
              className={pageClassName}
            >
              {group.map((item, idx) => {
                const { type, data } = item;
                const key = `${type}-${data?.id ?? idx}-${idx}`;

                if (renderItem) {
                  const rendered = renderItem(item, idx, openLockPopup);

                  return React.isValidElement(rendered)
                    ? React.cloneElement(rendered, { key: rendered.key ?? key })
                    : <React.Fragment key={key}>{rendered}</React.Fragment>;
                }

                return (
                  <VerticalStripItem
                    key={key}
                    type={type}
                    data={data}
                    disableTierCheck={disableTierCheck}
                    onLocked={openLockPopup}
                  />
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
                aria-label="Close subscription prompt"
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
