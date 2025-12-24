// src/components/dashboard/CarouselSection.jsx
import React, { useRef, useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import PlaylistCard from '../custom-ui/PlaylistCard';
import SongCard     from '../custom-ui/SongCard';

function SkeletonCard() {
  return (
    <div
      className="w-48 h-48 bg-gray-900 rounded-lg animate-pulse flex-shrink-0"
      style={{ animationDuration: '2000ms', animationIterationCount: 'infinite' }}
    />
  );
}

export default function CarouselSection({
  title,
  useQuery,
  queryArg,
  items,
  renderItem,
}) {
  let data, isLoading = false, isError = false;

  if (Array.isArray(items)) {
    data = items;
  } else {
    if (typeof useQuery !== 'function') {
      console.error('CarouselSection: expected useQuery to be a hook, got:', useQuery);
      return null;
    }
    const result = useQuery(queryArg);
    data      = result.data     || [];
    isLoading = result.isLoading;
    isError   = result.isError;
  }

  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
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
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <section className="space-y-2 px-6 py-2">
        <h2 className="text-2xl font-semibold text-gray-400 animate-pulse">
          Loading {title}…
        </h2>
        <div className="flex space-x-4 overflow-x-auto pb-2 custom-scrollbar">
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
    <section className="relative space-y-4 px-6 py-2 group">
      <h2 className="text-2xl font-semibold">{title}</h2>

      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        className={`
          absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full backdrop-blur-md bg-transparent cursor-pointer text-white transition-opacity
          ${canScrollLeft ? 'opacity-100' : 'opacity-30 cursor-not-allowed'}
          hidden md:flex group-hover:flex
        `}
      >
        <FiChevronLeft size={34} />
      </button>

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        className={`
          absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full backdrop-blur-md bg-transparent cursor-pointer text-white transition-opacity
          ${canScrollRight ? 'opacity-100' : 'opacity-30 cursor-not-allowed'}
          hidden md:flex group-hover:flex
        `}
      >
        <FiChevronRight size={34} />
      </button>

      <div
        ref={carouselRef}
        className="flex space-x-4 overflow-x-auto pb-2 snap-x snap-mandatory custom-scrollbar"
      >
        {data.map(item => {
          const isCombined = item && item.type && item.data;
          const key        = isCombined ? `${item.type}-${item.data.id}` : item.id;
          const payload    = isCombined ? item.data : item;

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
