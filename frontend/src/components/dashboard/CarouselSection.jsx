// src/components/dashboard/CarouselSection.jsx
import React from 'react';
import * as apiHooks from '../../utils/api';
import PlaylistCard from '../custom-ui/PlaylistCard';


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
  renderItem,
  queryArg
}) {
  const { data = [], isLoading, isError } = useQuery(queryArg);

  if (isLoading) {
    
    return (
      <section className="space-y-2 p-6">
        <h2 className="text-2xl font-semibold text-gray-400 animate-pulse" style={{ animationDuration: '5000ms', animationIterationCount: 'infinite' }}>
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
        {data.map(item => (
          <div key={item.id} className="snap-start">
            {renderItem ? renderItem(item) : <PlaylistCard playlist={item} />}
          </div>
        ))}
      </div>
    </section>
  );
}
