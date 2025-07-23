import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminPlaylistQuery,
  useUpdatePlaylistMutation,
  useDeletePlaylistMutation,
  useListCategoriesQuery,
  useGetAdminSongsQuery,
  useUpdateAdminSongMutation,
  useUploadR2FilesMutation
} from '../../utils/api';
import { ArrowLeft, Save, Trash2, Edit3, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AdminSongCard from '../../components/custom-ui/AdminSongCard';

// Custom Image Dropdown Component
const ImageDropdown = ({ options, value, onChange, placeholder, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.id === Number(value));

  return (
    <div className="relative">
      {/* Selected item display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 bg-gray-700 rounded text-white flex items-center justify-between hover:bg-gray-600"
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <>
              <img
                src={selectedOption.image || selectedOption.artwork_filename}
                alt={selectedOption.title}
                className="w-6 h-6 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = type === 'category' 
                    ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0xMiA2TDE2IDEySDE2TDEyIDZaIiBmaWxsPSIjOUNBNEFGIi8+CjwvZz4KPC9zdmc+'
                    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                }}
              />
              <span className="truncate">{selectedOption.title} (#{selectedOption.id})</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown options */}
          <div className="absolute z-20 w-full mt-1 bg-gray-700 rounded shadow-lg max-h-60 overflow-y-auto border border-gray-600">
            {/* Empty option */}
            <div
              className="p-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2"
              onClick={() => {
                onChange({ target: { value: '' } });
                setIsOpen(false);
              }}
            >
              <div className="w-6 h-6 bg-gray-500 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-300">—</span>
              </div>
              <span className="text-gray-400 truncate">{placeholder}</span>
            </div>
            
            {/* Options with images */}
            {options.map((option) => (
              <div
                key={option.id}
                className="p-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2"
                onClick={() => {
                  onChange({ target: { value: option.id } });
                  setIsOpen(false);
                }}
              >
                <img
                  src={option.image || option.artwork_filename}
                  alt={option.title}
                  className="w-6 h-6 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src = type === 'category' 
                      ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0xMiA2TDE2IDEySDE2TDEyIDZaIiBmaWxsPSIjOUNBNEFGIi8+CjwvZz4KPC9zdmc+'
                      : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                  }}
                />
                <span className="truncate">{option.title} (#{option.id})</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function AdminPlaylistDetail() {
  const { id: playlistId } = useParams();
  const navigate = useNavigate();

  // File upload
  const [uploadFiles, { isLoading: uploading }] = useUploadR2FilesMutation();
  const [selectedArtFile, setSelectedArtFile] = useState(null);

  // Fetch playlist + categories + songs
  const { 
    data: p, 
    isLoading, 
    isError, 
    error, 
    refetch: refetchPlaylist 
  } = useGetAdminPlaylistQuery(playlistId);
  
  const { data: catRaw = { data: [] }, isLoading: catLoading } =
    useListCategoriesQuery({ page: 1, pageSize: 100 });

  // Get all songs (we'll need a large pageSize or separate "all songs" query)
  const {
    data: allSongsRaw = { data: [] },
    isLoading: songsLoading,
    isError: songsError,
    refetch: refetchSongs,
  } = useGetAdminSongsQuery({ page: 1, pageSize: 1000 }); // Large pageSize to get all

  // Mutations
  const [updatePlaylist, { isLoading: saving }] = useUpdatePlaylistMutation();
  const [deletePlaylist] = useDeletePlaylistMutation();
  const [updateSong] = useUpdateAdminSongMutation();

  // Local form & UI state
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flash, setFlash] = useState({ txt: '', ok: true });
  const [togglingId, setTogglingId] = useState(null);
  const [showAvailable, setShowAvailable] = useState(false);

  // Initialize form
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

  // Auto‑clear flash messages
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  if (isLoading || songsLoading) return <div className="p-6 text-white">Loading…</div>;
  if (isError || !p) {
    return (
      <div className="p-6 text-red-500">
        Error: {error?.data?.error || 'Failed to load playlist'}
      </div>
    );
  }
  if (songsError) {
    return <div className="p-6 text-red-500">Error loading songs.</div>;
  }
  if (!form) return null;

  const categories = Array.isArray(catRaw.data) ? catRaw.data : [];
  const selectedCategory = categories.find((c) => c.id === form.category_id);
  
  // Process songs data
  const allSongs = Array.isArray(allSongsRaw.data) ? allSongsRaw.data : allSongsRaw.data || [];
  
  // Split songs into assigned/available
  const assigned = allSongs.filter(s => s.playlist_id === +playlistId || s.playlistId === +playlistId || s.playlist === +playlistId);
  const available = allSongs.filter(s => s.playlist_id !== +playlistId && s.playlistId !== +playlistId && s.playlist !== +playlistId);

  // Image upload handler
  const handleArtworkUpload = async () => {
    if (!selectedArtFile) return;
    setFlash({ txt: 'Uploading image…', ok: true });
    
    try {
      const res = await uploadFiles({
        prefix: 'align-images/playlists',
        files: [selectedArtFile],
      }).unwrap();

      const uploadedArray = res.uploaded || res;
      const key = uploadedArray?.[0]?.key;
      if (!key) throw new Error('No key returned from upload');

      const publicUrl = `https://cdn.align-alternativetherapy.com/${key}`;
      setForm(f => ({ ...f, artwork_filename: publicUrl }));
      setFlash({ txt: 'Image uploaded!', ok: true });

      setSelectedArtFile(null);
      document.getElementById('playlist-artwork-upload').value = '';
    } catch (err) {
      console.error('Upload failed:', err);
      setFlash({ txt: 'Upload failed.', ok: false });
    }
  };

  // Song assignment toggle - FIXED VERSION
  const toggleSong = async (song, toAssign) => {
    setTogglingId(song.id);
    try {
      await updateSong({
        id: song.id,
        
        // Send all fields that the backend expects
        name: song.name || song.title,  // fallback to title if name is missing
        title: song.title,
        slug: song.slug || song.title
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `song-${song.id}`, // fallback to song-{id}
        artist: song.artist || '',
        tags: song.tags || '',
        category: song.category || null,
        playlist: toAssign ? +playlistId : null,  // This is the key field we're updating
        artwork_filename: song.artwork_filename || song.image || song.artwork_url || '',
        cdn_url: song.cdn_url || song.file_url || song.fileUrl || '',
      }).unwrap();
      
      setFlash({ 
        txt: toAssign ? `Added "${song.title}"` : `Removed "${song.title}"`, 
        ok: true 
      });
      await refetchSongs();
    } catch (err) {
      console.error('Toggle song error:', err);
      setFlash({ txt: 'Operation failed', ok: false });
    } finally {
      setTogglingId(null);
    }
  };

  // Playlist handlers
  const handleSave = async () => {
    try {
      await updatePlaylist({ id: playlistId, ...form }).unwrap();
      setFlash({ txt: 'Playlist updated.', ok: true });
      setEditMode(false);
      await refetchPlaylist();
    } catch (e) {
      console.error('Update error:', e);
      setFlash({ txt: 'Failed to update playlist.', ok: false });
    }
  };

  const confirmDelete = () => setShowDeleteModal(true);
  const cancelDelete = () => setShowDeleteModal(false);
  
  const handleDelete = async () => {
    try {
      await deletePlaylist(playlistId).unwrap();
      setFlash({ txt: 'Playlist deleted.', ok: true });
      setTimeout(() => navigate('/admin/playlists'), 500);
    } catch (e) {
      console.error('Delete error:', e);
      setFlash({ txt: 'Failed to delete playlist.', ok: false });
    }
  };

  return (
    <div className="p-6 text-white space-y-8">
      {/* Flash Messages */}
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
            onClick={() => setEditMode((e) => !e)}
            className="flex items-center gap-1 bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
          >
            <Edit3 size={16} /> {editMode ? 'Cancel' : 'Edit'}
          </button>
          {editMode && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded disabled:opacity-50 hover:bg-blue-500"
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

      {/* Form & Artwork */}
      <div className="bg-gray-800 rounded-lg flex flex-col md:flex-row gap-6">
        {/* Form */}
        <div className="flex-1 p-6 space-y-4 order-last md:order-first">
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

            {/* Category Dropdown with Images */}
            <div className="md:col-span-2">
              <label className="block text-gray-400 mb-1">Category</label>
              {editMode ? (
                <ImageDropdown
                  options={categories}
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: +e.target.value }))}
                  placeholder="Select category"
                  type="category"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <img
                    src={selectedCategory?.image || ''}
                    alt="Category"
                    className="w-6 h-6 rounded object-cover bg-gray-600"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0xMiA2TDE2IDEySDE2TDEyIDZaIiBmaWxsPSIjOUNBNEFGIi8+CjwvZz4KPC9zdmc+';
                    }}
                  />
                  <p>{selectedCategory?.title ?? '—'}</p>
                  {/* <p>{selectedCategory?.title ?? `#${p.categoryId ?? p.category_id}` ?? '—'}</p> */}
                </div>
              )}
            </div>

            {/* Artwork URL */}
            <div className="md:col-span-2 overflow-clip">
              <label className="block text-gray-400 mb-1">Artwork URL</label>

              {editMode ? (
                <>
                  {/* Text link input */}
                  <input
                    type="text"
                    value={form.artwork_filename}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, artwork_filename: e.target.value }))
                    }
                    placeholder="https://cdn.example.com/img.jpg"
                    className="w-full p-2 bg-gray-700 rounded text-white mb-2"
                  />

                  {/* File chooser */}
                  <input
                    id="playlist-artwork-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSelectedArtFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="playlist-artwork-upload"
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
                <p>{p.image ?? p.artwork_filename ?? '—'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Artwork - Top on mobile, right on desktop */}
        <div className="w-full md:w-80 h-48 md:h-auto rounded overflow-hidden order-first md:order-last">
          <img
            src={form?.artwork_filename || p.image || p.artwork_filename || ''}
            alt={p.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNTIgNzBIMTY4VjExMEgxNTJWNzBaIiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0xMzYgODZIMTg0VjEwNEgxMzZWODZaIiBmaWxsPSIjNkI3MjgwIi8+PC9nPgo8L3N2Zz4=';
            }}
          />
        </div>
      </div>

      {/* Assigned Songs */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Songs in "{p.title}"</h3>
        {assigned.length === 0 ? (
          <p className="text-gray-400">No songs in this playlist.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
            {assigned.map(song => {
              const isLoading = togglingId === song.id;
              const isSuccess = flash.ok && flash.txt === `Removed "${song.title}"`;
              const isError = !flash.ok && flash.txt === 'Operation failed';
              return (
                <AdminSongCard
                  key={song.id}
                  song={song}
                  assigned={true}
                  onView={() => navigate(`/admin/songs/${song.id}`)}
                  onToggle={() => toggleSong(song, false)}
                  status={{ loading: isLoading, success: isSuccess, error: isError }}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Add Song Dropdown */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Add to Playlist</h3>
        <button
          onClick={() => setShowAvailable(v => !v)}
          className="flex items-center gap-1 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          <Plus size={16} /> {showAvailable ? 'Close' : 'Add Songs…'}
        </button>

        {showAvailable && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mt-4">
            {available.length === 0
              ? <p className="text-gray-400">No songs available.</p>
              : available.map(song => {
                  const isLoading = togglingId === song.id;
                  const isSuccess = flash.ok && flash.txt === `Added "${song.title}"`;
                  const isError = !flash.ok && flash.txt === 'Operation failed';
                  return (
                    <AdminSongCard
                      key={song.id}
                      song={song}
                      assigned={false}
                      onView={() => navigate(`/admin/songs/${song.id}`)}
                      onToggle={() => toggleSong(song, true)}
                      status={{ loading: isLoading, success: isSuccess, error: isError }}
                    />
                  );
                })
            }
          </div>
        )}
      </section>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="bg-gray-900 p-6 rounded-lg space-y-4 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-white">Delete Playlist?</h3>
                <p className="text-gray-300">
                  This action cannot be undone. Are you sure you want to delete "{p.title}"?
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
