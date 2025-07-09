// src/pages/Admin/AdminPlaylistsOverview.jsx
import React, { useState, useEffect } from 'react';
import {
  useListPlaylistsQuery,
  useCreatePlaylistMutation,
  useListCategoriesQuery
} from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, List, Eye, Plus } from 'lucide-react';

export default function AdminPlaylistsOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('grid');
  const pageSize = 6;

  // Fetch paged playlists
  const {
    data: plRaw,
    isLoading: plLoading,
    isError: plError,
    error: plErrorObj,
    refetch: refetchPlaylists,
  } = useListPlaylistsQuery({ page, pageSize });

  // Fetch categories for dropdown
  const { data: catRaw = { data: [] } } = useListCategoriesQuery({
    page: 1,
    pageSize: 100,
  });

  // Create new playlist
  const [createPlaylist, { isLoading: creating }] =
    useCreatePlaylistMutation();

  // Form state
  const [newP, setNewP] = useState({
    title: '',
    slug: '',
    tags: '',
    artwork_filename: '',
    category_id: '',
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Normalize data
  const playlists = Array.isArray(plRaw?.data) ? plRaw.data : [];
  const serverPage = plRaw?.page ?? 1;
  const serverTotal = plRaw?.total ?? 0;
  const totalPages  = Math.ceil(serverTotal / pageSize);
  const categories = Array.isArray(catRaw.data) ? catRaw.data : [];

  // Clear banners after 3s
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Handle creation
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createPlaylist(newP).unwrap();
      setSuccessMsg('Playlist created.');
      setNewP({
        title: '',
        slug: '',
        tags: '',
        artwork_filename: '',
        category_id: '',
      });
      refetchPlaylists();
    } catch (err) {
      console.error('Create playlist error:', err);
      setErrorMsg('Failed to create playlist.');
    }
  };

  // Pagination handlers
  const goPrev = () => setPage(Math.max(1, serverPage - 1));
  const goNext = () => setPage(Math.min(totalPages, serverPage + 1));

  return (
    <div className="p-6 text-white space-y-6">
      {/* Success & Error Banners */}
      {successMsg && <div className="p-2 bg-green-600 rounded">{successMsg}</div>}
      {errorMsg && <div className="p-2 bg-red-600 rounded">{errorMsg}</div>}

      {/* Create New Playlist Form */}
      <form
        onSubmit={handleCreate}
        className="bg-gray-800 p-4 rounded space-y-4"
      >
        <h3 className="text-lg flex items-center gap-2">
          <Plus size={20} /> Create New Playlist
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Title"
            value={newP.title}
            onChange={(e) => setNewP({ ...newP, title: e.target.value })}
            required
            className="p-2 bg-gray-700 rounded w-full"
          />
          <input
            placeholder="Slug"
            value={newP.slug}
            onChange={(e) => setNewP({ ...newP, slug: e.target.value })}
            required
            className="p-2 bg-gray-700 rounded w-full"
          />
          <input
            placeholder="Tags"
            value={newP.tags}
            onChange={(e) => setNewP({ ...newP, tags: e.target.value })}
            className="p-2 bg-gray-700 rounded w-full"
          />
          <input
            placeholder="Artwork filename"
            value={newP.artwork_filename}
            onChange={(e) =>
              setNewP({ ...newP, artwork_filename: e.target.value })
            }
            className="p-2 bg-gray-700 rounded w-full"
          />
          {/* Category Dropdown */}
          <select
            value={newP.category_id}
            onChange={(e) => setNewP({ ...newP, category_id: e.target.value })}
            required
            className="p-2 bg-gray-700 rounded w-full"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} (#{c.id})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create Playlist'}
        </button>
      </form>

      {/* Header with View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Playlists</h2>
        <button
          onClick={() => setViewType((v) => (v === 'grid' ? 'list' : 'grid'))}
          className="flex items-center gap-1 bg-gray-700 px-3 py-2 rounded"
        >
          {viewType === 'grid' ? <List size={18} /> : <Grid3X3 size={18} />}
          Toggle View
        </button>
      </div>

      {/* Loading / Error */}
      {plLoading && <p>Loading playlists…</p>}
      {plError && (
        <p className="text-red-500">
          Error: {plErrorObj?.data?.error || 'Failed to load playlists'}
        </p>
      )}

      {/* Playlists List/Grid */}
      <div
        className={`grid gap-4 ${
          viewType === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {playlists.map((p) => (
          <div
            key={p.id}
            className="bg-gray-800 p-4 rounded flex flex-col gap-2"
          >
            <div className="font-medium">{p.title}</div>
            <div className="text-sm text-gray-400">{p.slug}</div>
            <button
              className="mt-auto flex items-center gap-1 text-blue-400 hover:underline"
              onClick={() => navigate(`/admin/playlists/${p.id}`)}
            >
              <Eye size={16} /> View / Edit
            </button>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={goPrev}
          disabled={serverPage === 1}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          {serverPage} / {totalPages}
        </span>
        <button
          onClick={goNext}
          disabled={serverPage === totalPages}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
