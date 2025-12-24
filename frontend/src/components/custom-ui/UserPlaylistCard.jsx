import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';

export default function UserPlaylistCard({ playlist }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navigate using slug (but only for user playlists)
    navigate(`/dashboard/user-playlists/${playlist.slug}`);
  };

  return (
    <div className="flex flex-col items-start">
      <div
        className="relative group/item w-65 h-65 flex-shrink-0 overflow-hidden rounded-lg
                   cursor-pointer transform transition-all duration-500 hover:scale-100"
        onClick={handleCardClick}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
      >
        {/* Cover Image */}
        <img
          src={playlist.image || playlist.artwork_filename || FALLBACK_IMAGE}
          alt={playlist.title}
          className="w-full h-full object-cover transform transition-transform duration-700
                     group-hover/item:scale-115"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent
                        opacity-0 group-hover/item:opacity-100 transition-all duration-300" />

        {/* Play Button (non-functional for now) */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 w-12 h-12 bg-secondary rounded-full flex 
                     items-center justify-center opacity-0 group-hover/item:opacity-100
                     transition-all duration-300 hover:bg-secondary hover:scale-110"
        >
          <Play className="w-6 h-6 text-gray-800" />
        </button>

        {/* Playlist title */}
        <h3 className="absolute bottom-4 left-4 text-white font-semibold text-base 
                       truncate max-w-[calc(100%-4rem)]">
          {playlist.title}
        </h3>
      </div>
    </div>
  );
}
