import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminPlaylistQuery,
  useUpdatePlaylistMutation,
  useDeletePlaylistMutation,
  useListCategoriesQuery
} from '../../utils/api';
import { ArrowLeft, Save, Trash2, Edit3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminPlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch playlist + categories
  const { data: p, isLoading, isError, error } = useGetAdminPlaylistQuery(id);
  const { data: catRaw = { data: [] }, isLoading: catLoading } =
    useListCategoriesQuery({ page: 1, pageSize: 100 });

  // Mutations
  const [updatePlaylist, { isLoading: saving }] = useUpdatePlaylistMutation();
  const [deletePlaylist] = useDeletePlaylistMutation();

  // Local form & UI state
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize form (handle both possible field names)
  useEffect(() => {
    if (p) {
      console.debug('⚙️ playlist raw:', p);
      setForm({
        title:            p.title,
        slug:             p.slug,
        tags:             p.tags ?? '',
        artwork_filename: p.image ?? p.artwork_filename ?? '',
        category_id:      p.categoryId ?? p.category_id ?? ''
      });
    }
  }, [p]);

  // Auto‑clear banners
  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  if (isLoading) return <div className="p-6 text-white">Loading…</div>;
  if (isError || !p) {
    return (
      <div className="p-6 text-red-500">
        Error: {error?.data?.error || 'Failed to load playlist'}
      </div>
    );
  }
  if (!form) return null;

  const categories = Array.isArray(catRaw.data) ? catRaw.data : [];
  const selectedCategory = categories.find((c) => c.id === form.category_id);

  // Handlers
  const handleSave = async () => {
    try {
      await updatePlaylist({ id, ...form }).unwrap();
      setSuccessMsg('Playlist updated.');
      setEditMode(false);
    } catch (e) {
      console.error('Update error:', e);
      setErrorMsg('Failed to update playlist.');
    }
  };

  const confirmDelete = () => setShowDeleteModal(true);
  const cancelDelete = () => setShowDeleteModal(false);
  const handleDelete = async () => {
    try {
      await deletePlaylist(id).unwrap();
      setSuccessMsg('Playlist deleted.');
      setTimeout(() => navigate('/admin/playlists'), 500);
    } catch (e) {
      console.error('Delete error:', e);
      setErrorMsg('Failed to delete playlist.');
    }
  };

  return (
    <div className="p-6 text-white space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => setEditMode((e) => !e)}
            className="flex items-center gap-1 bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
          >
            <Edit3 size={16} /> {editMode ? 'Cancel' : 'Edit'}
          </button>
          {editMode && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded hover:bg-blue-500 disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <button
            onClick={confirmDelete}
            className="flex items-center gap-1 bg-red-600 px-3 py-1 rounded hover:bg-red-500"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Banners */}
      {successMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 bg-green-600 rounded">
          {successMsg}
        </motion.div>
      )}
      {errorMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 bg-red-600 rounded">
          {errorMsg}
        </motion.div>
      )}

      {/* Detail Form */}
      <div className="bg-gray-800 p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <label className="block text-gray-400 mb-1">Title</label>
            {editMode ? (
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{p.title}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-gray-400 mb-1">Slug</label>
            {editMode ? (
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{p.slug}</p>
            )}
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Tags</label>
            {editMode ? (
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{p.tags || '—'}</p>
            )}
          </div>

          {/* Artwork Filename */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Artwork Filename</label>
            {editMode ? (
              <input
                value={form.artwork_filename}
                onChange={(e) =>
                  setForm((f) => ({ ...f, artwork_filename: e.target.value }))
                }
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{p.image ?? p.artwork_filename ?? '—'}</p>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Category</label>
            {editMode ? (
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category_id: +e.target.value }))
                }
                className="w-full p-2 bg-gray-700 rounded text-white"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} (#{c.id})
                  </option>
                ))}
              </select>
            ) : (
              <p>{selectedCategory?.title ?? `#${p.categoryId ?? p.category_id}`}</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
            />
            {/* Modal */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="bg-gray-900 p-6 rounded-lg space-y-4 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
                <p className="text-gray-300">
                  Are you sure you want to delete “{p.title}”?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-700 rounded text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
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
