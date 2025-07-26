// src/pages/Admin/AdminCategoryDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminCategoryQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetDashboardAllPlaylistsQuery,
  useUpdatePlaylistMutation,
  useUploadR2FilesMutation,
  useGetR2PresignUrlQuery, // ✅ Added for presigned URL uploads
} from '../../utils/api';
import { ArrowLeft, Edit3, Save, Trash2, Plus, Upload, CheckCircle, Search, Filter } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AdminPlaylistCard from '../../components/custom-ui/AdminPlaylistCard';

export default function AdminCategoryDetail() {
  const { id: categoryId } = useParams();
  const navigate = useNavigate();

  // ✅ FIXED: Move all useState hooks to the top and declare them unconditionally
  const [selectedArtFile, setSelectedArtFile] = useState(null);
  const [artworkKey, setArtworkKey] = useState(null);
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [artworkUploadProgress, setArtworkUploadProgress] = useState(0);
  const [artworkPresignParams, setArtworkPresignParams] = useState(null);
  const [availablePlaylistsSearch, setAvailablePlaylistsSearch] = useState('');
  const [availablePlaylistsSort, setAvailablePlaylistsSort] = useState('title');
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [flash, setFlash] = useState({ txt: '', ok: true });
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [showAvailable, setShowAvailable] = useState(false);

  // ✅ FIXED: All query hooks called unconditionally at the same level
  const { data: cat, isLoading: catL, isError: catE, refetch: refetchCat } =
    useGetAdminCategoryQuery(categoryId);
  
  const {
    data: allPLs = [],
    isLoading: plsL,
    isError: plsE,
    refetch: refetchPLs,
  } = useGetDashboardAllPlaylistsQuery();

  const [updateCategory, { isLoading: catSaving }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [updatePlaylist] = useUpdatePlaylistMutation();
  const [uploadFiles, { isLoading: uploading }] = useUploadR2FilesMutation();

  // ✅ NEW: Use presigned URL hook with conditional skip
  const { data: artworkPresign } = useGetR2PresignUrlQuery(
    artworkPresignParams || {
      filename: "",
      contentType: "",
      folder: "align-images/categories",
    },
    { skip: !artworkPresignParams }
  );

  // ✅ FIXED: All useEffect hooks called unconditionally
  useEffect(() => {
    if (cat) {
      setForm({
        title: cat.title,
        slug: cat.slug,
        tags: cat.tags || '',
        artwork_filename: cat.image || '',
      });
    }
  }, [cat]);

  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  // ✅ NEW: Handle artwork presign response with progress tracking
  useEffect(() => {
    if (!artworkPresign || !selectedArtFile || !artworkPresignParams) return;

    const uploadArtwork = async () => {
      try {
        console.log('🚀 Starting artwork upload:', {
          presignUrl: artworkPresign.url,
          key: artworkPresign.key,
          fileName: selectedArtFile.name,
        });

        setFlash({ txt: "Uploading artwork...", ok: true });
        setArtworkUploadProgress(10); // Initial progress
        
        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 90) + 10; // 10-100%
            setArtworkUploadProgress(percentComplete);
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const publicUrl = `https://cdn.align-alternativetherapy.com/${artworkPresign.key}`;
            console.log('✅ Artwork upload successful:', publicUrl);
            
            setArtworkKey(artworkPresign.key);
            setForm(f => ({ ...f, artwork_filename: publicUrl }));
            setFlash({ txt: "Artwork uploaded successfully!", ok: true });
            setArtworkUploadProgress(100);
            
            // Clear file selection after successful upload
            setSelectedArtFile(null);
            setArtworkPresignParams(null);
            const artInput = document.getElementById('cat-artwork-upload');
            if (artInput) artInput.value = '';
            
            // Delay resetting upload state to keep progress bar visible
            setTimeout(() => {
              setArtworkUploading(false);
              setArtworkUploadProgress(0);
            }, 3000); // Keep visible for 3 seconds
            
          } else {
            throw new Error('Upload failed');
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          throw new Error('Upload failed');
        });

        // Start the upload
        xhr.open('PUT', artworkPresign.url);
        xhr.setRequestHeader('Content-Type', selectedArtFile.type);
        xhr.send(selectedArtFile);
        
      } catch (err) {
        console.error('Artwork upload error:', err);
        setFlash({ txt: `Artwork upload failed: ${err.message}`, ok: false });
        setArtworkUploadProgress(0);
        setArtworkUploading(false); // Reset immediately on error
      }
      // No finally block to avoid immediate state reset
    };

    uploadArtwork();
  }, [artworkPresign, selectedArtFile, artworkPresignParams]);

  // ✅ FIXED: All useMemo hooks called unconditionally at the same level
  const assigned = React.useMemo(() => {
    if (!allPLs || !categoryId) return [];
    return allPLs.filter(p => p.categoryId === +categoryId);
  }, [allPLs, categoryId]);

  const available = React.useMemo(() => {
    if (!allPLs || !categoryId) return [];
    return allPLs.filter(p => p.categoryId !== +categoryId);
  }, [allPLs, categoryId]);

  // ✅ NEW: Filter and sort available playlists
  const filteredAndSortedAvailable = React.useMemo(() => {
    let filtered = available;

    // Apply search filter
    if (availablePlaylistsSearch) {
      const search = availablePlaylistsSearch.toLowerCase();
      filtered = available.filter(playlist => 
        playlist.title?.toLowerCase().includes(search) ||
        playlist.name?.toLowerCase().includes(search) ||
        playlist.slug?.toLowerCase().includes(search) ||
        playlist.tags?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (availablePlaylistsSort) {
        case 'title':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        case 'slug':
          return (a.slug || '').localeCompare(b.slug || '');
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'paid':
          return (b.paid ? 1 : 0) - (a.paid ? 1 : 0); // paid first
        case 'free':
          return (a.paid ? 1 : 0) - (b.paid ? 1 : 0); // free first
        default:
          return 0;
      }
    });

    return sorted;
  }, [available, availablePlaylistsSearch, availablePlaylistsSort]);

  // ✅ Early returns after all hooks are called
  if (catL || plsL) return <div className="p-6 text-white">Loading…</div>;
  if (catE) return <div className="p-6 text-red-500">Error loading category.</div>;
  if (!form) return null;

  // ✅ ENHANCED: Manual artwork upload handler with presigned URL and progress
  const handleArtworkUpload = async () => {
    if (!selectedArtFile) return;
    
    setArtworkUploading(true);
    setArtworkUploadProgress(5); // Set initial progress
    setFlash({ txt: "Getting upload URL...", ok: true });
    
    try {
      // Trigger the presign query by setting params
      setArtworkPresignParams({
        filename: selectedArtFile.name,
        contentType: selectedArtFile.type,
        folder: "align-images/categories",
      });
    } catch (err) {
      console.error('Upload error:', err);
      setFlash({ txt: `Artwork upload failed: ${err.message}`, ok: false });
      setArtworkUploading(false);
      setArtworkUploadProgress(0);
    }
  };

  // Handler functions (kept exactly the same)
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
      setFlash({ txt: toAssign ? `Added "${pl.name}"` : `Removed "${pl.name}"`, ok: true });
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
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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

            {/* ✅ Enhanced Artwork Upload with Progress Bar */}
            <div className="md:col-span-2 overflow-clip">
              <label className="block text-gray-400 mb-1">Artwork URL</label>

              {editMode ? (
                <div className="space-y-2">
                  {/* Text link input */}
                  <input
                    type="text"
                    value={form.artwork_filename}
                    onChange={e => setForm(f => ({ ...f, artwork_filename: e.target.value }))}
                    placeholder="https://cdn.example.com/img.jpg"
                    className="w-full p-2 bg-gray-700 rounded text-white"
                  />

                  {/* File selection */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="cat-artwork-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setSelectedArtFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="cat-artwork-upload"
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm flex-1 sm:flex-none"
                    >
                      <Upload size={14} />
                      <span className="truncate">
                        {selectedArtFile ? selectedArtFile.name : 'Choose Image'}
                      </span>
                    </label>
                    
                    {/* Status indicator */}
                    {artworkKey && (
                      <div className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded text-sm">
                        <CheckCircle size={14} />
                        <span>Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* ✅ Progress bar */}
                  {artworkUploading && (
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">
                          {artworkUploadProgress === 0 ? 'Preparing upload...' : 
                           artworkUploadProgress === 100 ? 'Upload Complete!' : 'Uploading...'}
                        </span>
                        <span className="text-xs text-gray-400">{artworkUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ease-out ${
                            artworkUploadProgress === 100 ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.max(artworkUploadProgress, 5)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload button */}
                  {selectedArtFile && !artworkKey && (
                    <button
                      type="button"
                      onClick={handleArtworkUpload}
                      disabled={artworkUploading}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm transition-colors"
                    >
                      {artworkUploading ? `Uploading... ${artworkUploadProgress}%` : 'Upload Artwork'}
                    </button>
                  )}
                </div>
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
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNTIgNzBIMTY4VjExMEgxNTJWNzBaIiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0xMzYgODZIMTg0VjEwNEgxMzZWODZaIiBmaWxsPSIjNkI3MjgwIi8+PC9nPgo8L3N2Zz4=';
            }}
          />
        </div>
      </div>

      {/* Assigned Playlists */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Playlists in "{cat.title}"</h3>
        {assigned.length === 0 ? (
          <p className="text-gray-400">No playlists here.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
            {assigned.map(pl => {
              const isLoading = togglingId === pl.id;
              const isSuccess = flash.ok && flash.txt === `Removed "${pl.name}"`;
              const isError = !flash.ok && flash.txt === 'Operation failed';
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

      {/* ✅ Enhanced Add Playlist Section with Search and Sort */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Add to Category</h3>
        <button
          onClick={() => setShowAvailable(v => !v)}
          className="flex items-center gap-1 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          <Plus size={16} /> {showAvailable ? 'Close' : 'Add Playlists…'}
        </button>

        {showAvailable && (
          <div className="space-y-4">
            {/* ✅ NEW: Search and Sort Controls */}
            <div className="bg-gray-800 p-4 rounded-lg space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search available playlists by title, slug, tags..."
                    value={availablePlaylistsSearch}
                    onChange={(e) => setAvailablePlaylistsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400 text-sm"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={availablePlaylistsSort}
                    onChange={(e) => setAvailablePlaylistsSort(e.target.value)}
                    className="px-3 py-2 bg-gray-700 rounded text-white text-sm border-none outline-none"
                  >
                    <option value="title">Sort by Title</option>
                    {/* <option value="slug">Sort by Slug</option> */}
                    {/* <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option> */}
                    <option value="paid">Paid First</option>
                    <option value="free">Free First</option>
                  </select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="text-sm text-gray-400">
                {availablePlaylistsSearch && (
                  <p>
                    Found {filteredAndSortedAvailable.length} playlist{filteredAndSortedAvailable.length !== 1 ? 's' : ''} 
                    {filteredAndSortedAvailable.length > 0 && ` matching "${availablePlaylistsSearch}"`}
                  </p>
                )}
                {!availablePlaylistsSearch && (
                  <p>Showing {filteredAndSortedAvailable.length} available playlist{filteredAndSortedAvailable.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>

            {/*  Updated: Display Filtered and Sorted Playlists */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
              {filteredAndSortedAvailable.length === 0 ? (
                <div className="col-span-full">
                  <p className="text-gray-400 text-center py-8">
                    {availablePlaylistsSearch 
                      ? `No playlists found matching "${availablePlaylistsSearch}"`
                      : 'No playlists available to add.'
                    }
                  </p>
                </div>
              ) : (
                filteredAndSortedAvailable.map(pl => {
                  const isLoading = togglingId === pl.id;
                  const isSuccess = flash.ok && flash.txt === `Added "${pl.name}"`;
                  const isError = !flash.ok && flash.txt === 'Operation failed';
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
              )}
            </div>
          </div>
        )}
      </section>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleting && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setDeleting(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
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
