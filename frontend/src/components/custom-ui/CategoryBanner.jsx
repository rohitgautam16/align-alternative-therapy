// src/components/custom-ui/CategoryBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop';
const FALLBACK_DESC = 'Explore this category';

export default function CategoryBanner({ category }) {
  const navigate = useNavigate();

  // Safety check
  if (!category) {
    console.error('CategoryBanner: category prop is undefined');
    return null;
  }

  const handleClick = () => {
    if (!category.slug) {
      console.error('CategoryBanner: No slug available for navigation', category);
      return;
    }
    
    navigate(`/dashboard/category/${category.slug}`);
  };

  return (
    <div
      className="relative group w-full h-48 sm:h-40 md:h-54 rounded-lg overflow-hidden cursor-pointer
                 transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      {/* Background Image */}
      <img
        src={category.image || category.artwork_filename || FALLBACK_IMAGE}
        alt={category.title || 'Category'}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          console.log('Category image failed to load:', category.image || category.artwork_filename);
          e.target.src = FALLBACK_IMAGE;
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100
                      transition-opacity duration-300" />
     
      <div className="relative z-10 flex items-end justify-between h-full p-4">
        <div className="space-y-1 max-w-[70%]">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white 
                         drop-shadow-lg line-clamp-2">
            {category.title || 'Untitled Category'}
          </h3>
          <p className="text-sm sm:text-base text-white/90 drop-shadow-lg line-clamp-2">
            {category.description || FALLBACK_DESC}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          className="border border-white/80 px-3 py-1 sm:px-4 sm:py-2 rounded-lg 
                     text-white text-sm backdrop-blur-sm bg-white/10
                     hover:bg-secondary hover:border-secondary transition-all duration-300
                     flex-shrink-0 drop-shadow-lg cursor-pointer"
        >
          Explore Category
        </button>
      </div>
    </div>
  );
}
