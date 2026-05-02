import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { Lock, Search, X } from 'lucide-react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

import {
  useGetCategoriesQuery,
  useGetDashboardNewReleasesQuery,
} from '../../utils/api';
import {
  VerticalStripItem,
  VerticalStripSkeleton,
} from '../custom-ui/VerticalStripCarousel';
import OptimizedImage from '../common/OptimizedImage';

const FALLBACK_IMAGE =
  'https://cdn.align-alternativetherapy.com/static-pages-media/Align-fallback-img.png';
const RAIL_IMAGE_WIDTH = 480;
const RAIL_IMAGE_HEIGHT = 240;

function CategoryRailCard({ category, priority = false }) {
  const navigate = useNavigate();
  const image = category?.image || category?.artwork_filename || FALLBACK_IMAGE;

  return (
    <button
      type="button"
      onClick={() => navigate(`/dashboard/category/${category.slug}`)}
      className="group relative h-40 w-full overflow-hidden rounded-2xl text-left"
    >
      <OptimizedImage
        src={image}
        widths={[320, 480, 640]}
        sizes="20rem"
        width={RAIL_IMAGE_WIDTH}
        height={RAIL_IMAGE_HEIGHT}
        alt={category?.title || 'Category'}
        priority={priority}
        fallback={FALLBACK_IMAGE}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-lg font-semibold leading-tight text-white line-clamp-2">
          {category?.title}
        </p>
      </div>
    </button>
  );
}

export default function DashboardHomeRail() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const sliderRef = useRef(null);
  const [activeCategorySlide, setActiveCategorySlide] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const {
    data: newReleaseRaw = {},
    isLoading: releasesLoading,
    isFetching: releasesFetching,
    isError: releasesError,
  } = useGetDashboardNewReleasesQuery({
    playlistLimit: 8,
    songLimit: 14,
  });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useGetCategoriesQuery();

  const playlists = Array.isArray(newReleaseRaw?.playlists) ? newReleaseRaw.playlists : [];
  const songs = Array.isArray(newReleaseRaw?.songs) ? newReleaseRaw.songs : [];

  const playlistImageByPreviewSongId = useMemo(() => {
    const pairs = playlists
      .filter((playlist) => playlist?.previewSong?.id && playlist?.image)
      .map((playlist) => [playlist.previewSong.id, playlist.image]);

    return new Map(pairs);
  }, [playlists]);

  const playlistItems = useMemo(() => {
    return playlists.map((playlist) => ({
      type: 'playlist',
      data: {
        ...playlist,
        image: playlist?.image || FALLBACK_IMAGE,
      },
    }));
  }, [playlists]);

  const songItems = useMemo(() => {
    return songs.map((song) => ({
      type: 'song',
      data: {
        ...song,
        title: song?.title || song?.name || 'Untitled Track',
        artist: song?.artist || song?.author || 'Align Alternative Therapy',
        image:
          song?.image ||
          song?.artwork_filename ||
          playlistImageByPreviewSongId.get(song?.id) ||
          FALLBACK_IMAGE,
        slug: song?.slug || song?.song_slug || song?.id,
      },
    }));
  }, [playlistImageByPreviewSongId, songs]);

  const releaseItems = useMemo(() => {
    return [...playlistItems, ...songItems].sort((a, b) => {
      const aTime = Date.parse(a?.data?.createdAt || '') || 0;
      const bTime = Date.parse(b?.data?.createdAt || '') || 0;
      return bTime - aTime;
    });
  }, [playlistItems, songItems]);

  const filteredReleaseItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return releaseItems;

    return releaseItems.filter(({ type, data }) =>
      `${type} ${data?.title || ''} ${data?.name || ''} ${data?.artist || ''} ${data?.playlistTitle || ''} ${data?.playlist_name || ''} ${data?.category_name || ''}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, releaseItems]);

  const categorySliderSettings = {
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: true,
    infinite: false,
    autoplay: false,
    autoplaySpeed: 4500,
    adaptiveHeight: false,
    beforeChange: (_, next) => {
      setActiveCategorySlide(next);
    },
  };

  useEffect(() => {
    setActiveCategorySlide(0);
  }, [categories.length]);

  const canScrollCategoriesLeft = activeCategorySlide > 0;
  const canScrollCategoriesRight = activeCategorySlide < categories.length - 1;
  const openLockPopup = (type) => {
    setPopupMessage(
      type === 'playlist'
        ? 'This playlist is available only for premium subscribers.'
        : 'This content is not included in your plan. Subscribe to a premium plan.'
    );
    setShowPopup(true);
  };

  return (
    <aside className="hidden h-full w-[20rem] shrink-0 lg:flex lg:flex-col">
      <div className="flex h-full flex-col overflow-hidden rounded-lg bg-black">
        <div className="border-b border-white/10 px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 focus-within:text-gray-100" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search releases"
              className="w-full rounded-full border border-white/10 bg-white/20 focus:outline-none focus:ring-1 focus:ring-secondary/50 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-300 outline-none transition-colors focus:border-white/20"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <div className="border-b border-white/10 px-4 py-4 overflow-y-auto custom-scrollbar">
            {releasesError ? (
              <>
                <h2 className="text-2xl font-semibold text-white">Explore</h2>
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  We couldn&apos;t load songs right now.
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-white">Explore</h2>

                <div className="mt-4 space-y-3">
                  {(releasesLoading || releasesFetching) &&
                    Array.from({ length: 6 }).map((_, index) => (
                      <VerticalStripSkeleton key={index} />
                    ))}

                  {!releasesLoading &&
                    !releasesFetching &&
                    filteredReleaseItems.map(({ type, data }) => (
                      <VerticalStripItem
                        key={`${type}-${data.id}`}
                        type={type}
                        data={data}
                        onLocked={openLockPopup}
                      />
                    ))}
                </div>

                {!releasesLoading &&
                  !releasesFetching &&
                  filteredReleaseItems.length === 0 && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/60">
                      No releases match your search.
                    </div>
                  )}
              </>
            )}
          </div>

          <div className="px-4 py-4">
            <div className="relative mb-4 flex items-center justify-between">
              <div className="text-2xl font-semibold text-white">Categories</div>

              {categories.length > 1 && (
                <div className="absolute right-0 top-0 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => canScrollCategoriesLeft && sliderRef.current?.slickPrev()}
                    disabled={!canScrollCategoriesLeft}
                    aria-label="Previous category"
                    className={`
                      rounded-full border border-white p-2 text-white
                      transition-all duration-300 ease-out
                      active:scale-95 active:border-secondary active:bg-secondary active:text-black
                      ${canScrollCategoriesLeft ? 'opacity-100' : 'cursor-not-allowed opacity-40'}
                    `}
                  >
                    <FiChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => canScrollCategoriesRight && sliderRef.current?.slickNext()}
                    disabled={!canScrollCategoriesRight}
                    aria-label="Next category"
                    className={`
                      rounded-full border border-white p-2 text-white
                      transition-all duration-300 ease-out
                      active:scale-95 active:border-secondary active:bg-secondary active:text-black
                      ${canScrollCategoriesRight ? 'opacity-100' : 'cursor-not-allowed opacity-40'}
                    `}
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {categoriesLoading ? (
              <div className="h-40 rounded-2xl bg-white/[0.05] animate-pulse" />
            ) : categoriesError ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                We couldn&apos;t load categories right now.
              </div>
            ) : (
              <Slider
                ref={sliderRef}
                {...categorySliderSettings}
                className="rail-category-slider -mx-1"
              >
                {categories.map((category, index) => (
                  <div key={category.id} className="px-1">
                    <CategoryRailCard category={category} priority={index === 0} />
                  </div>
                ))}
              </Slider>
            )}
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
                className="relative flex w-[90%] max-w-md flex-col items-center space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 text-center text-white shadow-md backdrop-blur-xl"
              >
                <button
                  onClick={() => setShowPopup(false)}
                  aria-label="Close subscription prompt"
                  className="absolute right-3 top-3 text-white/70 transition hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>

                <Lock className="mb-3 h-10 w-10 text-secondary" />
                <p className="mb-5 text-lg font-medium text-white">{popupMessage}</p>

                <button
                  onClick={() => {
                    setShowPopup(false);
                    navigate('/pricing');
                  }}
                  className="cursor-pointer rounded-full bg-secondary px-5 py-2.5 text-gray-900 transition hover:bg-secondary/80"
                >
                  View Plans
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
