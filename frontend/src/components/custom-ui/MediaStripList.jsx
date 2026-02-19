import React from 'react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function MediaStripList({ items = [] }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {items.map(({ type, data }, idx) => {
        const image =
          data.image ||
          data.artwork_filename ||
          data.cover_image ||
          FALLBACK_IMAGE;

        const title = data.title;
        const subtitle =
          type === 'song'
            ? `${data.artist}${data.playlistTitle ? ` • from ${data.playlistTitle}` : ''}`
            : 'Playlist';

        const link =
          type === 'song'
            ? `/dashboard/song/${data.slug}`
            : `/dashboard/playlist/${data.slug}`;

        return (
          <div
            key={`${type}-${data.id}-${idx}`}
            className="group flex items-center gap-4 text-white p-3 hover:bg-secondary/30 rounded-lg cursor-pointer transition"
            onClick={() => navigate(link)}
          >
            <img
              src={image}
              alt={title}
              className="w-14 h-14 rounded-md object-cover shrink-0"
            />

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{title}</p>
              <p className="text-gray-400 text-sm truncate">{subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
