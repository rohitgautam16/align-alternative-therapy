import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import {
  useGetAllSongsQuery,
  useGetDashboardAllPlaylistsQuery,
} from '../../utils/api';
import OptimizedImage from '../common/OptimizedImage';

const FALLBACK_IMAGE =
  'https://cdn.align-alternativetherapy.com/static-pages-media/Align-fallback-img.png';
const TAG_THUMB_SIZE = 112;
const TAG_CARD_SIZE = 360;

const SONGS_PER_PAGE = 4;
const PLAYLISTS_PER_PAGE = 8;

const sectionVariants = {
  closed: {
    height: 0,
    opacity: 0,
    y: -18,
    transition: {
      height: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
      opacity: { duration: 0.2 },
      y: { duration: 0.25, ease: 'easeInOut' },
    },
  },
  open: {
    height: 'auto',
    opacity: 1,
    y: 0,
    transition: {
      height: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
      opacity: { duration: 0.3, delay: 0.08 },
      y: { duration: 0.3, ease: 'easeOut' },
    },
  },
};

function chunkItems(items, size) {
  const groups = [];

  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }

  return groups;
}

function ErrorMessage({ children }) {
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      {children}
    </div>
  );
}

function SongSkeletonCard() {
  return (
    <div className="min-h-[90px] rounded-2xl border border-white/10 bg-white/[0.06] p-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-white/10" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function PlaylistSkeletonCard() {
  return <div className="aspect-square rounded-[22px] bg-white/[0.08] animate-pulse" />;
}

function TagSongCard({ song }) {
  const navigate = useNavigate();

  const title = song?.title || song?.name || 'Untitled Track';
  const subtitle =
    song?.artist || song?.playlistTitle || song?.playlist_name || 'Align Alternative Therapy';
  const slug = song?.slug || song?.song_slug || song?.id;
  const image = song?.image || song?.artwork_filename || FALLBACK_IMAGE;

  return (
    <button
      type="button"
      onClick={() => navigate(`/dashboard/song/${slug}`)}
      className="group flex min-h-[90px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-left backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.1]"
    >
      <OptimizedImage
        src={image}
        widths={[56, 112, 168]}
        sizes="3.5rem"
        width={TAG_THUMB_SIZE}
        height={TAG_THUMB_SIZE}
        alt={title}
        fallback={FALLBACK_IMAGE}
        className="h-14 w-14 shrink-0 rounded-xl object-cover"
      />

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-white">
          {title}
        </p>
        <p className="mt-1 truncate text-xs text-white/60">{subtitle}</p>
      </div>
    </button>
  );
}

function TagPlaylistCard({ playlist }) {
  const navigate = useNavigate();

  const title = playlist?.title || playlist?.name || 'Untitled Playlist';
  const image = playlist?.image || playlist?.artwork_filename || FALLBACK_IMAGE;
  const link = playlist?.slug
    ? `/dashboard/playlist/${playlist.slug}`
    : `/dashboard/user-playlist/${playlist.id}`;

  return (
    <button
      type="button"
      onClick={() => navigate(link)}
      className="group relative aspect-square overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.06] text-left shadow-[0_18px_38px_-28px_rgba(0,0,0,0.7)] backdrop-blur-sm transition-all duration-200"
    >
      <OptimizedImage
        src={image}
        widths={[180, 360, 540]}
        sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 25vw, 50vw"
        width={TAG_CARD_SIZE}
        height={TAG_CARD_SIZE}
        alt={title}
        fallback={FALLBACK_IMAGE}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-white">
          {title}
        </p>
      </div>
    </button>
  );
}

function CompactGridPager({
  items = [],
  pageSize,
  isLoading = false,
  gridClassName,
  renderItem,
  renderSkeleton,
}) {
  const [page, setPage] = useState(0);

  const pages = useMemo(() => chunkItems(items, pageSize), [items, pageSize]);
  const totalPages = pages.length;
  const canScrollLeft = page > 0;
  const canScrollRight = page < totalPages - 1;

  useEffect(() => {
    setPage(0);
  }, [items, pageSize]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className={gridClassName}>
          {Array.from({ length: pageSize }).map((_, index) => (
            <React.Fragment key={index}>{renderSkeleton(index)}</React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="space-y-3">
      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => canScrollLeft && setPage((current) => current - 1)}
            disabled={!canScrollLeft}
            aria-label="Previous results page"
            className={`rounded-full border p-2 transition-all duration-300 ${
              canScrollLeft
                ? 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]'
                : 'cursor-not-allowed border-white/10 bg-white/[0.04] text-white/30'
            }`}
          >
            <FiChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => canScrollRight && setPage((current) => current + 1)}
            disabled={!canScrollRight}
            aria-label="Next results page"
            className={`rounded-full border p-2 transition-all duration-300 ${
              canScrollRight
                ? 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]'
                : 'cursor-not-allowed border-white/10 bg-white/[0.04] text-white/30'
            }`}
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      )}

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((group, groupIndex) => (
            <div key={groupIndex} className={`w-full shrink-0 ${gridClassName}`}>
              {group.map((item, index) => (
                <React.Fragment key={item?.id ?? `${groupIndex}-${index}`}>
                  {renderItem(item)}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-1">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPage(index)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                page === index
                  ? 'scale-110 bg-white'
                  : 'bg-white/30 hover:bg-white/45'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MobilePlaylistCarousel({
  items = [],
  isLoading = false,
  renderItem,
  renderSkeleton,
}) {
  const [page, setPage] = useState(0);
  const pages = useMemo(() => chunkItems(items, 4), [items]);
  const totalPages = pages.length;

  useEffect(() => {
    setPage(0);
  }, [items]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <React.Fragment key={index}>{renderSkeleton(index)}</React.Fragment>
        ))}
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="grid w-full shrink-0 grid-cols-2 gap-3"
            >
              {Array.from({ length: 4 }).map((_, index) => {
                const playlist = group[index];

                if (!playlist) {
                  return (
                    <div
                      key={`mobile-empty-${groupIndex}-${index}`}
                      className="aspect-square opacity-0 pointer-events-none"
                    />
                  );
                }

                return (
                  <React.Fragment key={playlist.id}>
                    {renderItem(playlist)}
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPage(index)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                page === index
                  ? 'scale-110 bg-white'
                  : 'bg-white/30 hover:bg-white/45'
              }`}
              aria-label={`Go to playlist slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TagResultsSection({ tagSlug, tagLabel }) {
  const {
    data: songsRaw = [],
    isLoading: songsLoading,
    isFetching: songsFetching,
    isError: songsError,
  } = useGetAllSongsQuery(
    { tag: tagSlug },
    { skip: !tagSlug }
  );

  const {
    data: playlistsRaw = [],
    isLoading: playlistsLoading,
    isFetching: playlistsFetching,
    isError: playlistsError,
  } = useGetDashboardAllPlaylistsQuery(
    { tag: tagSlug },
    { skip: !tagSlug }
  );

  const songs = Array.isArray(songsRaw) ? songsRaw : [];
  const playlists = Array.isArray(playlistsRaw) ? playlistsRaw : [];

  const songsBusy = songsLoading || (songsFetching && songs.length === 0);
  const playlistsBusy =
    playlistsLoading || (playlistsFetching && playlists.length === 0);

  const showSongsBlock = songsBusy || songsError || songs.length > 0;
  const showPlaylistsBlock = playlistsBusy || playlistsError || playlists.length > 0;

  if (!showSongsBlock && !showPlaylistsBlock) {
    return null;
  }

  return (
    <motion.section
      variants={sectionVariants}
      initial="closed"
      animate="open"
      exit="closed"
      className="overflow-hidden px-4 pb-4 md:px-6 md:pb-6"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.06] text-white shadow-[0_24px_70px_-34px_rgba(0,0,0,0.7)] backdrop-blur-[18px]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,184,0,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,184,0,0.06),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px " />
    

        <div className="relative z-10 p-4 sm:p-5 md:p-6">
          <h2 className="text-base font-semibold text-white/95 md:text-lg">
            Explore {tagLabel}
          </h2>

          <div className="mt-4 space-y-4">
            {showSongsBlock && (
              <div className="p-3 md:p-4">
                <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/75">
                  Songs
                </div>

                {songsError ? (
                  <ErrorMessage>
                    We couldn&apos;t load songs for this tag right now.
                  </ErrorMessage>
                ) : (
                  <CompactGridPager
                    items={songs}
                    pageSize={SONGS_PER_PAGE}
                    isLoading={songsBusy}
                    gridClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
                    renderItem={(song) => <TagSongCard song={song} />}
                    renderSkeleton={(index) => <SongSkeletonCard key={index} />}
                  />
                )}
              </div>
            )}

            {showPlaylistsBlock && (
              <div className="p-3 md:p-4">
                <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/75">
                  Playlists
                </div>

                {playlistsError ? (
                  <ErrorMessage>
                    We couldn&apos;t load playlists for this tag right now.
                  </ErrorMessage>
                ) : (
                  <>
                    <div className="lg:hidden">
                      <MobilePlaylistCarousel
                        items={playlists}
                        isLoading={playlistsBusy}
                        renderItem={(playlist) => <TagPlaylistCard playlist={playlist} />}
                        renderSkeleton={(index) => <PlaylistSkeletonCard key={index} />}
                      />
                    </div>

                    <div className="hidden lg:block">
                      <CompactGridPager
                        items={playlists}
                        pageSize={PLAYLISTS_PER_PAGE}
                        isLoading={playlistsBusy}
                        gridClassName="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6"
                        renderItem={(playlist) => <TagPlaylistCard playlist={playlist} />}
                        renderSkeleton={(index) => <PlaylistSkeletonCard key={index} />}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
