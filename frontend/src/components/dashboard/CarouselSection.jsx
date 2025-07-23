// src/components/dashboard/CarouselSection.jsx
import React from 'react';
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
  items,      // optional array of either raw items or { type, data }
  renderItem, // optional custom renderer
}) {
  let data, isLoading = false, isError = false;

  if (Array.isArray(items)) {
    // 1) Use provided items
    data = items;
  } else {
    // 2) Fall back to hook
    if (typeof useQuery !== 'function') {
      console.error('CarouselSection: expected useQuery to be a hook, got:', useQuery);
      return null;
    }
    const result = useQuery(queryArg);
    data      = result.data     || [];
    isLoading = result.isLoading;
    isError   = result.isError;
  }

  if (isLoading) {
    return (
      <section className="space-y-2 p-6">
        <h2 className="text-2xl font-semibold text-gray-400 animate-pulse">
          Loading {title}…
        </h2>
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
    <section className="space-y-2 p-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="flex space-x-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {data.map(item => {
          // detect combined structure
          const isCombined = item && item.type && item.data;
          const key        = isCombined ? `${item.type}-${item.data.id}` : item.id;
          const payload    = isCombined ? item.data : item;

          let content;
          if (renderItem) {
            content = renderItem(item);
          } else if (isCombined) {
            // choose card by type
            content = item.type === 'song'
              ? <SongCard song={payload} />
              : <PlaylistCard playlist={payload} />;
          } else {
            // default for raw playlists
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
