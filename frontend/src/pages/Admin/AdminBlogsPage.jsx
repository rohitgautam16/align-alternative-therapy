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

export default function AdminBlogsPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useListBlogsAdminQuery();

  const [publishBlog] = usePublishBlogAdminMutation();
  const [unpublishBlog] = useUnpublishBlogAdminMutation();
  const [archiveBlog] = useArchiveBlogAdminMutation();
  const [unarchiveBlog] = useUnarchiveBlogAdminMutation();
  const [deleteBlog] = useDeleteBlogAdminMutation();

  const [tab, setTab] = useState('all');

  const filtered = useMemo(() => {
    if (!data?.data) return [];

    return data.data
      .filter(b => {
        if (tab === 'draft') return b.status === 'draft' && !b.archived;
        if (tab === 'published') return b.status === 'published' && !b.archived;
        if (tab === 'archived') return b.archived === 1;
        return true;
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [data, tab]);

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
        <button
          onClick={() => navigate('/admin/blogs/new')}
          className="bg-secondary text-black px-4 py-2 rounded-full"
        >
          New Post
        </button>
      </div>

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
        <div className="text-white/60">No blogs in this category.</div>
      )}

      {/* LIST */}
      <div className="space-y-3">
        {filtered.map(b => (
          <div
            key={b.id}
            className="border border-white/10 p-4 rounded-lg flex justify-between items-center"
          >
            {/* LEFT */}
            <div className="flex flex-col">
              <div className="font-medium text-white">
                {b.title || '(untitled)'}
              </div>
              <div className="text-sm text-white/60">
                {b.slug} • {b.author || '—'}
              </div>

              <div className="flex gap-2 mt-1">
                {b.archived ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white">
                    Archived
                  </span>
                ) : (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      b.status === 'published'
                        ? 'bg-green-600 text-black'
                        : 'bg-yellow-500 text-black'
                    }`}
                  >
                    {b.status}
                  </span>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2">

              <button
                onClick={() => navigate(`/dashboard/admin/blogs/${b.id}`)}
                className="bg-white/10 text-white px-3 py-1 rounded-full text-sm"
              >
                Edit
              </button>

              {/* Publish / Unpublish */}
              {!b.archived && b.status === 'draft' && (
                <button
                  onClick={() => handlePublish(b.id)}
                  className="bg-green-600 text-black px-3 py-1 rounded-full text-sm"
                >
                  Publish
                </button>
              )}

              {!b.archived && b.status === 'published' && (
                <button
                  onClick={() => handleUnpublish(b.id)}
                  className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm"
                >
                  Unpublish
                </button>
              )}

              {/* Archive / Unarchive */}
              {!b.archived && (
                <button
                  onClick={() => handleArchive(b.id)}
                  className="bg-white/10 text-white px-3 py-1 rounded-full text-sm"
                >
                  Archive
                </button>
              )}

              {b.archived && (
                <button
                  onClick={() => handleUnarchive(b.id)}
                  className="bg-secondary text-black px-3 py-1 rounded-full text-sm"
                >
                  Unarchive
                </button>
              )}

              {/* Delete */}
              {b.archived && (
                <button
                  onClick={() => handleDelete(b.id)}
                  className="bg-red-600 text-black px-3 py-1 rounded-full text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
