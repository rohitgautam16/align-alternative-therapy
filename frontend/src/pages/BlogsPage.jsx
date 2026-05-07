import { useState } from 'react';
import { useListBlogsPublicQuery } from '../utils/api';
import BlogCard from '../components/blog/BlogCard';
import { List, LayoutGrid } from "lucide-react";
import useDocumentMeta from '../hooks/useDocumentMeta';

const BlogsPage = () => {
  useDocumentMeta({
    title: 'Member Blog',
    description:
      'Explore member articles from Align on sound healing, frequency therapy, therapeutic audio, sleep, focus, and holistic well-being.',
    path: '/dashboard/blog',
    robots: 'noindex,nofollow',
  });

  const { data, isLoading } = useListBlogsPublicQuery();
  const blogs = data?.data || [];

  const [layout, setLayout] = useState('list'); // list | grid

  if (isLoading) {
    return <div className="p-10 text-white">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-black py-10">

      {/* HERO */}
      <div className="w-full flex items-center justify-center mb-10 px-6 sm:px-10 lg:px-12 py-10">
        <div className="space-y-8 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white">
            DIVE INTO OUR ARTICLES
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-md mx-auto">
            Discover information on therapy, healing sounds, and holistic well-being.
          </p>
        </div>
      </div>

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

      {/* BLOG LIST */}
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
};

export default BlogsPage;
