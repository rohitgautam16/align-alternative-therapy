import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useListBlogsByCategorySlugQuery } from '../utils/api';
import BlogCard from '../components/blog/BlogCard';
import { List, LayoutGrid } from "lucide-react";

export default function BlogCategoryPage() {
  const { slug } = useParams();
  const { data, isLoading } = useListBlogsByCategorySlugQuery(slug);

  const blogs = data?.data || [];
  const categoryName = blogs[0]?.categories?.find(c => c.slug === slug)?.name || slug;

  const [layout, setLayout] = useState('list');

  if (isLoading) {
    return <div className="p-10 text-white">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-black py-10">

      {/* HEADER */}
      <div className="px-6 sm:px-10 lg:px-12 mb-8">
        <Link
          to="/dashboard/blog"
          className="text-sm text-white/70 hover:text-white"
        >
          ← All articles
        </Link>

        <div className="flex items-center justify-between mt-4">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white capitalize">
            {categoryName}
          </h1>

          {/* LAYOUT TOGGLE */}
          <div className="px-6 sm:px-10 lg:px-12 mb-6 flex justify-end gap-2">
        <button
          onClick={() => setLayout("list")}
          className={`p-2 rounded transition ${
            layout === "list"
              ? "bg-secondary text-black"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
          aria-label="List view"
        >
          <List size={18} />
        </button>

        <button
          onClick={() => setLayout("grid")}
          className={`p-2 rounded transition ${
            layout === "grid"
              ? "bg-secondary text-black"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
          aria-label="Grid view"
        >
          <LayoutGrid size={18} />
        </button>
      </div>
        </div>
      </div>

      {/* EMPTY */}
      {blogs.length === 0 && (
        <div className="px-6 sm:px-10 lg:px-12 text-white/60">
          No articles found in this category.
        </div>
      )}

      {/* LIST */}
      <div
        className={`px-6 sm:px-10 lg:px-12 pb-20 ${
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-12'
        }`}
      >
        {blogs.map(blog => (
          <BlogCard
            key={blog.id}
            blog={blog}
            variant={layout}
          />
        ))}
      </div>
    </div>
  );
}
