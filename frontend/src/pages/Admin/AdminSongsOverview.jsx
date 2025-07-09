import React, { useEffect, useState } from 'react';
import {
  useGetAdminSongsQuery,
  useCreateAdminSongMutation,
} from '../../utils/api';
import {
  useListCategoriesQuery,
  useListPlaylistsQuery,
} from '../../utils/api';
import { Eye, Grid3X3, List, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSongsOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('grid');
  const pageSize = 6;

  // Songs
  const {
    data: rawData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminSongsQuery({ page, pageSize: 50 });

  console.log(rawData)

  // Categories (for dropdown)
  const { data: catRaw = { data: [] } } = useListCategoriesQuery({
    page: 1,
    pageSize: 100,
  });

  // Playlists (for dropdown)
  const { data: plRaw = { data: [] } } = useListPlaylistsQuery({
    page: 1,
    pageSize: 100,
  });

  // Create
  const [createSong, { isLoading: creating }] = useCreateAdminSongMutation();

  // Form state
  const [form, setForm] = useState({
    name: '',
    title: '',
    slug: '',
    artist: '',
    tags: '',
    category: '',
    playlist: '',
    artwork_filename: '',
    cdn_url: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const songs = Array.isArray(rawData?.data) ? rawData.data : [];
  const totalPages = Math.ceil((rawData?.total || 0) / pageSize);
  const categories = catRaw?.data || [];
  const playlists = plRaw?.data || [];

  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  const toggleView = () => {
    setViewType((prev) => (prev === 'grid' ? 'list' : 'grid'));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSong(form).unwrap();
      setSuccessMsg('Song created.');
      setForm({
        name: '',
        title: '',
        slug: '',
        artist: '',
        tags: '',
        category: '',
        playlist: '',
        artwork_filename: '',
        cdn_url: '',
      });
      refetch();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create song.');
    }
  };

  return (
    <div className="p-6 text-white space-y-6">
      {/* Status */}
      {successMsg && <div className="bg-green-600 p-2 rounded">{successMsg}</div>}
      {errorMsg && <div className="bg-red-600 p-2 rounded">{errorMsg}</div>}

      {/* Create Form */}
      <form
        onSubmit={handleCreate}
        className="bg-gray-800 p-4 rounded space-y-4"
      >
        <h3 className="text-lg flex items-center gap-2">
          <Plus size={20} /> Create New Song
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="p-2 bg-gray-700 rounded"
          />
          <input
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
            className="p-2 bg-gray-700 rounded"
          />
          <input
            placeholder="Artist"
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            placeholder="Artwork filename"
            value={form.artwork_filename}
            onChange={(e) =>
              setForm({ ...form, artwork_filename: e.target.value })
            }
            className="p-2 bg-gray-700 rounded"
          />
          <input
            placeholder="Audio URL (CDN)"
            value={form.cdn_url}
            onChange={(e) => setForm({ ...form, cdn_url: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} (#{c.id})
              </option>
            ))}
          </select>

          <select
            value={form.playlist}
            onChange={(e) => setForm({ ...form, playlist: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          >
            <option value="">Select Playlist</option>
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (#{p.id})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create Song'}
        </button>
      </form>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Songs</h2>
        <button
          onClick={toggleView}
          className="flex items-center gap-1 bg-gray-700 px-3 py-2 rounded"
        >
          {viewType === 'grid' ? <List size={18} /> : <Grid3X3 size={18} />}
          Toggle View
        </button>
      </div>

      {/* Loading/Error */}
      {isLoading && <p>Loading…</p>}
      {isError && (
        <p className="text-red-500">
          Error: {error?.data?.error || 'Failed to load songs'}
        </p>
      )}

      {/* Grid/List View */}
      <div
        className={`grid gap-4 ${
          viewType === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {songs.map((s) => (
          <div
            key={s.id}
            className="bg-gray-800 p-4 rounded flex flex-col gap-2"
          >
            <div className="font-medium">{s.title}</div>
            <div className="text-sm text-gray-400">{s.slug}</div>
            <button
              className="mt-auto flex items-center gap-1 text-blue-400"
              onClick={() => navigate(`/admin/songs/${s.id}`)}
            >
              <Eye size={16} /> View / Edit
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
