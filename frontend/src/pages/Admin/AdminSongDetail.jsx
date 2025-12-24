import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminSongQuery,
  useUpdateAdminSongMutation,
  useDeleteAdminSongMutation,
  useListCategoriesQuery,
  useListPlaylistsQuery,
  useUploadR2FilesMutation,
  useGetR2PresignUrlQuery,
  useUpdateSongVisibilityMutation, // ✅ NEW
} from '../../utils/api';
import { ArrowLeft, Save, Trash2, Edit3, Upload, CheckCircle, Eye, EyeOff } from 'lucide-react'; // ✅ Added Eye, EyeOff
import { AnimatePresence, motion } from 'framer-motion';

// Enhanced placeholder image for better UX
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIyNCIgZmlsbD0iIzZCNzI4MCIvPjxwYXRoIGQ9Ik0xNDQgNzZIMTc2VjEwNEgxNDRWNzZaTTE1MiA4NEgxNjhWOTZIMTUyVjg0WiIgZmlsbD0iIzlDQTNBRiIvPjx0ZXh0IHg9IjE2MCIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjEyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';

// Custom Image Dropdown Component (Updated with improved placeholders)
const ImageDropdown = ({ options, value, onChange, placeholder, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.id === Number(value));

  const getPlaceholderForType = (type) => {
    return type === 'playlist' 
      ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBNEFGIiBmb250LXNpemU9IjgiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5QPC90ZXh0Pgo8L3N2Zz4='
      : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxyZWN0IHg9IjYiIHk9IjYiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzlDQTRBRiIvPgo8L3N2Zz4=';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 bg-gray-700 rounded text-white flex items-center justify-between hover:bg-gray-600"
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <>
              <img
                src={selectedOption.image || selectedOption.artwork_filename || getPlaceholderForType(type)}
                alt={selectedOption.title}
                className="w-6 h-6 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = getPlaceholderForType(type);
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

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute z-20 w-full mt-1 bg-gray-700 rounded shadow-lg max-h-60 overflow-y-auto border border-gray-600">
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
                  src={option.image || option.artwork_filename || getPlaceholderForType(type)}
                  alt={option.title}
                  className="w-6 h-6 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src = getPlaceholderForType(type);
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
  
  const [artworkKey, setArtworkKey] = useState(null);
  const [audioKey, setAudioKey] = useState(null);
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);

  const [artworkUploadProgress, setArtworkUploadProgress] = useState(0);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);

  const [artworkPresignParams, setArtworkPresignParams] = useState(null);
  const [audioPresignParams, setAudioPresignParams] = useState(null);

  // Fetch song data
  const { 
    data: song, 
    isLoading, 
    isError,
    refetch: refetchSong 
  } = useGetAdminSongQuery(id);

  const { data: catRaw = { data: [] } } = useListCategoriesQuery({ page: 1, pageSize: 100 });
  const { data: plRaw = { data: [] } } = useListPlaylistsQuery({ page: 1, pageSize: 100 });

  const categories = catRaw.data || [];
  const playlists = plRaw.data || [];

  // Mutations
  const [updateSong, { isLoading: saving }] = useUpdateAdminSongMutation();
  const [deleteSong] = useDeleteAdminSongMutation();
  const [updateVisibility] = useUpdateSongVisibilityMutation(); // ✅ NEW

  // Local form & UI state
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flash, setFlash] = useState({ txt: '', ok: true });

  const { data: artworkPresign } = useGetR2PresignUrlQuery(
    artworkPresignParams || {
      filename: "",
      contentType: "",
      folder: "align-images/songs",
    },
    { skip: !artworkPresignParams }
  );

  const { data: audioPresign } = useGetR2PresignUrlQuery(
    audioPresignParams || {
      filename: "",
      contentType: "",
      folder: "align-audio/songs",
    },
    { skip: !audioPresignParams }
  );

  // ✅ UPDATED - Initialize form with is_free and is_discoverable
  useEffect(() => {
    if (song) {
      setForm({
        name: song.name || '',
        title: song.title || '',
        slug: song.slug || '',
        description: song.description || '',
        artist: song.artist || '',
        tags: song.tags || '',
        category: song.category || '',
        playlist: song.playlistId || song.playlist_id || song.playlist || '',
        artwork_filename: song.image || song.artwork_filename || '',
        cdn_url: song.audioUrl || song.cdn_url || '',
        is_free: song.is_free ?? 0,
        is_discoverable: song.is_discoverable ?? 1, // ✅ NEW
      });
    }
  }, [song]);

  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  const handleArtworkUpload = async () => {
    if (!selectedArtFile) return;
    
    setArtworkUploading(true);
    setArtworkUploadProgress(5);
    setFlash({ txt: "Getting upload URL...", ok: true });
    
    try {
      setArtworkPresignParams({
        filename: selectedArtFile.name,
        contentType: selectedArtFile.type,
        folder: "align-images/songs",
      });
    } catch (err) {
      console.error('Upload error:', err);
      setFlash({ txt: `Artwork upload failed: ${err.message}`, ok: false });
      setArtworkUploading(false);
      setArtworkUploadProgress(0);
    }
  };

  const handleAudioUpload = async () => {
    if (!selectedAudioFile) return;
    
    setAudioUploading(true);
    setAudioUploadProgress(5);
    setFlash({ txt: "Getting upload URL...", ok: true });
    
    try {
      setAudioPresignParams({
        filename: selectedAudioFile.name,
        contentType: selectedAudioFile.type,
        folder: "align-audio/songs",
      });
    } catch (err) {
      console.error('Upload error:', err);
      setFlash({ txt: `Audio upload failed: ${err.message}`, ok: false });
      setAudioUploading(false);
      setAudioUploadProgress(0);
    }
  };

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
        setArtworkUploadProgress(10);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 90) + 10;
            setArtworkUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const publicUrl = `https://cdn.align-alternativetherapy.com/${artworkPresign.key}`;
            console.log('✅ Artwork upload successful:', publicUrl);
            
            setArtworkKey(artworkPresign.key);
            setForm(f => ({ ...f, artwork_filename: publicUrl }));
            setFlash({ txt: "Artwork uploaded successfully!", ok: true });
            setArtworkUploadProgress(100);
            
            setSelectedArtFile(null);
            setArtworkPresignParams(null);
            const artInput = document.getElementById('song-artwork-upload');
            if (artInput) artInput.value = '';
            
            setTimeout(() => {
              setArtworkUploading(false);
              setArtworkUploadProgress(0);
            }, 3000);
            
          } else {
            throw new Error('Upload failed');
          }
        });

        xhr.addEventListener('error', () => {
          throw new Error('Upload failed');
        });

        xhr.open('PUT', artworkPresign.url);
        xhr.setRequestHeader('Content-Type', selectedArtFile.type);
        xhr.send(selectedArtFile);
        
      } catch (err) {
        console.error('Artwork upload error:', err);
        setFlash({ txt: `Artwork upload failed: ${err.message}`, ok: false });
        setArtworkUploadProgress(0);
        setArtworkUploading(false);
      }
    };

    uploadArtwork();
  }, [artworkPresign, selectedArtFile, artworkPresignParams]);

  useEffect(() => {
    if (!audioPresign || !selectedAudioFile || !audioPresignParams) return;

    const uploadAudio = async () => {
      try {
        setFlash({ txt: "Uploading audio file...", ok: true });
        setAudioUploadProgress(10);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 90) + 10;
            setAudioUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const publicUrl = `https://cdn.align-alternativetherapy.com/${audioPresign.key}`;
            setAudioKey(audioPresign.key);
            setForm(f => ({ ...f, cdn_url: publicUrl }));
            setFlash({ txt: "Audio file uploaded successfully!", ok: true });
            setAudioUploadProgress(100);
            
            setSelectedAudioFile(null);
            setAudioPresignParams(null);
            const audioInput = document.getElementById('song-audio-upload');
            if (audioInput) audioInput.value = '';
            
            setTimeout(() => {
              setAudioUploading(false);
              setAudioUploadProgress(0);
            }, 3000);
            
          } else {
            throw new Error('Upload failed');
          }
        });

        xhr.addEventListener('error', () => {
          throw new Error('Upload failed');
        });

        xhr.open('PUT', audioPresign.url);
        xhr.setRequestHeader('Content-Type', selectedAudioFile.type);
        xhr.send(selectedAudioFile);
        
      } catch (err) {
        console.error('Audio upload error:', err);
        setFlash({ txt: "Audio upload failed.", ok: false });
        setAudioUploadProgress(0);
        setAudioUploading(false);
      }
    };

    uploadAudio();
  }, [audioPresign, selectedAudioFile, audioPresignParams]);

  if (isLoading) return <div className="p-6 text-white">Loading…</div>;
  if (isError || !song) return <div className="p-6 text-red-500">Error loading song</div>;
  if (!form) return null;

  // ✅ UPDATED - Separate is_discoverable from update
  const handleSave = async () => {
    try {
      // Separate is_discoverable from other fields
      const { is_discoverable, ...songData } = form;
      
      // Save song details
      await updateSong({ id, ...songData }).unwrap();
      
      // If visibility changed, update it separately
      if (is_discoverable !== song.is_discoverable) {
        await updateVisibility({
          id,
          isDiscoverable: Boolean(is_discoverable),
        }).unwrap();
      }
      
      setFlash({ txt: 'Song updated.', ok: true });
      setEditMode(false);
      await refetchSong();
    } catch (e) {
      console.error('Update error:', e);
      setFlash({ txt: 'Failed to update song.', ok: false });
    }
  };

  // ✅ NEW: Toggle visibility handler
  const handleToggleVisibility = async () => {
    try {
      const newVisibility = !form.is_discoverable;
      
      // Optimistically update local state
      setForm(f => ({ ...f, is_discoverable: newVisibility ? 1 : 0 }));
      
      await updateVisibility({
        id,
        isDiscoverable: newVisibility,
      }).unwrap();
      
      setFlash({
        txt: `Song ${newVisibility ? 'shown' : 'hidden'} successfully!`,
        ok: true,
      });
      
      await refetchSong();
    } catch (err) {
      console.error('Toggle visibility error:', err);
      // Revert on error
      setForm(f => ({ ...f, is_discoverable: f.is_discoverable ? 0 : 1 }));
      setFlash({
        txt: 'Failed to update visibility.',
        ok: false,
      });
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

      {/* ✅ UPDATED Header with Quick Visibility Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft size={20} /> Back
        </button>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* ✅ NEW: Quick Visibility Toggle */}
          <button
            onClick={handleToggleVisibility}
            className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
              form?.is_discoverable === 1
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={form?.is_discoverable === 1 ? 'Hide from users' : 'Show to users'}
          >
            {form?.is_discoverable === 1 ? (
              <>
                <Eye size={16} />
                <span className="hidden sm:inline">Visible</span>
              </>
            ) : (
              <>
                <EyeOff size={16} />
                <span className="hidden sm:inline">Hidden</span>
              </>
            )}
          </button>
          
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

            <div className="md:col-span-2">
              <label className="block text-gray-400 mb-1">Description</label>
              {editMode ? (
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                />
              ) : (
                <p>{song.description || '—'}</p>
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

            {/* Access Type */}
            <div>
              <label className="block text-gray-400 mb-2">Access Type</label>
              {editMode ? (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="is_free"
                      value={0}
                      checked={form.is_free === 0}
                      onChange={(e) => setForm(f => ({ ...f, is_free: Number(e.target.value) }))}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2 accent-blue-600"
                    />
                    <span className="text-white text-sm group-hover:text-blue-400 transition-colors">
                      Paid
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="is_free"
                      value={1}
                      checked={form.is_free === 1}
                      onChange={(e) => setForm(f => ({ ...f, is_free: Number(e.target.value) }))}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 focus:ring-green-500 focus:ring-2 accent-green-600"
                    />
                    <span className="text-white text-sm group-hover:text-green-400 transition-colors">
                      Free
                    </span>
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {form.is_free === 1 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600/20 text-green-400 border border-green-600/30">
                      Free
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
                      Paid
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ✅ NEW: Visibility Field */}
            <div>
              <label className="block text-gray-400 mb-1">Visibility</label>
              {editMode ? (
                <select
                  value={form.is_discoverable !== undefined ? form.is_discoverable : 1}
                  onChange={(e) => setForm(f => ({ ...f, is_discoverable: Number(e.target.value) }))}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                >
                  <option value={1}>Discoverable</option>
                  <option value={0}>Hidden</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    song.is_discoverable === 1 
                      ? 'bg-green-600/20 text-green-400' 
                      : 'bg-gray-600/20 text-gray-400'
                  }`}>
                    {song.is_discoverable === 1 ? (
                      <>
                        <Eye size={14} />
                        <span>Discoverable</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        <span>Hidden</span>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Category - only show in read-only mode for existing data */}
            {!editMode && form.category && (
              <div>
                <label className="block text-gray-400 mb-1">Category (Legacy)</label>
                <div className="flex items-center gap-2">
                  <img
                    src={categories.find(c => c.id === Number(form.category))?.image || categories.find(c => c.id === Number(form.category))?.artwork_filename}
                    alt="Category"
                    className="w-6 h-6 rounded object-cover bg-gray-600"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxyZWN0IHg9IjYiIHk9IjYiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzlDQTRBRiIvPgo8L3N2Zz4=';
                    }}
                  />
                  <p>{categories.find(c => c.id === Number(form.category))?.title || '—'}</p>
                </div>
              </div>
            )}

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
                    src={playlists.find(p => p.id === Number(form.playlist))?.image || playlists.find(p => p.id === Number(form.playlist))?.artwork_filename}
                    alt="Playlist"
                    className="w-6 h-6 rounded object-cover bg-gray-600"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBNEFGIiBmb250LXNpemU9IjgiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5QPC90ZXh0Pgo8L3N2Zz4=';
                    }}
                  />
                  <p>{playlists.find(p => p.id === Number(form.playlist))?.title || '—'}</p>
                </div>
              )}
            </div>

            {/* Artwork Upload with Progress Bar */}
            <div className="md:col-span-2 overflow-clip">
              <label className="block text-gray-400 mb-1">Artwork URL</label>

              {editMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.artwork_filename}
                    onChange={e => setForm(f => ({ ...f, artwork_filename: e.target.value }))}
                    placeholder="https://cdn.example.com/img.jpg"
                    className="w-full p-2 bg-gray-700 rounded text-white"
                  />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="song-artwork-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setSelectedArtFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="song-artwork-upload"
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm flex-1 sm:flex-none"
                    >
                      <Upload size={14} />
                      <span className="truncate">
                        {selectedArtFile ? selectedArtFile.name : 'Choose Image'}
                      </span>
                    </label>
                    
                    {artworkKey && (
                      <div className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded text-sm">
                        <CheckCircle size={14} />
                        <span>Uploaded</span>
                      </div>
                    )}
                  </div>

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
                <p className="break-all">{song.image || song.artwork_filename || '—'}</p>
              )}
            </div>

            {/* Audio Upload with Progress Bar */}
            <div className="md:col-span-2 overflow-clip">
              <label className="block text-gray-400 mb-1">Audio URL</label>
              
              {editMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.cdn_url}
                    onChange={e => setForm(f => ({ ...f, cdn_url: e.target.value }))}
                    placeholder="https://cdn.example.com/audio.mp3"
                    className="w-full p-2 bg-gray-700 rounded text-white"
                  />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="song-audio-upload"
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => setSelectedAudioFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="song-audio-upload"
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm flex-1 sm:flex-none"
                    >
                      <Upload size={14} />
                      <span className="truncate">
                        {selectedAudioFile ? selectedAudioFile.name : 'Choose Audio'}
                      </span>
                    </label>
                    
                    {audioKey && (
                      <div className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded text-sm">
                        <CheckCircle size={14} />
                        <span>Uploaded</span>
                      </div>
                    )}
                  </div>

                  {audioUploading && (
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">
                          {audioUploadProgress === 0 ? 'Preparing upload...' : 
                           audioUploadProgress === 100 ? 'Upload Complete!' : 'Uploading...'}
                        </span>
                        <span className="text-xs text-gray-400">{audioUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ease-out ${
                            audioUploadProgress === 100 ? 'bg-green-600' : 'bg-purple-600'
                          }`}
                          style={{ width: `${Math.max(audioUploadProgress, 5)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {selectedAudioFile && !audioKey && (
                    <button
                      type="button"
                      onClick={handleAudioUpload}
                      disabled={audioUploading}
                      className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded text-sm transition-colors"
                    >
                      {audioUploading ? `Uploading... ${audioUploadProgress}%` : 'Upload Audio'}
                    </button>
                  )}
                </div>
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

        {/* Enhanced Artwork Preview */}
        <div className="w-full md:w-80 h-48 md:h-auto rounded overflow-hidden order-first md:order-last">
          <img
            src={form?.artwork_filename || song.image || song.artwork_filename || DEFAULT_PLACEHOLDER}
            alt={song.title || 'Song artwork'}
            className="w-full h-full object-cover bg-gray-700"
            onError={(e) => {
              e.target.src = DEFAULT_PLACEHOLDER;
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
