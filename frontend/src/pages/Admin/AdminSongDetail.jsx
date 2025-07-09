import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminSongQuery,
  useUpdateAdminSongMutation,
  useDeleteAdminSongMutation,
  useListCategoriesQuery,
  useListPlaylistsQuery,
} from '../../utils/api';
import { ArrowLeft, Save, Trash2, Edit3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminSongDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  // Fetch song data
  const { data: song, isLoading, isError } = useGetAdminSongQuery(id);

  // Fetch categories and playlists for dropdowns
  const { data: catRaw = { data: [] } } = useListCategoriesQuery({ page: 1, pageSize: 100 });
  const { data: plRaw = { data: [] } } = useListPlaylistsQuery({ page: 1, pageSize: 100 });

  // Ensure arrays for safe operations
  const categories = catRaw.data || [];
  const playlists = plRaw.data || [];

  const [updateSong, { isLoading: saving }] = useUpdateAdminSongMutation();
  const [deleteSong] = useDeleteAdminSongMutation();

  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [succ, setSucc] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (song) {
      setForm({
        name: song.name || '',
        title: song.title || '',
        slug: song.slug || '',
        artist: song.artist || '',
        tags: song.tags || '',
        category: song.category || '', // this should match category id type (string or number)
        playlist: song.playlistId || '',
        artwork_filename: song.image || '',
        cdn_url: song.audioUrl || '',
      });
    }
  }, [song]);

  useEffect(() => {
    if (succ || err) {
      const timer = setTimeout(() => {
        setSucc('');
        setErr('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [succ, err]);

  const save = async () => {
    try {
      await updateSong({ id, ...form }).unwrap();
      setSucc('Updated');
      setEditMode(false);
    } catch (e) {
      console.error(e);
      setErr('Save failed');
    }
  };

  const confirmDel = () => setShowDel(true);
  const cancelDel = () => setShowDel(false);

  const del = async () => {
    try {
      await deleteSong(id).unwrap();
      setSucc('Deleted');
      setShowDel(false);
      setTimeout(() => nav('/admin/songs'), 500);
    } catch (e) {
      console.error(e);
      setErr('Delete failed');
      setShowDel(false);
    }
  };

  if (isLoading) return <div className="p-6 text-white">Loading…</div>;
  if (isError || !song) return <div className="p-6 text-red-500">Error loading song</div>;
  if (!form) return null;

  return (
    <div className="p-6 text-white space-y-6">
      {/* Header */}
      <div className="flex justify-between">
        <button onClick={() => nav(-1)} className="flex gap-2 text-gray-300 hover:text-white">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setEditMode(e => !e)}
            className="flex items-center gap-1 bg-gray-700 px-3 py-1 rounded"
          >
            <Edit3 size={16} />
            {editMode ? 'Cancel' : 'Edit'}
          </button>
          {editMode && (
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <button
            onClick={confirmDel}
            className="flex items-center gap-1 bg-red-600 px-3 py-1 rounded"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Banners */}
      {succ && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 bg-green-600 rounded">
          {succ}
        </motion.div>
      )}
      {err && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 bg-red-600 rounded">
          {err}
        </motion.div>
      )}

      {/* Form */}
      <div className="bg-gray-800 p-6 rounded space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-gray-400 mb-1">Name</label>
            {editMode ? (
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{song.name || '—'}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-400 mb-1">Title</label>
            {editMode ? (
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{song.title || '—'}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-gray-400 mb-1">Slug</label>
            {editMode ? (
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{song.slug || '—'}</p>
            )}
          </div>

          {/* Artist */}
          <div>
            <label className="block text-gray-400 mb-1">Artist</label>
            {editMode ? (
              <input
                value={form.artist}
                onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{song.artist || '—'}</p>
            )}
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Tags</label>
            {editMode ? (
              <input
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{song.tags || '—'}</p>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-gray-400 mb-1">Category</label>
            {editMode ? (
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
            ) : (
              <p>{categories.find(c => c.id === Number(form.category))?.name || '—'}</p>
            )}
          </div>

          {/* Playlist Dropdown */}
          <div>
            <label className="block text-gray-400 mb-1">Playlist</label>
            {editMode ? (
              <select
                value={form.playlist}
                onChange={e => setForm(f => ({ ...f, playlist: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              >
                <option value="">Select playlist</option>
                {playlists.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            ) : (
              <p>{playlists.find(p => p.id === Number(form.playlist))?.title || '—'}</p>
            )}
          </div>

          {/* Artwork Filename */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Artwork Filename</label>
            {editMode ? (
              <input
                value={form.artwork_filename}
                onChange={e => setForm(f => ({ ...f, artwork_filename: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{song.image || '—'}</p>
            )}
          </div>

          {/* Audio URL */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Audio URL</label>
            {editMode ? (
              <input
                value={form.cdn_url}
                onChange={e => setForm(f => ({ ...f, cdn_url: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>
                {song.audioUrl ? (
                  <a
                    href={song.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-400"
                  >
                    Listen
                  </a>
                ) : (
                  '—'
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDel && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDel}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="bg-gray-900 p-6 rounded space-y-4 max-w-sm w-full">
                <h3 className="text-lg text-white font-semibold">Delete Song?</h3>
                <p className="text-gray-300">Cannot undo.</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelDel}
                    className="px-4 py-2 bg-gray-700 rounded text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={del}
                    className="px-4 py-2 bg-red-600 rounded text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
