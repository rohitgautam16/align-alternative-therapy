import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useListBlogsAdminQuery,
  usePublishBlogAdminMutation,
  useUnpublishBlogAdminMutation,
  useArchiveBlogAdminMutation,
  useUnarchiveBlogAdminMutation,
  useDeleteBlogAdminMutation,
} from '../../utils/api';
import BlogCard from '../../components/admin/BlogCard.jsx';

export default function AdminBlogsPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useListBlogsAdminQuery();

  const [publishBlog] = usePublishBlogAdminMutation();
  const [unpublishBlog] = useUnpublishBlogAdminMutation();
  const [archiveBlog] = useArchiveBlogAdminMutation();
  const [unarchiveBlog] = useUnarchiveBlogAdminMutation();
  const [deleteBlog] = useDeleteBlogAdminMutation();

  const [tab, setTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState(null); // {id, name, slug}

  const blogs = data?.data || [];

  // computed filtered list
  const filtered = useMemo(() => {
    return blogs
      .filter(b => {
        // status logic
        if (tab === 'draft') return b.status === 'draft' && !b.archived;
        if (tab === 'published') return b.status === 'published' && !b.archived;
        if (tab === 'archived') return b.archived === 1;

        // tab === all
        return true;
      })
      .filter(b => {
        // category filter logic
        if (!categoryFilter) return true;
        return Array.isArray(b.categories) &&
          b.categories.some(c => c.id === categoryFilter.id);
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [blogs, tab, categoryFilter]);

  const handlePublish = async (id) => {
    await publishBlog(id).unwrap();
    refetch();
  };

  const handleUnpublish = async (id) => {
    await unpublishBlog(id).unwrap();
    refetch();
  };

  const handleArchive = async (id) => {
    await archiveBlog(id).unwrap();
    refetch();
  };

  const handleUnarchive = async (id) => {
    await unarchiveBlog(id).unwrap();
    refetch();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog permanently?')) return;
    await deleteBlog(id).unwrap();
    refetch();
  };

  if (isLoading) return <div className="p-6 text-white">Loading…</div>;

  return (
    <div className="p-6 space-y-6 text-white">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Blog Posts</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/blog-categories')}
            className="bg-white/10 text-white px-4 py-2 rounded-full"
          >
            Manage Categories
          </button>
          <button
            onClick={() => navigate('/admin/blogs/new')}
            className="bg-secondary text-black px-4 py-2 rounded-full"
          >
            New Post
          </button>
        </div>
      </div>

      {/* CATEGORY FILTER CHIP */}
      {categoryFilter && (
        <div className="flex gap-2 items-center">
          <span className="text-sm px-3 py-1 rounded-full bg-secondary text-black">
            {categoryFilter.name}
          </span>
          <button
            className="text-white/70 text-sm"
            onClick={() => setCategoryFilter(null)}
          >
            Clear Filter ✕
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2">
        {['all', 'draft', 'published', 'archived'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded ${
              tab === t ? 'bg-secondary text-black' : 'bg-white/10 text-white'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="text-white/60">
          {categoryFilter
            ? `No blogs in this category.`
            : `No blogs found.`}
        </div>
      )}


{/* GRID */}
<div className="
  grid gap-4
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
">
  {filtered.map(b => (
    <BlogCard
      key={b.id}
      blog={b}
      onPublish={handlePublish}
      onUnpublish={handleUnpublish}
      onArchive={handleArchive}
      onUnarchive={handleUnarchive}
      onDelete={handleDelete}
      onCategoryClick={setCategoryFilter}
    />
  ))}
</div>


    </div>
  );
}
