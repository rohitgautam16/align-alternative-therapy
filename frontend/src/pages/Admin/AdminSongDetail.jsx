import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminSongQuery,
  useUpdateAdminSongMutation,
  useDeleteAdminSongMutation,
  useListCategoriesQuery,
  useListPlaylistsQuery,
  useUploadR2FilesMutation
} from '../../utils/api';
import { ArrowLeft, Save, Trash2, Edit3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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

export default function AdminSongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // File upload
  const [uploadFiles, { isLoading: uploading }] = useUploadR2FilesMutation();
  const [selectedArtFile, setSelectedArtFile] = useState(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);

  // Fetch song data
  const { 
    data: song, 
    isLoading, 
    isError,
    refetch: refetchSong 
  } = useGetAdminSongQuery(id);

  // Fetch categories and playlists for dropdowns
  const { data: catRaw = { data: [] } } = useListCategoriesQuery({ page: 1, pageSize: 100 });
  const { data: plRaw = { data: [] } } = useListPlaylistsQuery({ page: 1, pageSize: 100 });

  // Ensure arrays for safe operations
  const categories = catRaw.data || [];
  const playlists = plRaw.data || [];

  // Mutations
  const [updateSong, { isLoading: saving }] = useUpdateAdminSongMutation();
  const [deleteSong] = useDeleteAdminSongMutation();

  // Local form & UI state
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flash, setFlash] = useState({ txt: '', ok: true });

  // Initialize form
  useEffect(() => {
    if (song) {
      setForm({
        name: song.name || '',
        title: song.title || '',
        slug: song.slug || '',
        artist: song.artist || '',
        tags: song.tags || '',
        category: song.category || '',
        playlist: song.playlistId || song.playlist_id || song.playlist || '',
        artwork_filename: song.image || song.artwork_filename || '',
        cdn_url: song.audioUrl || song.cdn_url || '',
      });
    }
  }, [song]);

  // Auto‑clear flash messages
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  if (isLoading) return <div className="p-6 text-white">Loading…</div>;
  if (isError || !song) return <div className="p-6 text-red-500">Error loading song</div>;
  if (!form) return null;

  // Image upload handler
  const handleArtworkUpload = async () => {
    if (!selectedArtFile) return;
    setFlash({ txt: 'Uploading image…', ok: true });
    
    try {
      const res = await uploadFiles({
        prefix: 'align-images/songs',
        files: [selectedArtFile],
      }).unwrap();

      const uploadedArray = res.uploaded || res;
      const key = uploadedArray?.[0]?.key;
      if (!key) throw new Error('No key returned from upload');

      const publicUrl = `https://cdn.align-alternativetherapy.com/${key}`;
      setForm(f => ({ ...f, artwork_filename: publicUrl }));
      setFlash({ txt: 'Image uploaded!', ok: true });

      setSelectedArtFile(null);
      document.getElementById('song-artwork-upload').value = '';
    } catch (err) {
      console.error('Upload failed:', err);
      setFlash({ txt: 'Upload failed.', ok: false });
    }
  };

  // Audio upload handler
  const handleAudioUpload = async () => {
    if (!selectedAudioFile) return;
    setFlash({ txt: 'Uploading audio…', ok: true });
    
    try {
      const res = await uploadFiles({
        prefix: 'align-audio',
        files: [selectedAudioFile],
      }).unwrap();

      const uploadedArray = res.uploaded || res;
      const key = uploadedArray?.[0]?.key;
      if (!key) throw new Error('No key returned from upload');

      const publicUrl = `https://cdn.align-alternativetherapy.com/${key}`;
      setForm(f => ({ ...f, cdn_url: publicUrl }));
      setFlash({ txt: 'Audio uploaded!', ok: true });

      setSelectedAudioFile(null);
      document.getElementById('song-audio-upload').value = '';
    } catch (err) {
      console.error('Audio upload failed:', err);
      setFlash({ txt: 'Audio upload failed.', ok: false });
    }
  };

  // Handlers
  const handleSave = async () => {
    try {
      await updateSong({ id, ...form }).unwrap();
      setFlash({ txt: 'Song updated.', ok: true });
      setEditMode(false);
      await refetchSong();
    } catch (e) {
      console.error('Update error:', e);
      setFlash({ txt: 'Failed to update song.', ok: false });
    }
  };

  const confirmDelete = () => setShowDeleteModal(true);
  const cancelDelete = () => setShowDeleteModal(false);

  const handleDelete = async () => {
    try {
      await deleteSong(id).unwrap();
      setFlash({ txt: 'Song deleted.', ok: true });
      setTimeout(() => navigate('/admin/songs'), 500);
    } catch (e) {
      console.error('Delete error:', e);
      setFlash({ txt: 'Failed to delete song.', ok: false });
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
            onClick={() => setEditMode(e => !e)}
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

            {/* Category Dropdown with Images */}
            <div>
              <label className="block text-gray-400 mb-1">Category</label>
              {editMode ? (
                <ImageDropdown
                  options={categories}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Select Category"
                  type="category"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <img
                    src={categories.find(c => c.id === Number(form.category))?.image || ''}
                    alt="Category"
                    className="w-6 h-6 rounded object-cover bg-gray-600"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0xMiA2TDE2IDEySDE2TDEyIDZaIiBmaWxsPSIjOUNBNEFGIi8+CjwvZz4KPC9zdmc+';
                    }}
                  />
                  <p>{categories.find(c => c.id === Number(form.category))?.title || '—'}</p>
                </div>
              )}
            </div>

            {/* Playlist Dropdown with Images */}
            <div>
              <label className="block text-gray-400 mb-1">Playlist</label>
              {editMode ? (
                <ImageDropdown
                  options={playlists}
                  value={form.playlist}
                  onChange={(e) => setForm(f => ({ ...f, playlist: e.target.value }))}
                  placeholder="Select Playlist"
                  type="playlist"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <img
                    src={playlists.find(p => p.id === Number(form.playlist))?.image || ''}
                    alt="Playlist"
                    className="w-6 h-6 rounded object-cover bg-gray-600"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                    }}
                  />
                  <p>{playlists.find(p => p.id === Number(form.playlist))?.title || '—'}</p>
                </div>
              )}
            </div>

            {/* Artwork URL */}
            <div className="md:col-span-2 overflow-clip">
              <label className="block text-gray-400 mb-1">Artwork URL</label>

              {editMode ? (
                <>
                  <input
                    type="text"
                    value={form.artwork_filename}
                    onChange={e => setForm(f => ({ ...f, artwork_filename: e.target.value }))}
                    placeholder="https://cdn.example.com/img.jpg"
                    className="w-full p-2 bg-gray-700 rounded text-white mb-2"
                  />

                  <input
                    id="song-artwork-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSelectedArtFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="song-artwork-upload"
                    className="inline-block px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm mr-2"
                  >
                    Choose Image:
                    {selectedArtFile && (
                      <span className="text-sm text-gray-300"> {selectedArtFile.name}</span>
                    )}
                  </label>

                  <button
                    onClick={handleArtworkUpload}
                    disabled={uploading}
                    className="px-3 py-1 bg-blue-600 rounded text-sm disabled:opacity-50 hover:bg-blue-500"
                  >
                    {uploading ? 'Uploading…' : 'Upload Image'}
                  </button>
                </>
              ) : (
                <p>{song.image || song.artwork_filename || '—'}</p>
              )}
            </div>

            {/* Audio URL */}
            <div className="md:col-span-2 overflow-clip">
              <label className="block text-gray-400 mb-1">Audio URL</label>
              
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={form.cdn_url}
                    onChange={e => setForm(f => ({ ...f, cdn_url: e.target.value }))}
                    placeholder="https://cdn.example.com/audio.mp3"
                    className="w-full p-2 bg-gray-700 rounded text-white mb-2"
                  />

                  <input
                    id="song-audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => setSelectedAudioFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="song-audio-upload"
                    className="inline-block px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm mr-2"
                  >
                    Choose Audio:
                    {selectedAudioFile && (
                      <span className="text-sm text-gray-300"> {selectedAudioFile.name}</span>
                    )}
                  </label>

                  <button
                    onClick={handleAudioUpload}
                    disabled={uploading}
                    className="px-3 py-1 bg-blue-600 rounded text-sm disabled:opacity-50 hover:bg-blue-500"
                  >
                    {uploading ? 'Uploading…' : 'Upload Audio'}
                  </button>
                </>
              ) : (
                <p>
                  {song.audioUrl || song.cdn_url ? (
                    <a
                      href={song.audioUrl || song.cdn_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 bg-blue-600 px-3 py-1 rounded-lg mb-2"
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

        {/* Artwork Preview */}
        <div className="w-full md:w-80 h-48 md:h-auto rounded overflow-hidden order-first md:order-last">
          <img
            src={form?.artwork_filename || song.image || song.artwork_filename || ''}
            alt={song.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIyNCIgZmlsbD0iIzZCNzI4MCIvPjxwYXRoIGQ9Ik0xNjAgNjZMMTkyIDEyNEgxMjhMMTYwIDY2WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4=';
            }}
          />
        </div>
      </div>

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
                <h3 className="text-lg font-semibold text-white">Delete Song?</h3>
                <p className="text-gray-300">
                  This action cannot be undone. Are you sure you want to delete "{song.title}"?
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
