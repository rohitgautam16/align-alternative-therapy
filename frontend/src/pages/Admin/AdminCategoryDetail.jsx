// src/pages/Admin/AdminCategoryDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminCategoryQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetDashboardAllPlaylistsQuery,
  useUpdatePlaylistMutation,
  useUploadR2FilesMutation
} from '../../utils/api';
import { ArrowLeft, Edit3, Save, Trash2, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AdminPlaylistCard from '../../components/custom-ui/AdminPlaylistCard';

export default function AdminCategoryDetail() {
  const { id: categoryId } = useParams();
  const navigate = useNavigate();


  const [uploadFiles, { isLoading: uploading }] = useUploadR2FilesMutation();

  const [selectedArtFile, setSelectedArtFile] = useState(null);

  // Fetch category + playlists
  const { data: cat, isLoading: catL, isError: catE, refetch: refetchCat, } =
    useGetAdminCategoryQuery(categoryId);
  const {
    data: allPLs = [],
    isLoading: plsL,
    isError: plsE,
    refetch: refetchPLs,
  } = useGetDashboardAllPlaylistsQuery();

  // Mutations
  const [updateCategory, { isLoading: catSaving }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [updatePlaylist] = useUpdatePlaylistMutation();

  // Local state
  const [form, setForm]       = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [flash, setFlash]     = useState({ txt: '', ok: true });
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [showAvailable, setShowAvailable] = useState(false);

  // init form
  useEffect(() => {
    if (cat) {
      setForm({
        title: cat.title,
        slug: cat.slug,
        tags: cat.tags || '',
        artwork_filename:  cat.image || '',
      });
    }
  }, [cat]);

  // clear flash
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  if (catL || plsL) return <div className="p-6 text-white">Loading…</div>;
  if (catE)        return <div className="p-6 text-red-500">Error loading category.</div>;

  // split lists
  const assigned  = allPLs.filter(p => p.categoryId === +categoryId);
  const available = allPLs.filter(p => p.categoryId !== +categoryId);

  const handleArtworkUpload = async () => {
    if (!selectedArtFile) return;
    setFlash({ txt: 'Uploading image…', ok: true });
    try {
      // 1) Upload to R2
      const res = await uploadFiles({
        prefix: 'align-images/categories',
        files: [selectedArtFile],
      }).unwrap();

      console.log('Upload response:', res);

      // 2) Extract the key
      const uploadedArray = res.uploaded || res; // depending on your API
      const key = uploadedArray?.[0]?.key;
      if (!key) throw new Error('No key returned from upload');

      // 3) Build the public URL
      const publicUrl = `https://cdn.align-alternativetherapy.com/${key}`;

      console.log('Setting artwork_filename to:', publicUrl);

      // 4) Update your form state
      setForm(f => ({ ...f, artwork_filename: publicUrl }));
      setFlash({ txt: 'Image uploaded!', ok: true });

      // Clear file input
      setSelectedArtFile(null);
      document.getElementById('cat-artwork-upload').value = '';
    } catch (err) {
      console.error('Upload failed or malformed response:', err);
      setFlash({ txt: 'Upload failed.', ok: false });
    }
  };

  // handlers
  const saveCategory = async () => {
    try {
      await updateCategory({ id: categoryId, ...form }).unwrap();
      setFlash({ txt: 'Category updated.', ok: true });
      setEditMode(false);
      await refetchCat();
    } catch {
      setFlash({ txt: 'Update failed.', ok: false });
    }
  };
  const removeCategory = async () => {
    try {
      await deleteCategory(categoryId).unwrap();
      setFlash({ txt: 'Deleted.', ok: true });
      setTimeout(() => navigate('/admin/categories'), 500);
    } catch {
      setFlash({ txt: 'Delete failed.', ok: false });
    }
  };
  const togglePlaylist = async (pl, toAssign) => {
    setTogglingId(pl.id);
    try {
      await updatePlaylist({
        id: pl.id,
        title: pl.name,
        slug: pl.slug,
        tags: pl.tags ?? '',
        artwork_filename: pl.image ?? '',
        category_id: toAssign ? categoryId : null,
        paid: pl.paid,
      }).unwrap();
      setFlash({ txt: toAssign ? `Added “${pl.name}”` : `Removed “${pl.name}”`, ok: true });
      await refetchPLs();
    } catch {
      setFlash({ txt: 'Operation failed', ok: false });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-6 text-white space-y-8">
      {/* Flash */}
      <AnimatePresence>
        {flash.txt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate  ={{ opacity: 1, y: 0 }}
            exit     ={{ opacity: 0, y: -10 }}
            className={`p-2 text-center ${flash.ok ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {flash.txt}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setEditMode(e => !e)}
            className="flex items-center gap-1 bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
          >
            <Edit3 size={16} /> {editMode ? 'Cancel' : 'Edit'}
          </button>
          {editMode && (
            <button
              onClick={saveCategory}
              disabled={catSaving}
              className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded disabled:opacity-50 hover:bg-blue-500"
            >
              <Save size={16} /> Save
            </button>
          )}
          <button
            onClick={() => setDeleting(true)}
            className="flex items-center gap-1 bg-red-600 px-3 py-1 rounded hover:bg-red-500"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Form & Artwork */}
      <div className="bg-gray-800 rounded-lg flex flex-col md:flex-row gap-6">
  {/* Form */}
  <div className="flex-1 p-6 space-y-4 order-last md:order-first">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {['title', 'slug'].map(field => (
        <div key={field}>
          <label className="block text-gray-400 mb-1">
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </label>
          {editMode ? (
            <input
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              className="w-full p-2 bg-gray-700 rounded text-white"
            />
          ) : (
            <p>{cat[field]}</p>
          )}
        </div>
      ))}
      <div className="md:col-span-2">
        <label className="block text-gray-400 mb-1">Tags</label>
        {editMode ? (
          <input
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        ) : (
          <p>{cat.tags || '—'}</p>
        )}
      </div>
      <div className="md:col-span-2 overflow-clip">
        <label className="block text-gray-400 mb-1">Artwork URL</label>

        {editMode ? (
          <>
            {/* Text link input */}
            <input
              type="text"
              value={form.artwork_filename}
              onChange={e => setForm(f => ({ ...f, artwork_filename: e.target.value }))}
              placeholder="https://cdn.example.com/img.jpg"
              className="w-full p-2 bg-gray-700 rounded text-white mb-2"
            />

            {/* File chooser */}
            <input
              id="cat-artwork-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setSelectedArtFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="cat-artwork-upload"
              className="inline-block px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm mr-2"
            >
              Choose File: 
              {selectedArtFile && (
                <span className="text-sm text-gray-300"> {selectedArtFile.name}</span>
              )}
            </label>

            {/* Upload button */}
            <button
              onClick={handleArtworkUpload}
              disabled={uploading}
              className="px-3 py-1 bg-blue-600 rounded text-sm disabled:opacity-50 hover:bg-blue-500"
            >
              {uploading ? 'Uploading…' : 'Upload Image'}
            </button>
          </>
        ) : (
          <p>{cat.image || '—'}</p>
        )}
      </div>
    </div>
  </div>

  {/* Artwork - Top on mobile, right on desktop */}
  <div className="w-full md:w-80 h-48 md:h-auto rounded overflow-hidden order-first md:order-last">
    <img
      src={form?.artwork_filename || cat.image || ''}
      alt={cat.title}
      className="w-full h-full object-cover"
    />
  </div>
</div>


      {/* Assigned Playlists */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Playlists in “{cat.title}”</h3>
        {assigned.length === 0 ? (
          <p className="text-gray-400">No playlists here.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
            {assigned.map(pl => {
              const isLoading = togglingId === pl.id;
              const isSuccess = flash.ok && flash.txt === `Removed “${pl.name}”`;
              const isError   = !flash.ok && flash.txt === 'Operation failed';
              return (
                <AdminPlaylistCard
                  key={pl.id}
                  playlist={pl}
                  assigned
                  onView={() => navigate(`/admin/playlists/${pl.id}`)}
                  onToggle={() => togglePlaylist(pl, false)}
                  status={{ loading: isLoading, success: isSuccess, error: isError }}
                />
              );
            })}
          </div>
        )}
      </section>





      {/* Add Playlist Dropdown */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Add to Category</h3>
        <button
          onClick={() => setShowAvailable(v => !v)}
          className="flex items-center gap-1 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          <Plus size={16} /> {showAvailable ? 'Close' : 'Add Playlists…'}
        </button>

        {showAvailable && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mt-4">
            {available.length === 0
              ? <p className="text-gray-400">No playlists available.</p>
              : available.map(pl => {
                  const isLoading = togglingId === pl.id;
                  const isSuccess = flash.ok && flash.txt === `Added “${pl.name}”`;
                  const isError   = !flash.ok && flash.txt === 'Operation failed';
                  return (
                    <AdminPlaylistCard
                      key={pl.id}
                      playlist={pl}
                      assigned={false}
                      onView={() => navigate(`/admin/playlists/${pl.id}`)}
                      onToggle={() => togglePlaylist(pl, true)}
                      status={{ loading: isLoading, success: isSuccess, error: isError }}
                    />
                  );
                })
            }
          </div>
        )}
      </section>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleting && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleting(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="bg-gray-900 p-6 rounded-lg space-y-4 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-white">Delete Category?</h3>
                <p className="text-gray-300">This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeleting(false)}
                    className="px-4 py-2 bg-gray-700 rounded text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={removeCategory}
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
