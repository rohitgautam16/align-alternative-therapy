// src/components/ui/CategoryBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop';
const FALLBACK_DESC = 'Explore this category';

export default function CategoryBanner({ category }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/dashboard/category/${category.slug}`);
  };

  return (
    <div
      className="relative group w-full h-58 rounded-lg overflow-hidden cursor-pointer
                 transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      {/* Background */}
      <img
        src={category.image || FALLBACK_IMAGE}
        alt={category.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark gradient overlay, fades in on hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                      transition-opacity duration-500" />

     
      <div className="relative z-10 flex items-end justify-between h-full p-6">
       
        <div className="space-y-1 max-w-[70%]">
          <h3 className="text-3xl font-bold text-white transition-colors duration-300
                         group-hover:text-white">
            {category.title}
          </h3>
          <p className="text-lg text-white/80 transition-colors duration-300
                        group-hover:text-white">
            {category.description || FALLBACK_DESC}
          </p>
        </div>

       
        <button
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          className="border border-white px-5 py-2 rounded-lg text-white
                     hover:bg-red-700 hover:text-black hover:border-0 transition-colors duration-300"
        >
          Explore Now
        </button>
      </div>
    </div>
  );
}
