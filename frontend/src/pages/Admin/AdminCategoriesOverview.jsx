// src/pages/Admin/AdminCategoriesOverview.jsx
import React, { useState, useEffect } from 'react';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation
} from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, List, Eye, Plus } from 'lucide-react';

export default function AdminCategoriesOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('grid'); // or 'list'
  const pageSize = 6;

  // Fetch categories
  const { data, isLoading, isError, error, refetch } =
    useListCategoriesQuery({ page, pageSize });
    console.debug('⚙️ useListCategoriesQuery raw response:', data, 'loading:', isLoading, 'error:', isError);

  // Create mutation
  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();

  // New category form state
  const [newCat, setNewCat] = useState({
    title: '',
    slug: '',
    tags: '',
    artwork_filename: '',
  });

  // Banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Normalize
  const cats = Array.isArray(data?.data) ? data.data : [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  // Clear banners after 3s
  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  // Handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createCategory(newCat).unwrap();
      setSuccessMsg('Category created.');
      setNewCat({ title: '', slug: '', tags: '', artwork_filename: '' });
      refetch();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create.');
    }
  };

  const toggleView = () =>
    setViewType((v) => (v === 'grid' ? 'list' : 'grid'));

  const handlePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  return (
    <div className="p-6 text-white space-y-6">
      {/* Banners */}
      {successMsg && <div className="p-2 bg-green-600 rounded">{successMsg}</div>}
      {errorMsg && <div className="p-2 bg-red-600 rounded">{errorMsg}</div>}

      {/* Create Form */}
      <form
        onSubmit={handleCreate}
        className="bg-gray-800 p-4 rounded space-y-4"
      >
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Plus size={20} /> Create New Category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Title"
            value={newCat.title}
            onChange={(e) => setNewCat({ ...newCat, title: e.target.value })}
            required
            className="p-2 bg-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Slug"
            value={newCat.slug}
            onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
            required
            className="p-2 bg-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Tags (comma sep)"
            value={newCat.tags}
            onChange={(e) => setNewCat({ ...newCat, tags: e.target.value })}
            className="p-2 bg-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Artwork filename"
            value={newCat.artwork_filename}
            onChange={(e) =>
              setNewCat({ ...newCat, artwork_filename: e.target.value })
            }
            className="p-2 bg-gray-700 rounded text-white"
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
        >
          {isCreating ? 'Creating…' : 'Create Category'}
        </button>
      </form>

      {/* Header with toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <button
          onClick={toggleView}
          className="flex items-center gap-1 bg-gray-700 px-3 py-2 rounded"
        >
          {viewType === 'grid' ? <List size={18} /> : <Grid3X3 size={18} />}
          Toggle View
        </button>
      </div>

      {/* Loading / Error */}
      {isLoading && <p>Loading…</p>}
      {isError && (
        <p className="text-red-500">
          Error: {error?.data?.error || 'Failed to load'}
        </p>
      )}

      {/* List/Grid */}
      <div
        className={`grid gap-4 ${
          viewType === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {cats.map((c) => (
          <div
            key={c.id}
            className="bg-gray-800 p-4 rounded shadow flex flex-col gap-2"
          >
            <div className="text-xl font-medium">{c.title}</div>
            <div className="text-gray-400 text-sm">{c.slug}</div>
            <button
              className="mt-auto flex items-center gap-1 text-blue-400 hover:underline"
              onClick={() => navigate(`/admin/categories/${c.id}`)}
            >
              <Eye size={16} /> View / Edit
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handlePage(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => handlePage(page + 1)}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
);
}
