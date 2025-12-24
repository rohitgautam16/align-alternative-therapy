// src/pages/BlogsPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import stubBlogs from '../stubs/blogs';


const BlogsPage = () => {
  return (
    <div className="min-h-screen bg-black py-10">

      <div className="w-full flex items-center justify-center mb-10 px-6 sm:px-10 lg:px-12 py-10">
        <div className="space-y-8 max-w-4xl mx-auto text-center">

          {/* Heading */}
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-center gap-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-none">DIVE INTO OUR ARTICLES</h1>
            </div>
          </div>


          <p className="text-base sm:text-lg text-white/70 font-medium leading-relaxed max-w-md mx-auto">
            Discover information on therapy, healing sounds, and holistic well-being.
          </p>
        </div>
      </div>


      <div className="w-full px-6 sm:px-10 lg:px-12 pb-20 space-y-12 sm:space-y-16 lg:space-y-20">
        {stubBlogs.map(blog => (
          <Link
            key={blog.slug}
            to={`/dashboard/blog/${blog.slug}`}
            className="block bg-black rounded-lg overflow-hidden transition-shadow hover:shadow-lg"
          >
            <div className="flex flex-col sm:flex-row border-b pb-5 border-b-white/50">

              {/* Image */}
              <div className="w-full sm:w-64 h-48 sm:h-72 flex-shrink-0">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Content */}
              <div className="flex-1 p-6 sm:p-8 pt-4 sm:pt-0 flex flex-col justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-gray-300 uppercase tracking-wide mb-2">
                    MAY, 2025
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                    {blog.title}
                  </h2>

                  <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-5 sm:mb-6">
                    {blog.excerpt}
                  </p>
                </div>

                <div>
                  <button className="bg-white text-black px-5 py-2 sm:px-6 sm:py-2 cursor-pointer hover:bg-secondary rounded-full text-sm font-medium transition-colors">
                    Discover →
                  </button>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BlogsPage;
