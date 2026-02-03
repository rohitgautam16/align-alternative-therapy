import React from 'react';
import { Link } from 'react-router-dom';

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="%23111111"/>
    <g fill="%23ffffff" fill-opacity="0.15">
      <rect x="120" y="180" width="560" height="28" rx="6"/>
      <rect x="120" y="230" width="420" height="20" rx="6"/>
      <rect x="120" y="265" width="300" height="20" rx="6"/>
    </g>
    <text x="50%" y="70%" text-anchor="middle"
      fill="%23ffffff" fill-opacity="0.35"
      font-size="22" font-family="Arial">
      Blog Cover
    </text>
  </svg>`;

export default function BlogCard({ blog, variant = 'list' }) {
  const img = blog.cover_image || PLACEHOLDER;

  /* =========================
     LIST / HORIZONTAL
  ========================== */
  if (variant === 'list') {
    return (
      <Link
        to={`/dashboard/blog/${blog.slug}`}
        className="block bg-black rounded-lg overflow-hidden transition-shadow hover:shadow-lg"
      >
        <div className="flex flex-col sm:flex-row border-b pb-5 border-b-white/10">
          {/* IMAGE */}
          <div className="w-full relative overflow-hidden sm:w-64 h-48 sm:h-72 flex-shrink-0">
            <img
              src={img}
              alt={blog.title}
              loading="lazy"
              className="w-full h-full absolute inset-0 object-cover rounded-lg transition-transform duration-500 ease-out
                         group-hover:scale-110"
            />
          </div>

          {/* CONTENT */}
          <div className="flex-1 p-6 sm:p-8 pt-4 sm:pt-0 flex flex-col justify-between">
            <div>
              {/* CATEGORIES */}
              {Array.isArray(blog.categories) && blog.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {blog.categories.map(c => (
                    <Link
                      key={c.id}
                      to={`/dashboard/blog/category/${c.slug}`}
                      className="text-xs px-2 py-1 rounded-full bg-white/10 text-white"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
                {blog.title}
              </h2>

              {blog.excerpt && (
                <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-5">
                  {blog.excerpt}
                </p>
              )}
            </div>

            <div>
              <span className="inline-block bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-secondary transition">
                Discover →
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* =========================
     GRID CARD
  ========================== */
  return (
  <Link
    to={`/dashboard/blog/${blog.slug}`}
    className="group block bg-black 
               transition-all duration-300
               hover:border-white/20 focus:outline-none 
               focus:ring-2 focus:ring-secondary/50"
  >
    {/* IMAGE */}
    <div className="p-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
        <img
          src={img}
          alt={blog.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover 
                     transition-transform duration-500 ease-out
                     group-hover:scale-110"
        />
      </div>
    </div>

    {/* CONTENT */}
    <div className="px-4 pb-4 space-y-3">
      {/* CATEGORIES */}
      {Array.isArray(blog.categories) && blog.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {blog.categories.map(c => (
            <Link
              to={`/dashboard/blog/category/${c.slug}`}
              key={c.id}
              className="text-[11px] px-2 py-0.5 rounded-full 
                         bg-white/10 text-white/90"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <h3 className="font-semibold text-white leading-snug line-clamp-2 
                     group-hover:text-secondary transition-colors">
        {blog.title}
      </h3>

      {blog.excerpt && (
        <p className="text-sm text-white/70 line-clamp-2">
          {blog.excerpt}
        </p>
      )}

      <div className="pt-2 inline-block bg-white px-5 py-2 rounded-full text-sm font-medium hover:bg-secondary items-center gap-1 text-black
                      group-hover:text-black transition-colors">
        <span>Read article</span>
        <span className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </div>
  </Link>
);
}
