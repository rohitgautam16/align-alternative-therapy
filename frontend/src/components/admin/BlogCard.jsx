import React from 'react';
import { useNavigate } from 'react-router-dom';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop&auto=format&q=60';


export default function BlogCard({
  blog,
  onPublish,
  onUnpublish,
  onArchive,
  onUnarchive,
  onDelete,
  onCategoryClick,
}) {
  const navigate = useNavigate();

  const {
    id,
    title,
    slug,
    author,
    status,
    archived,
    cover_image,
    categories = [],
  } = blog;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 flex flex-col">

      {/* IMAGE */}
      <div className="w-full aspect-[3/2] bg-white/5 overflow-hidden">
        <img
          src={cover_image || PLACEHOLDER}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER;
          }}
        />
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* TITLE */}
        <div className="text-lg font-medium text-white line-clamp-2">
          {title || '(untitled)'}
        </div>

        {/* META */}
        <div className="text-sm text-white/60">
          {slug} • {author || '—'}
        </div>

        {/* CATEGORIES */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(c => (
                <button
                  key={c.id}
                  onClick={() => onCategoryClick?.(c)}
                  className="text-xs px-2 py-1 rounded-full bg-white/10 text-white hover:bg-secondary hover:text-black transition"
                >
                  {c.name}
                </button>
              ))}
          </div>
        )}

        {/* STATUS */}
        <div>
          {archived ? (
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white">
              Archived
            </span>
          ) : (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                status === 'published'
                  ? 'bg-green-600 text-black'
                  : 'bg-yellow-500 text-black'
              }`}
            >
              {status}
            </span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-white/10">

          <button
            onClick={() => navigate(`/admin/blogs/${id}`)}
            className="bg-white/10 text-white px-3 py-1 rounded-full text-sm"
          >
            Edit
          </button>

          {!archived && status === 'draft' && (
            <button
              onClick={() => onPublish(id)}
              className="bg-green-600 text-black px-3 py-1 rounded-full text-sm"
            >
              Publish
            </button>
          )}

          {!archived && status === 'published' && (
            <button
              onClick={() => onUnpublish(id)}
              className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm"
            >
              Unpublish
            </button>
          )}

          {!archived && (
            <button
              onClick={() => onArchive(id)}
              className="bg-white/10 text-white px-3 py-1 rounded-full text-sm"
            >
              Archive
            </button>
          )}

          {archived && (
            <>
              <button
                onClick={() => onUnarchive(id)}
                className="bg-secondary text-black px-3 py-1 rounded-full text-sm"
              >
                Unarchive
              </button>

              <button
                onClick={() => onDelete(id)}
                className="bg-red-600 text-black px-3 py-1 rounded-full text-sm"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
