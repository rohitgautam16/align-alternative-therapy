import React, { useRef, useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import PlaylistCard from '../custom-ui/PlaylistCard';
import SongCard     from '../custom-ui/SongCard';

const EMPTY_ITEMS = Object.freeze([]);

function useNoQuery() {
  return null;
}

function SkeletonCard() {
  return (
    <div className="w-65 flex-shrink-0 animate-pulse">
      <div className="relative w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
        <div className="aspect-square bg-white/10" />
      </div>
      <div className="mt-3">
        <div className="h-4 w-40 sm:w-44 md:w-48 rounded bg-white/20 mb-2" />
        <div className="h-3 w-28 rounded bg-white/15" />
      </div>
    </div>
  );
}

export default function CarouselSection({
  title,
  useQuery,
  queryArg,
  items,
  renderItem,
}) {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const queryArgKey = JSON.stringify(queryArg || {});
  const [pagedQueryArg, setPagedQueryArg] = useState(queryArg);
  const [pagedItems, setPagedItems] = useState([]);

  // ---- Query Handling (SAFE HOOK USAGE) ----
  const useActiveQuery = useQuery || useNoQuery;
  const queryResult = useActiveQuery(pagedQueryArg);
  const queryData = queryResult?.data;
  const responseItems = Array.isArray(queryData)
    ? queryData
    : (queryData?.items || EMPTY_ITEMS);
  const isPagedQuery = Boolean(useQuery && queryArg && queryArg.limit);
  const nextOffset = isPagedQuery && !Array.isArray(queryData)
    ? queryData?.nextOffset
    : null;

  useEffect(() => {
    setPagedQueryArg(queryArg);
    setPagedItems([]);
  }, [queryArgKey]);

  useEffect(() => {
    if (Array.isArray(items) || !Array.isArray(responseItems)) return;

    if (!isPagedQuery || !pagedQueryArg?.offset) {
      setPagedItems(responseItems);
      return;
    }

    setPagedItems((current) => {
      const seen = new Set(current.map((item) => item?.id));
      const next = responseItems.filter((item) => !seen.has(item?.id));
      return [...current, ...next];
    });
  }, [items, isPagedQuery, pagedQueryArg?.offset, responseItems]);

  const data = Array.isArray(items)
    ? items
    : (isPagedQuery ? pagedItems : responseItems);

  const showSkeleton = !Array.isArray(items) &&
    (queryResult?.isLoading || queryResult?.isFetching);

  const isError = queryResult?.isError;

  // ---- Scroll Handling ----
  const updateScrollButtons = () => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);

    const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - el.clientWidth * 1.5;
    if (nearEnd && nextOffset !== null && !queryResult?.isFetching) {
      setPagedQueryArg({
        ...(queryArg || {}),
        offset: nextOffset,
      });
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [data]);

  const scroll = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.5;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // ---- Skeleton ----
  if (showSkeleton) {
    return (
      <section className="space-y-2 px-6 py-2">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return <p className="p-6 text-red-500">Error loading {title}.</p>;
  }

  return (
    <section className="relative space-y-4 px-4 md:px-6 py-2 group">
      <h2 className="text-2xl font-semibold">{title}</h2>

      {/* Desktop Arrows */}
      <button
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        aria-label={`Scroll ${title} left`}
        className={`absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full
        text-white transition-opacity cursor-pointer backdrop-blur-xs
        ${canScrollLeft ? 'opacity-100' : 'opacity-30 cursor-not-allowed'}
        hidden md:flex group-hover:flex`}
      >
        <FiChevronLeft size={34} />
      </button>

      <button
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        aria-label={`Scroll ${title} right`}
        className={`absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full
        text-white transition-opacity cursor-pointer backdrop-blur-xs
        ${canScrollRight ? 'opacity-100' : 'opacity-30 cursor-not-allowed'}
        hidden md:flex group-hover:flex`}
      >
        <FiChevronRight size={34} />
      </button>

      <div className="flex top-2 absolute right-4 space-x-2 z-50 md:hidden">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label={`Scroll ${title} left`}
            className={`
              p-2 rounded-full border border-white text-white
              transition-all duration-300 ease-out
              active:scale-95
              active:bg-secondary active:text-black active:border-secondary
              ${canScrollLeft ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}
            `}
          >
            <FiChevronLeft size={16} />
          </button>

          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label={`Scroll ${title} right`}
            className={`
              p-2 rounded-full border border-white text-white
              transition-all duration-300 ease-out
              active:scale-95
              active:bg-secondary active:text-black active:border-secondary
              ${canScrollRight ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}
            `}
          >
            <FiChevronRight size={16} />
          </button>
      </div>

      {/* Carousel Content */}
      <div
        ref={carouselRef}
        className="flex space-x-4 overflow-x-auto pb-2 snap-x snap-mandatory custom-scrollbar"
      >
        {data.map(item => {
          const isCombined = item && item.type && item.data;
          const key = isCombined
            ? `${item.type}-${item.data.id}`
            : item.id;

          const payload = isCombined ? item.data : item;

          let content;
          if (renderItem) {
            content = renderItem(item);
          } else if (isCombined) {
            content = item.type === 'song'
              ? <SongCard song={payload} />
              : <PlaylistCard playlist={payload} />;
          } else {
            content = <PlaylistCard playlist={payload} />;
          }

          return (
            <div key={key} className="snap-start">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
