// src/pages/Admin/AdminPlaylistsOverview.jsx
import React, { useState, useEffect } from 'react';
import {
  useListPlaylistsQuery,
  useCreatePlaylistMutation,
  useListCategoriesQuery,
  useUploadR2FilesMutation,
  useGetR2PresignUrlQuery,
  useGetAdminSongsQuery 
} from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, List, Eye, Plus, Search, X, Upload, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AdminPlaylistCard from '../../components/custom-ui/AdminPlaylistCard';

// Custom Image Dropdown Component (kept exactly the same)
const ImageDropdown = ({ options, value, onChange, placeholder, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.id === Number(value));

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
                src={selectedOption.image || selectedOption.artwork_filename}
                alt={selectedOption.title}
                className="w-5 h-5 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0xMCA1TDEzIDEwSDdMMTAgNVoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                }}
              />
              <span className="truncate text-sm">{selectedOption.title}</span>
            </>
          ) : (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          )}
        </div>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-gray-700 rounded shadow-lg max-h-48 overflow-y-auto border border-gray-600">
            <div
              className="p-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2"
              onClick={() => {
                onChange({ target: { value: '' } });
                setIsOpen(false);
              }}
            >
              <div className="w-5 h-5 bg-gray-500 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-300">—</span>
              </div>
              <span className="text-gray-400 truncate text-sm">{placeholder}</span>
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
                  src={option.image || option.artwork_filename}
                  alt={option.title}
                  className="w-5 h-5 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0xMCA1TDEzIDEwSDdMMTAgNVoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                  }}
                />
                <span className="truncate text-sm">{option.title}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function AdminPlaylistsOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const frontendPageSize = 12;

  // Search and Filter (kept exactly the same)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaid, setFilterPaid] = useState('');

  // File uploads - Updated for presigned URLs
  const [uploadFiles, { isLoading: uploading }] = useUploadR2FilesMutation();
  const [selectedArtFile, setSelectedArtFile] = useState(null);

  // ✅ NEW: Presigned upload tracking state
  const [artworkKey, setArtworkKey] = useState(null);
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [artworkUploadProgress, setArtworkUploadProgress] = useState(0);

  // ✅ NEW: Presign request state for manual triggering
  const [artworkPresignParams, setArtworkPresignParams] = useState(null);

  // Fetch playlists - get more for client-side filtering (kept exactly the same)
  const {
    data: plRaw,
    isLoading: plLoading,
    isError: plError,
    error: plErrorObj,
    refetch: refetchPlaylists,
  } = useListPlaylistsQuery({ page: 1, pageSize: 200 });

  // Fetch categories for dropdown (kept exactly the same)
  const { data: catRaw = { data: [] } } = useListCategoriesQuery({
    page: 1,
    pageSize: 100,
  });

  // ✅ Fetch all songs for counting
  const {
    data: allSongsRaw = { data: [] },
  } = useGetAdminSongsQuery({ page: 1, pageSize: 1000 });

  // Create new playlist (kept exactly the same)
  const [createPlaylist, { isLoading: creating }] = useCreatePlaylistMutation();

  // Form state (kept exactly the same)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    tags: '',
    artwork_filename: '',
    category_id: '',
    paid: 0,
  });

  const [flash, setFlash] = useState({ txt: '', ok: true });

  // ✅ NEW: Use presigned URL hook with conditional skip
  const { data: artworkPresign } = useGetR2PresignUrlQuery(
    artworkPresignParams || {
      filename: "",
      contentType: "",
      folder: "align-images/playlist",
    },
    { skip: !artworkPresignParams }
  );

  // Process data (kept exactly the same)
  const allPlaylists = React.useMemo(() => {
    if (!plRaw) return [];
    
    if (Array.isArray(plRaw)) {
      return plRaw;
    }
    
    if (plRaw.data && Array.isArray(plRaw.data)) {
      return plRaw.data;
    }
    
    return [];
  }, [plRaw]);

  const categories = React.useMemo(() => {
    if (!catRaw) return [];
    return Array.isArray(catRaw.data) ? catRaw.data : (Array.isArray(catRaw) ? catRaw : []);
  }, [catRaw]);

  // ✅ FIXED: Process songs data the same way as AdminPlaylistDetail
  const allSongs = React.useMemo(() => {
    return Array.isArray(allSongsRaw?.data) ? allSongsRaw.data : (allSongsRaw?.data || []);
  }, [allSongsRaw]);

  // ✅ FIXED: Create song count mapping for playlists overview
  const songCounts = React.useMemo(() => {
    const counts = {};
    
    // Initialize all playlists with 0 count
    allPlaylists.forEach(playlist => {
      counts[playlist.id] = 0;
    });
    
    // Count songs per playlist using the same field names as AdminPlaylistDetail
    if (Array.isArray(allSongs)) {
      allSongs.forEach(song => {
        const playlistId = song.playlist_id || song.playlistId || song.playlist;
        if (playlistId && counts.hasOwnProperty(playlistId)) {
          counts[playlistId]++;
        }
      });
    }
    
    return counts;
  }, [allPlaylists, allSongs]);

  // Filter playlists (kept exactly the same)
  const filteredPlaylists = React.useMemo(() => {
    return allPlaylists.filter(playlist => {
      // Search filter
      const matchesSearch = !searchTerm || 
        playlist.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playlist.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playlist.tags?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = !filterCategory || 
        playlist.category_id === Number(filterCategory) || 
        playlist.categoryId === Number(filterCategory) ||
        playlist.category === Number(filterCategory);
      
      // Paid filter
      const matchesPaid = !filterPaid || 
        (filterPaid === 'paid' && playlist.paid) ||
        (filterPaid === 'free' && !playlist.paid);

      return matchesSearch && matchesCategory && matchesPaid;
    });
  }, [allPlaylists, searchTerm, filterCategory, filterPaid]);

  // Pagination for filtered results (kept exactly the same)
  const totalItems = plRaw?.total || filteredPlaylists.length;
  const totalPages = Math.ceil(filteredPlaylists.length / frontendPageSize);
  const startIndex = (page - 1) * frontendPageSize;
  const paginatedPlaylists = filteredPlaylists.slice(startIndex, startIndex + frontendPageSize);

  // Auto-clear flash messages (kept exactly the same)
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  // Reset page when filters change (kept exactly the same)
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory, filterPaid]);

  // Fixed auto-generate slug from title (kept exactly the same)
  const generateSlug = (title) => {
    if (!title) return '';
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // ✅ ENHANCED: Manual artwork upload handler with presigned URL
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
        folder: "align-images/playlist",
      });
      
    } catch (err) {
      console.error('Upload error:', err);
      setFlash({ txt: `Artwork upload failed: ${err.message}`, ok: false });
      setArtworkUploading(false);
      setArtworkUploadProgress(0);
    }
  };

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
            const artInput = document.getElementById('create-artwork-upload');
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

  const toggleView = () => {
    setViewType((prev) => (prev === 'grid' ? 'list' : 'grid'));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      await createPlaylist(form).unwrap();
      setFlash({ txt: 'Playlist created successfully!', ok: true });
      
      // Reset form and files
      setForm({
        title: '',
        slug: '',
        tags: '',
        artwork_filename: '',
        category_id: '',
        paid: 0,
      });
      setSelectedArtFile(null);
      
      // ✅ ADDED: Reset upload states
      setArtworkKey(null);
      setArtworkUploading(false);
      setArtworkUploadProgress(0);
      
      // Clear file input
      const artInput = document.getElementById('create-artwork-upload');
      if (artInput) artInput.value = '';
      
      setShowCreateForm(false);
      refetchPlaylists();
    } catch (err) {
      console.error('Create playlist error:', err);
      setFlash({ txt: 'Failed to create playlist.', ok: false });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterPaid('');
  };

  return (
    <div className="p-4 sm:p-6 text-white space-y-6">
      {/* Flash Messages */}
      <AnimatePresence>
        {flash.txt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 text-center rounded ${flash.ok ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {flash.txt}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Playlists Overview</h2>
          <p className="text-gray-400 text-sm">
            {totalItems} playlist{totalItems !== 1 ? 's' : ''} total, {filteredPlaylists.length} shown
            {(searchTerm || filterCategory || filterPaid) && ` (filtered)`}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 bg-blue-600 px-3 sm:px-4 py-2 rounded hover:bg-blue-500 flex-1 sm:flex-none text-sm sm:text-base"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{showCreateForm ? 'Cancel' : 'Create Playlist'}</span>
            <span className="sm:hidden">{showCreateForm ? 'Cancel' : 'Create'}</span>
          </button>
          <button
            onClick={toggleView}
            className="flex items-center justify-center gap-2 bg-gray-700 px-3 py-2 rounded hover:bg-gray-600 text-sm sm:text-base"
          >
            {viewType === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
            <span className="hidden sm:inline">{viewType === 'grid' ? 'List' : 'Grid'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 p-3 sm:p-4 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search playlists by title, slug, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400 text-sm sm:text-base"
            />
          </div>
          {(searchTerm || filterCategory || filterPaid) && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 text-gray-400 hover:text-white text-sm px-3 py-2 sm:px-0 sm:py-0"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Filter by Category</label>
            <ImageDropdown
              options={categories}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              placeholder="All Categories"
              type="category"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Filter by Type</label>
            <select
              value={filterPaid}
              onChange={(e) => setFilterPaid(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
            >
              <option value="">All Types</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-gray-800 p-4 sm:p-6 rounded-lg space-y-4 overflow-hidden"
          >
            <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Plus size={20} /> Create New Playlist
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Title *</label>
                <input
                  placeholder="Playlist title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm(prevForm => ({ 
                      ...prevForm, 
                      title,
                      // Only auto-generate slug if current slug is empty or was auto-generated
                      slug: prevForm.slug === '' || prevForm.slug === generateSlug(prevForm.title) 
                        ? generateSlug(title) 
                        : prevForm.slug,
                    }));
                  }}
                  required
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Slug *</label>
                <input
                  placeholder="playlist-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Tags</label>
                <input
                  placeholder="comma, separated, tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Category *</label>
                <ImageDropdown
                  options={categories}
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  placeholder="Select Category"
                  type="category"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Type</label>
                <select
                  value={form.paid}
                  onChange={(e) => setForm({ ...form, paid: Number(e.target.value) })}
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                >
                  <option value={0}>Free</option>
                  <option value={1}>Paid</option>
                </select>
              </div>
            </div>

            {/* ✅ Enhanced Artwork Upload with Progress Bar */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Artwork</label>
              <input
                type="text"
                placeholder="Or paste artwork URL"
                value={form.artwork_filename}
                onChange={(e) => setForm({ ...form, artwork_filename: e.target.value })}
                className="w-full p-2 bg-gray-700 rounded text-white mb-2 text-sm sm:text-base"
              />
              
              <div className="space-y-2">
                {/* File selection */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    id="create-artwork-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSelectedArtFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="create-artwork-upload"
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
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50 hover:bg-blue-500 order-1 sm:order-2"
              >
                {creating ? 'Creating…' : 'Create Playlist'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading/Error States */}
      {plLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-400">Loading playlists...</div>
        </div>
      )}

      {plError && (
        <div className="bg-red-900/20 border border-red-600 p-4 rounded">
          <p className="text-red-400">
            Error: {plErrorObj?.data?.error || 'Failed to load playlists'}
          </p>
        </div>
      )}

      {/* Playlists Grid/List using AdminPlaylistCard */}
      {!plLoading && !plError && (
        <>
          {paginatedPlaylists.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {filteredPlaylists.length === 0 ? 'No playlists found matching your filters' : 'No playlists on this page'}
            </div>
          ) : (
            <div
              className={`grid gap-3 sm:gap-4 ${
                viewType === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {paginatedPlaylists.map((playlist) => (
                <AdminPlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  assigned={false}
                  onView={() => navigate(`/admin/playlists/${playlist.id}`)}
                  onToggle={() => {}}
                  status={{}}
                  hideToggleButton={true}
                  songCount={songCounts[playlist.id] || 0} 
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 sm:gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 sm:px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-2 sm:px-3 py-1 rounded text-sm ${
                        page === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 sm:px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
