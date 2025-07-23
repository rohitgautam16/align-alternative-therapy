import React, { useEffect, useState } from 'react';
import {
  useGetAdminSongsQuery,
  useCreateAdminSongMutation,
  useUploadR2FilesMutation,
} from '../../utils/api';
import {
  useListCategoriesQuery,
  useListPlaylistsQuery,
} from '../../utils/api';
import { Eye, Grid3X3, List, Plus, Search, X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AdminSongCard from '../../components/custom-ui/AdminSongCard';

// Custom Image Dropdown Component
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
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjMiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
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
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjMiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
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

export default function AdminSongsOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const frontendPageSize = 12;

  // Search and Filter (removed category filter)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlaylist, setFilterPlaylist] = useState('');

  // File uploads
  const [uploadFiles, { isLoading: uploading }] = useUploadR2FilesMutation();
  const [selectedArtFile, setSelectedArtFile] = useState(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);

  // Songs - fetch enough data for filtering and pagination
  const {
    data: songsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminSongsQuery({ page: 1, pageSize: 200 });

  console.log('Songs API Response:', songsData);

  // Categories and Playlists
  const { data: catRaw = { data: [] } } = useListCategoriesQuery({
    page: 1,
    pageSize: 100,
  });
  const { data: plRaw = { data: [] } } = useListPlaylistsQuery({
    page: 1,
    pageSize: 100,
  });

  // Create mutation
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

  const [flash, setFlash] = useState({ txt: '', ok: true });

  // Process data safely based on backend response structure
  const allSongs = React.useMemo(() => {
    if (!songsData) return [];
    
    if (Array.isArray(songsData)) {
      return songsData;
    }
    
    if (songsData.data && Array.isArray(songsData.data)) {
      return songsData.data;
    }
    
    return [];
  }, [songsData]);

  const categories = React.useMemo(() => {
    if (!catRaw) return [];
    return Array.isArray(catRaw.data) ? catRaw.data : (Array.isArray(catRaw) ? catRaw : []);
  }, [catRaw]);

  const playlists = React.useMemo(() => {
    if (!plRaw) return [];
    return Array.isArray(plRaw.data) ? plRaw.data : (Array.isArray(plRaw) ? plRaw : []);
  }, [plRaw]);

  // Filter songs based on search and playlist filter only (removed category filter)
  const filteredSongs = React.useMemo(() => {
    return allSongs.filter(song => {
      // Search filter
      const matchesSearch = !searchTerm || 
        song.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.slug?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Playlist filter only
      const matchesPlaylist = !filterPlaylist || 
        song.playlist === Number(filterPlaylist) || 
        song.playlist === filterPlaylist ||
        song.playlist === String(filterPlaylist) ||
        song.playlist_id === Number(filterPlaylist) ||
        song.playlist_id === filterPlaylist ||
        song.playlist_id === String(filterPlaylist) ||
        song.playlistId === Number(filterPlaylist) ||
        song.playlistId === filterPlaylist ||
        song.playlistId === String(filterPlaylist);

      return matchesSearch && matchesPlaylist;
    });
  }, [allSongs, searchTerm, filterPlaylist]);

  // Get total from backend or use filtered length
  const totalItems = songsData?.total || filteredSongs.length;
  const totalPages = Math.ceil(filteredSongs.length / frontendPageSize);
  const startIndex = (page - 1) * frontendPageSize;
  const paginatedSongs = filteredSongs.slice(startIndex, startIndex + frontendPageSize);

  // Auto-clear flash messages
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterPlaylist]);

  // Fixed auto-generate slug from title
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
      document.getElementById('create-artwork-upload').value = '';
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
      document.getElementById('create-audio-upload').value = '';
    } catch (err) {
      console.error('Audio upload failed:', err);
      setFlash({ txt: 'Audio upload failed.', ok: false });
    }
  };

  const toggleView = () => {
    setViewType((prev) => (prev === 'grid' ? 'list' : 'grid'));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    console.log('Form before submit:', form);
    
    try {
      // Create the song with current form data (including uploaded URLs)
      await createSong(form).unwrap();
      setFlash({ txt: 'Song created successfully!', ok: true });
      
      // Reset form and files
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
      setSelectedArtFile(null);
      setSelectedAudioFile(null);
      
      // Clear file inputs
      const artInput = document.getElementById('create-artwork-upload');
      const audioInput = document.getElementById('create-audio-upload');
      if (artInput) artInput.value = '';
      if (audioInput) audioInput.value = '';
      
      setShowCreateForm(false);
      refetch();
    } catch (err) {
      console.error('Create song error:', err);
      setFlash({ txt: 'Failed to create song.', ok: false });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPlaylist('');
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
          <h2 className="text-xl sm:text-2xl font-semibold">Songs Overview</h2>
          <p className="text-gray-400 text-sm">
            {totalItems} song{totalItems !== 1 ? 's' : ''} total, {filteredSongs.length} shown
            {(searchTerm || filterPlaylist) && ` (filtered)`}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 bg-blue-600 px-3 sm:px-4 py-2 rounded hover:bg-blue-500 flex-1 sm:flex-none text-sm sm:text-base"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{showCreateForm ? 'Cancel' : 'Create Song'}</span>
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

      {/* Search and Filters (removed category filter) */}
      <div className="bg-gray-800 p-3 sm:p-4 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search songs by title, artist, or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400 text-sm sm:text-base"
            />
          </div>
          {(searchTerm || filterPlaylist) && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 text-gray-400 hover:text-white text-sm px-3 py-2 sm:px-0 sm:py-0"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>
        
        {/* Single filter row for playlist only */}
        <div className="w-full sm:w-1/2">
          <label className="block text-gray-400 text-sm mb-1">Filter by Playlist</label>
          <ImageDropdown
            options={playlists}
            value={filterPlaylist}
            onChange={(e) => setFilterPlaylist(e.target.value)}
            placeholder="All Playlists"
            type="playlist"
          />
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
              <Plus size={20} /> Create New Song
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Name</label>
                <input
                  placeholder="Song name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Title *</label>
                <input
                  placeholder="Song title"
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
                      // Only auto-fill name if it's empty or matches the previous title
                      name: prevForm.name === '' || prevForm.name === prevForm.title 
                        ? title 
                        : prevForm.name
                    }));
                  }}
                  required
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Slug *</label>
                <input
                  placeholder="song-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Artist</label>
                <input
                  placeholder="Artist name"
                  value={form.artist}
                  onChange={(e) => setForm({ ...form, artist: e.target.value })}
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
                <label className="block text-gray-400 text-sm mb-1">Category</label>
                <ImageDropdown
                  options={categories}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Select Category"
                  type="category"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Playlist</label>
                <ImageDropdown
                  options={playlists}
                  value={form.playlist}
                  onChange={(e) => setForm({ ...form, playlist: e.target.value })}
                  placeholder="Select Playlist"
                  type="playlist"
                />
              </div>
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Artwork Upload */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Artwork</label>
                <input
                  type="text"
                  placeholder="Or paste artwork URL"
                  value={form.artwork_filename}
                  onChange={(e) => setForm({ ...form, artwork_filename: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white mb-2 text-sm sm:text-base"
                />
                
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
                  
                  <button
                    type="button"
                    onClick={handleArtworkUpload}
                    disabled={uploading || !selectedArtFile}
                    className="px-3 py-2 bg-blue-600 rounded text-sm disabled:opacity-50 hover:bg-blue-500 whitespace-nowrap"
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
              </div>

              {/* Audio Upload */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Audio</label>
                <input
                  type="text"
                  placeholder="Or paste audio URL"
                  value={form.cdn_url}
                  onChange={(e) => setForm({ ...form, cdn_url: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white mb-2 text-sm sm:text-base"
                />
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    id="create-audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => setSelectedAudioFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="create-audio-upload"
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm flex-1 sm:flex-none"
                  >
                    <Upload size={14} />
                    <span className="truncate">
                      {selectedAudioFile ? selectedAudioFile.name : 'Choose Audio'}
                    </span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={handleAudioUpload}
                    disabled={uploading || !selectedAudioFile}
                    className="px-3 py-2 bg-purple-600 rounded text-sm disabled:opacity-50 hover:bg-purple-500 whitespace-nowrap"
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
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
                {creating ? 'Creating…' : 'Create Song'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading/Error States */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-400">Loading songs...</div>
        </div>
      )}

      {isError && (
        <div className="bg-red-900/20 border border-red-600 p-4 rounded">
          <p className="text-red-400">
            Error: {error?.data?.error || 'Failed to load songs'}
          </p>
        </div>
      )}

      {/* Songs Grid/List using AdminSongCard */}
      {!isLoading && !isError && (
        <>
          {paginatedSongs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {filteredSongs.length === 0 ? 'No songs found matching your filters' : 'No songs on this page'}
            </div>
          ) : (
            <div
              className={`grid gap-3 sm:gap-4 ${
                viewType === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                  : 'grid-cols-1'
              }`}
            >
              {paginatedSongs.map((song) => (
                <AdminSongCard
                  key={song.id}
                  song={song}
                  assigned={false}
                  onView={() => navigate(`/admin/songs/${song.id}`)}
                  onToggle={() => {}}
                  status={{}}
                  hideToggleButton={true}
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
