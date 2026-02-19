import React, { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

const ITEMS_PER_PAGE = 3;

export default function VerticalStripCarousel({ title, items = [] }) {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

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

  return (
    <div className="space-y-4 px-6 py-2">

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <h2 className="text-2xl font-semibold">{title}</h2>

        <div className="flex top-2 absolute -right-3.5 space-x-2 z-50 gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`
              p-2 rounded-full border border-white
              text-white
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
            className={`
              p-2 rounded-full border border-white
              text-white
              transition-all duration-300 ease-out
              active:scale-95
              active:bg-secondary active:text-black active:border-secondary
              ${canScrollRight ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}
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
              className="w-full shrink-0 space-y-3"
            >
              {group.map(({ type, data }, idx) => {
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
                subtitle = playlistName ? `from ${playlistName}` : '';
                } else {
                const categoryName = data.category_name;
                subtitle = categoryName ? `from ${categoryName}` : '';
                }

                const link =
                  type === 'song'
                    ? `/dashboard/song/${data.slug}`
                    : `/dashboard/playlist/${data.slug}`;

                return (
                  <div
                    key={`${type}-${data.id}-${idx}`}
                    className="flex items-center gap-4 p-2 hover:bg-secondary/30 rounded-lg cursor-pointer transition"
                    onClick={() => navigate(link)}
                  >
                    <img
                      src={image}
                      alt={data.title}
                      className="w-14 h-14 rounded-md object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {data.title}
                      </p>

                      <p className="text-sm text-gray-300 truncate">
                        {artist}
                      </p>

                      {subtitle && (
                        <p className="text-xs text-gray-400 truncate">
                            {subtitle}
                        </p>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
