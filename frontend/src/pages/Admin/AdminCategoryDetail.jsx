// src/pages/Admin/AdminCategoryDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminCategoryQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from '../../utils/api';
import { ArrowLeft, Save, Trash2, Edit3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data & mutations
  const { data: cat, isLoading, isError } = useGetAdminCategoryQuery(id);
  const [updateCategory, { isLoading: isSaving }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  // Form & state
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Init form
  useEffect(() => {
    if (cat) {
      setForm({
        title:            cat.title,
        slug:             cat.slug,
        tags:             cat.tags || '',
        artwork_filename: cat.image || ''
      });
    }
  }, [cat]);

  // Clear banners
  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg(''); setErrorMsg('');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  const handleSave = async () => {
    try {
      await updateCategory({ id, ...form }).unwrap();
      setSuccessMsg('Category updated.');
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Update failed.');
    }
  };

  const confirmDelete = () => setShowDeleteModal(true);
  const cancelDelete  = () => setShowDeleteModal(false);

  const handleDelete = async () => {
    try {
      await deleteCategory(id).unwrap();
      setSuccessMsg('Category deleted.');
      setShowDeleteModal(false);
      setTimeout(() => navigate('/admin/categories'), 500);
    } catch (err) {
      console.error(err);
      setErrorMsg('Delete failed.');
      setShowDeleteModal(false);
    }
  };

  if (isLoading) return <div className="p-6 text-white">Loading…</div>;
  if (isError || !cat) return <div className="p-6 text-red-500">Error loading category.</div>;
  if (!form) return null;

  return (
    <div className="p-6 text-white space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft size={20} /> Back to Categories
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setEditMode((e) => !e)}
            className="flex items-center gap-1 bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
          >
            <Edit3 size={16} /> {editMode ? 'Cancel' : 'Edit'}
          </button>
          {editMode && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded disabled:opacity-50"
            >
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
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

      {/* Form */}
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
              <p>{cat.title}</p>
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
              <p>{cat.slug}</p>
            )}
          </div>
          {/* Tags */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Tags (comma‑sep)</label>
            {editMode ? (
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{cat.tags || '—'}</p>
            )}
          </div>
          {/* Artwork filename */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Artwork Filename</label>
            {editMode ? (
              <input
                value={form.artwork_filename}
                onChange={(e) => setForm((f) => ({ ...f, artwork_filename: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            ) : (
              <p>{cat.image || '—'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
            />
            {/* modal */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="bg-gray-900 p-6 rounded-lg space-y-4 max-w-sm w-full">
                <h3 className="text-lg text-white font-semibold">Delete Category?</h3>
                <p className="text-gray-300">
                  This action cannot be undone.
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
