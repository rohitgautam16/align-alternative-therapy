// src/pages/Admin/AdminPlaylistDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminPlaylistQuery,
  useUpdatePlaylistMutation,
  useDeletePlaylistMutation,
  useListCategoriesQuery,
  useGetAdminSongsQuery,
  useUpdateAdminSongMutation,
  useUploadR2FilesMutation,
  useGetR2PresignUrlQuery,
  useCreateAdminSongMutation,
  useUpdatePlaylistVisibilityMutation 
} from '../../utils/api';
import { ArrowLeft, Save, Trash2, Edit3, Plus, Upload, CheckCircle, Search, Filter, X, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AdminSongCard from '../../components/custom-ui/AdminSongCard';
import SongBulkUpload from '../../components/admin/SongBulkUpload'

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
                  src={option.image || option.artwork_filename}
                  alt={option.title}
                  className="w-6 h-6 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src = type === 'category' 
                      ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0xMiA2TDE2IDEySDE2TDEyIDZaIiBmaWxsPSIjOUNBNEFGIi8+CjwvZz4KPC9zdmc+'
                      : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCAnd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNkI3MjgwIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0iIzlDQTRBRiIvPjwvc3ZnPg==';
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

  const [selectedArtFile, setSelectedArtFile] = useState(null);
  const [artworkKey, setArtworkKey] = useState(null);
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [artworkUploadProgress, setArtworkUploadProgress] = useState(0);
  const [artworkPresignParams, setArtworkPresignParams] = useState(null);
  const [availableSongsSearch, setAvailableSongsSearch] = useState('');
  const [availableSongsSort, setAvailableSongsSort] = useState('title');
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flash, setFlash] = useState({ txt: '', ok: true });
  const [togglingId, setTogglingId] = useState(null);
  const [showAvailable, setShowAvailable] = useState(false);
  const [updateVisibility] = useUpdatePlaylistVisibilityMutation();
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    slug: '',
    description: '',
    artist: '',
    tags: '',
    artwork_filename: '',
    cdn_url: '',
  });
  const [selectedCreateArtFile, setSelectedCreateArtFile] = useState(null);
  const [createArtworkKey, setCreateArtworkKey] = useState(null);
  const [createArtworkUploading, setCreateArtworkUploading] = useState(false);
  const [createArtworkUploadProgress, setCreateArtworkUploadProgress] = useState(0);
  const [createArtworkPresignParams, setCreateArtworkPresignParams] = useState(null);

  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [audioKey, setAudioKey] = useState(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [audioPresignParams, setAudioPresignParams] = useState(null);

  const { 
    data: p, 
    isLoading, 
    isError, 
    error, 
    refetch: refetchPlaylist 
  } = useGetAdminPlaylistQuery(playlistId);
  
  const { data: catRaw = { data: [] }, isLoading: catLoading } =
    useListCategoriesQuery({ page: 1, pageSize: 100 });

  const {
    data: allSongsRaw = { data: [] },
    isLoading: songsLoading,
    isError: songsError,
    refetch: refetchSongs,
  } = useGetAdminSongsQuery({ page: 1, pageSize: 1000 });

  const [updatePlaylist, { isLoading: saving }] = useUpdatePlaylistMutation();
  const [deletePlaylist] = useDeletePlaylistMutation();
  const [updateSong] = useUpdateAdminSongMutation();
  const [uploadFiles, { isLoading: uploading }] = useUploadR2FilesMutation();
  
  const [createSong, { isLoading: creating }] = useCreateAdminSongMutation();

  const { data: artworkPresign } = useGetR2PresignUrlQuery(
    artworkPresignParams || {
      filename: "",
      contentType: "",
      folder: "align-images/playlists",
    },
    { skip: !artworkPresignParams }
  );


  const { data: createArtworkPresign } = useGetR2PresignUrlQuery(
    createArtworkPresignParams || {
      filename: "",
      contentType: "",
      folder: "align-images/songs",
    },
    { skip: !createArtworkPresignParams }
  );


  const { data: audioPresign } = useGetR2PresignUrlQuery(
    audioPresignParams || {
      filename: "",
      contentType: "",
      folder: "audio/songs",
    },
    { skip: !audioPresignParams }
  );

  useEffect(() => {
    if (p) {
      console.debug('⚙️ playlist raw:', p);
      setForm({
        title:            p.title,
        slug:             p.slug,
        description:      p.description,
        tags:             p.tags ?? '',
        artwork_filename: p.image ?? p.artwork_filename ?? '',
        category_id:      p.categoryId ?? p.category_id ?? '',
        paid:             Number(p.paid) || 1,
        is_discoverable:  p.is_discoverable ?? 1, 
      });
    }
  }, [p]);

  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

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
            const artInput = document.getElementById('playlist-artwork-upload');
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
    if (!createArtworkPresign || !selectedCreateArtFile || !createArtworkPresignParams) return;

    const uploadCreateArtwork = async () => {
      try {
        console.log('🚀 Starting create artwork upload:', {
          presignUrl: createArtworkPresign.url,
          key: createArtworkPresign.key,
          fileName: selectedCreateArtFile.name,
        });

        setFlash({ txt: "Uploading song artwork...", ok: true });
        setCreateArtworkUploadProgress(10);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 90) + 10;
            setCreateArtworkUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const publicUrl = `https://cdn.align-alternativetherapy.com/${createArtworkPresign.key}`;
            console.log('✅ Create artwork upload successful:', publicUrl);
            
            setCreateArtworkKey(createArtworkPresign.key);
            setCreateForm(f => ({ ...f, artwork_filename: publicUrl }));
            setFlash({ txt: "Song artwork uploaded successfully!", ok: true });
            setCreateArtworkUploadProgress(100);
            
            setSelectedCreateArtFile(null);
            setCreateArtworkPresignParams(null);
            const artInput = document.getElementById('create-song-artwork-upload');
            if (artInput) artInput.value = '';
            
            setTimeout(() => {
              setCreateArtworkUploading(false);
              setCreateArtworkUploadProgress(0);
            }, 3000);
            
          } else {
            throw new Error('Upload failed');
          }
        });

        xhr.addEventListener('error', () => {
          throw new Error('Upload failed');
        });

        xhr.open('PUT', createArtworkPresign.url);
        xhr.setRequestHeader('Content-Type', selectedCreateArtFile.type);
        xhr.send(selectedCreateArtFile);
        
      } catch (err) {
        console.error('Create artwork upload error:', err);
        setFlash({ txt: `Song artwork upload failed: ${err.message}`, ok: false });
        setCreateArtworkUploadProgress(0);
        setCreateArtworkUploading(false);
      }
    };

    uploadCreateArtwork();
  }, [createArtworkPresign, selectedCreateArtFile, createArtworkPresignParams]);


  useEffect(() => {
    if (!audioPresign || !selectedAudioFile || !audioPresignParams) return;

    const uploadAudio = async () => {
      try {
        console.log('🚀 Starting audio upload:', {
          presignUrl: audioPresign.url,
          key: audioPresign.key,
          fileName: selectedAudioFile.name,
        });

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
            console.log('✅ Audio upload successful:', publicUrl);
            
            setAudioKey(audioPresign.key);
            setCreateForm(f => ({ ...f, cdn_url: publicUrl }));
            setFlash({ txt: "Audio file uploaded successfully!", ok: true });
            setAudioUploadProgress(100);
            
            setSelectedAudioFile(null);
            setAudioPresignParams(null);
            const audioInput = document.getElementById('create-song-audio-upload');
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
        setFlash({ txt: `Audio upload failed: ${err.message}`, ok: false });
        setAudioUploadProgress(0);
        setAudioUploading(false);
      }
    };

    uploadAudio();
  }, [audioPresign, selectedAudioFile, audioPresignParams]);


  const categories = React.useMemo(() => {
    return Array.isArray(catRaw?.data) ? catRaw.data : [];
  }, [catRaw]);

  const selectedCategory = React.useMemo(() => {
    return categories.find((c) => c.id === form?.category_id);
  }, [categories, form?.category_id]);

  const currentPlaylist = React.useMemo(() => {
    return p;
  }, [p]);

  const allSongs = React.useMemo(() => {
    return Array.isArray(allSongsRaw?.data) ? allSongsRaw.data : (allSongsRaw?.data || []);
  }, [allSongsRaw]);

  const assigned = React.useMemo(() => {
    if (!allSongs || !playlistId) return [];
    return allSongs.filter(s => 
      s.playlist_id === +playlistId || 
      s.playlistId === +playlistId || 
      s.playlist === +playlistId
    );
  }, [allSongs, playlistId]);

  const available = React.useMemo(() => {
    if (!allSongs || !playlistId) return [];
    return allSongs.filter(s => 
      s.playlist_id !== +playlistId && 
      s.playlistId !== +playlistId && 
      s.playlist !== +playlistId
    );
  }, [allSongs, playlistId]);

  const filteredAndSortedAvailable = React.useMemo(() => {
    let filtered = available;

    if (availableSongsSearch) {
      const search = availableSongsSearch.toLowerCase();
      filtered = available.filter(song => 
        song.title?.toLowerCase().includes(search) ||
        song.artist?.toLowerCase().includes(search) ||
        song.tags?.toLowerCase().includes(search) ||
        song.slug?.toLowerCase().includes(search)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (availableSongsSort) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'artist':
          return (a.artist || '').localeCompare(b.artist || '');
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [available, availableSongsSearch, availableSongsSort]);

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

  const generateSlug = (title) => {
    if (!title) return '';
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleArtworkUpload = async () => {
    if (!selectedArtFile) return;
    
    setArtworkUploading(true);
    setArtworkUploadProgress(5);
    setFlash({ txt: "Getting upload URL...", ok: true });
    
    try {
      setArtworkPresignParams({
        filename: selectedArtFile.name,
        contentType: selectedArtFile.type,
        folder: "align-images/playlists",
      });
    } catch (err) {
      console.error('Upload error:', err);
      setFlash({ txt: `Artwork upload failed: ${err.message}`, ok: false });
      setArtworkUploading(false);
      setArtworkUploadProgress(0);
    }
  };

  const handleCreateArtworkUpload = async () => {
    if (!selectedCreateArtFile) return;
    
    setCreateArtworkUploading(true);
    setCreateArtworkUploadProgress(5);
    setFlash({ txt: "Getting upload URL...", ok: true });
    
    try {
      setCreateArtworkPresignParams({
        filename: selectedCreateArtFile.name,
        contentType: selectedCreateArtFile.type,
        folder: "align-images/songs",
      });
    } catch (err) {
      console.error('Create upload error:', err);
      setFlash({ txt: `Song artwork upload failed: ${err.message}`, ok: false });
      setCreateArtworkUploading(false);
      setCreateArtworkUploadProgress(0);
    }
  };

  const handleAudioUpload = async () => {
    if (!selectedAudioFile) return;
    
    setAudioUploading(true);
    setAudioUploadProgress(5);
    setFlash({ txt: "Getting audio upload URL...", ok: true });
    
    try {
      setAudioPresignParams({
        filename: selectedAudioFile.name,
        contentType: selectedAudioFile.type,
        folder: "audio/songs",
      });
    } catch (err) {
      console.error('Audio upload error:', err);
      setFlash({ txt: `Audio upload failed: ${err.message}`, ok: false });
      setAudioUploading(false);
      setAudioUploadProgress(0);
    }
  };

  const handleCreateSong = async (e) => {
    e.preventDefault();
    
    try {
      // Force the playlist to be the current playlist
      const songData = {
        ...createForm,
        name: createForm.title, // Some APIs expect 'name' field
        playlist: playlistId, // Always use current playlist
        category: null, // No category selection
      };
      
      const newSong = await createSong(songData).unwrap();
      setFlash({ txt: 'Song created successfully!', ok: true });
      
      // Reset create form (removed category)
      setCreateForm({
        title: '',
        slug: '',
        description: '',
        artist: '',
        tags: '',
        artwork_filename: '',
        cdn_url: '',
      });
      setSelectedCreateArtFile(null);
      setCreateArtworkKey(null);
      setCreateArtworkUploading(false);
      setCreateArtworkUploadProgress(0);
      setSelectedAudioFile(null);
      setAudioKey(null);
      setAudioUploading(false);
      setAudioUploadProgress(0);
      
      // Clear file inputs
      const artInput = document.getElementById('create-song-artwork-upload');
      if (artInput) artInput.value = '';
      const audioInput = document.getElementById('create-song-audio-upload');
      if (audioInput) audioInput.value = '';
      
      setShowCreateForm(false);
      
      // Refresh songs
      await refetchSongs();
    } catch (err) {
      console.error('Create song error:', err);
      setFlash({ txt: 'Failed to create song.', ok: false });
    }
  };

  const toggleSong = async (song, toAssign) => {
    setTogglingId(song.id);
    try {
      await updateSong({
        id: song.id,
        name: song.name || song.title,
        title: song.title,
        slug: song.slug || song.title
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `song-${song.id}`,
        description: song.description || '',
        artist: song.artist || '',
        tags: song.tags || '',
        category: song.category || null,
        playlist: toAssign ? +playlistId : null,
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

    const handleToggleVisibility = async () => {
    try {
      const newVisibility = !form.is_discoverable;
      
      setForm(f => ({ ...f, is_discoverable: newVisibility ? 1 : 0 }));
      
      await updateVisibility({
        id: playlistId,
        isDiscoverable: newVisibility,
      }).unwrap();
      
      setFlash({
        txt: `Playlist ${newVisibility ? 'shown' : 'hidden'} successfully!`,
        ok: true,
      });
      
      await refetchPlaylist();
    } catch (err) {
      console.error('Toggle visibility error:', err);

      setForm(f => ({ ...f, is_discoverable: f.is_discoverable ? 0 : 1 }));
      setFlash({
        txt: 'Failed to update visibility.',
        ok: false,
      });
    }
  };

  const handleSave = async () => {
    try {
      console.log('💾 Saving playlist with data:', { id: playlistId, ...form });
      
      const { is_discoverable, ...playlistData } = form;
      
      await updatePlaylist({ id: playlistId, ...playlistData }).unwrap();
      
      if (is_discoverable !== p.is_discoverable) {
        await updateVisibility({
          id: playlistId,
          isDiscoverable: Boolean(is_discoverable),
        }).unwrap();
      }
      
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

            <div className="md:col-span-2">
              <label className="block text-gray-400 mb-1">Description</label>
              {editMode ? (
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                />
              ) : (
                <p>{p.description || '—'}</p>
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

            <div>
        <label className="block text-gray-400 mb-1">Type</label>
          {editMode ? (
            <select
              value={form.paid !== undefined ? form.paid : 1}
              onChange={(e) => setForm((f) => ({ ...f, paid: Number(e.target.value) }))}
              className="w-full p-2 bg-gray-700 rounded text-white"
            >
              <option value={0}>Free</option>
              <option value={1}>Paid</option>
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center py-1 font-medium ${
                p.paid === 1 
                  ? '' 
                  : ''
              }`}>
                <p>{p.paid === 1 ? 'Paid' : 'Free'}</p>
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-gray-400 mb-1">Visibility</label>
          {editMode ? (
            <select
              value={form.is_discoverable !== undefined ? form.is_discoverable : 1}
              onChange={(e) => setForm((f) => ({ ...f, is_discoverable: Number(e.target.value) }))}
              className="w-full p-2 bg-gray-700 rounded text-white"
            >
              <option value={1}>Discoverable</option>
              <option value={0}>Hidden</option>
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                p.is_discoverable === 1 
                  ? 'bg-green-600/20 text-green-400' 
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {p.is_discoverable === 1 ? (
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
                </div>
              )}
            </div>

            {/* Enhanced Artwork Upload with Progress Bar */}
            <div className="md:col-span-2 overflow-clip">
              <label className="block text-gray-400 mb-1">Artwork URL</label>

              {editMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.artwork_filename}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, artwork_filename: e.target.value }))
                    }
                    placeholder="https://cdn.example.com/img.jpg"
                    className="w-full p-2 bg-gray-700 rounded text-white"
                  />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="playlist-artwork-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setSelectedArtFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="playlist-artwork-upload"
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
                <p>{p.image ?? p.artwork_filename ?? '—'}</p>
              )}
            </div>
          </div>
        </div>

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

      {/* ✅ Enhanced Add Song Section with Search, Sort, and Create */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Add to Playlist</h3>
        
        {/* ✅ NEW: Action buttons row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowAvailable(v => !v)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 flex-1 sm:flex-none"
          >
            <Plus size={16} /> {showAvailable ? 'Close' : 'Add Existing Songs…'}
          </button>
          
          <button
            onClick={() => setShowCreateForm(v => !v)}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 flex-1 sm:flex-none"
          >
            <Plus size={16} /> {showCreateForm ? 'Cancel Create' : 'Create New Song'}
          </button>

          <button
            onClick={() => setShowBulkUpload(v => !v)}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 rounded hover:bg-green-500 flex-1 sm:flex-none"
          >
            <Upload size={16} /> {showBulkUpload ? 'Cancel Bulk' : 'Bulk Upload Songs'}
          </button>
        </div>

          <AnimatePresence>
            {showBulkUpload && (
              <SongBulkUpload
                playlistId={playlistId}
                categories={categories}
                currentPlaylist={currentPlaylist}
                onComplete={async () => {
                  setFlash({ txt: 'Bulk upload completed successfully!', ok: true });
                  await refetchSongs();
                }}
                onClose={() => setShowBulkUpload(false)}
              />
            )}
          </AnimatePresence>


        {/* ✅ UPDATED: Create Song Form (removed category, added audio upload) */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateSong}
              className="bg-gray-800 p-4 sm:p-6 rounded-lg space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <Plus size={20} /> Create New Song
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Title *</label>
                  <input
                    placeholder="Song title"
                    value={createForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setCreateForm(prevForm => ({ 
                        ...prevForm, 
                        title,
                        slug: prevForm.slug === '' || prevForm.slug === generateSlug(prevForm.title) 
                          ? generateSlug(title) 
                          : prevForm.slug,
                      }));
                    }}
                    required
                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Slug *</label>
                  <input
                    placeholder="song-slug"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                    required
                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Description</label>
                  <input
                    placeholder="song-description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Artist</label>
                  <input
                    placeholder="Artist name"
                    value={createForm.artist}
                    onChange={(e) => setCreateForm({ ...createForm, artist: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Tags</label>
                  <input
                    placeholder="comma, separated, tags"
                    value={createForm.tags}
                    onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                  />
                </div>

                
                {/* ✅ Read-Only Playlist Field */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-400 text-sm mb-1">Playlist</label>
                  <div className="w-full p-2 bg-gray-700/50 rounded text-gray-300 border border-gray-600 flex items-center gap-2">
                    <img
                      src={currentPlaylist?.image || currentPlaylist?.artwork_filename}
                      alt="Playlist"
                      className="w-5 h-5 rounded object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                      }}
                    />
                    <span className="text-sm">{currentPlaylist?.title || 'Current Playlist'}</span>
                    <span className="text-xs text-blue-400 ml-auto">Auto-selected</span>
                  </div>
                </div>
              </div>

              {/* ✅ NEW: Audio File Upload */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Audio File</label>
                <input
                  type="text"
                  placeholder="Or paste audio URL"
                  value={createForm.cdn_url}
                  onChange={(e) => setCreateForm({ ...createForm, cdn_url: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white mb-2 text-sm"
                />
                
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="create-song-audio-upload"
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => setSelectedAudioFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="create-song-audio-upload"
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm flex-1 sm:flex-none"
                    >
                      <Upload size={14} />
                      <span className="truncate">
                        {selectedAudioFile ? selectedAudioFile.name : 'Choose Audio File'}
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
                            audioUploadProgress === 100 ? 'bg-green-600' : 'bg-blue-600'
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
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm transition-colors"
                    >
                      {audioUploading ? `Uploading... ${audioUploadProgress}%` : 'Upload Audio'}
                    </button>
                  )}
                </div>
              </div>

              {/* Artwork Upload */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Artwork</label>
                <input
                  type="text"
                  placeholder="Or paste artwork URL"
                  value={createForm.artwork_filename}
                  onChange={(e) => setCreateForm({ ...createForm, artwork_filename: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white mb-2 text-sm"
                />
                
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="create-song-artwork-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setSelectedCreateArtFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="create-song-artwork-upload"
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm flex-1 sm:flex-none"
                    >
                      <Upload size={14} />
                      <span className="truncate">
                        {selectedCreateArtFile ? selectedCreateArtFile.name : 'Choose Image'}
                      </span>
                    </label>
                    
                    {createArtworkKey && (
                      <div className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded text-sm">
                        <CheckCircle size={14} />
                        <span>Uploaded</span>
                      </div>
                    )}
                  </div>

                  {createArtworkUploading && (
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">
                          {createArtworkUploadProgress === 0 ? 'Preparing upload...' : 
                           createArtworkUploadProgress === 100 ? 'Upload Complete!' : 'Uploading...'}
                        </span>
                        <span className="text-xs text-gray-400">{createArtworkUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ease-out ${
                            createArtworkUploadProgress === 100 ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.max(createArtworkUploadProgress, 5)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {selectedCreateArtFile && !createArtworkKey && (
                    <button
                      type="button"
                      onClick={handleCreateArtworkUpload}
                      disabled={createArtworkUploading}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm transition-colors"
                    >
                      {createArtworkUploading ? `Uploading... ${createArtworkUploadProgress}%` : 'Upload Artwork'}
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
                  {creating ? 'Creating…' : 'Create Song'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Add Existing Songs Section */}
        {showAvailable && (
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search available songs by title, artist, tags..."
                    value={availableSongsSearch}
                    onChange={(e) => setAvailableSongsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={availableSongsSort}
                    onChange={(e) => setAvailableSongsSort(e.target.value)}
                    className="px-3 py-2 bg-gray-700 rounded text-white text-sm border-none outline-none"
                  >
                    <option value="title">Sort by Title</option>
                    <option value="artist">Sort by Artist</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                {availableSongsSearch && (
                  <p>
                    Found {filteredAndSortedAvailable.length} song{filteredAndSortedAvailable.length !== 1 ? 's' : ''} 
                    {filteredAndSortedAvailable.length > 0 && ` matching "${availableSongsSearch}"`}
                  </p>
                )}
                {!availableSongsSearch && (
                  <p>Showing {filteredAndSortedAvailable.length} available song{filteredAndSortedAvailable.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
              {filteredAndSortedAvailable.length === 0 ? (
                <div className="col-span-full">
                  <p className="text-gray-400 text-center py-8">
                    {availableSongsSearch 
                      ? `No songs found matching "${availableSongsSearch}"`
                      : 'No songs available to add.'
                    }
                  </p>
                </div>
              ) : (
                filteredAndSortedAvailable.map(song => {
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
              )}
            </div>
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
