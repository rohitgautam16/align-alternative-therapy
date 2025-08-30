// src/pages/PlaylistView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Plus, Share2, Clock, ArrowLeft, ArrowRight, X,
} from 'lucide-react';
import {
  FaTwitter, FaFacebookF, FaLinkedinIn, FaPinterestP, FaTelegramPlane,
} from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import {
  useGetCategoriesQuery,
  useGetDashboardAllPlaylistsQuery,
  useGetSongsQuery,
  useGetUserQuery,
  useRecordPlayMutation
} from '../utils/api';
import { setQueue, setTrack, setIsPlaying } from '../store/playerSlice';

const FALLBACK_BG = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';
const FALLBACK_DESC = 'No description available for this playlist.';
const FALLBACK_SONG_IMG = FALLBACK_BG;


const myPlaylistsStub = [
  { id: 'mpl1', name: 'Chill Vibes' },
  { id: 'mpl2', name: 'Workout Mix' },
  { id: 'mpl3', name: 'Road Trip' },
];

export default function PlaylistView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const { data: allPlaylists = [], isLoading: plLoading, isError: plError } = useGetDashboardAllPlaylistsQuery();
  const playlist = allPlaylists.find(p => p.slug === slug);

  const [recordPlay] = useRecordPlayMutation();


  const { data: songs = [], isLoading: songsLoading, isError: songsError } = useGetSongsQuery(playlist?.id);


  const { data: categories = [] } = useGetCategoriesQuery();

  const { data: user, isLoading: userLoading } = useGetUserQuery();


  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);


  const [durations, setDurations] = useState({});


  useEffect(() => {
    songs.forEach(song => {
      if (!durations[song.id]) {
        const audio = new Audio(song.audioUrl);
        audio.addEventListener('loadedmetadata', () => {
          setDurations(d => ({ ...d, [song.id]: audio.duration }));
        });
      }
    });
  }, [songs]);

  if (plLoading || songsLoading || userLoading || !playlist) {
    return <div className="text-white text-center py-20">Loading playlist…</div>;
  }
  if (plError || songsError) {
    return <div className="text-red-500 text-center py-20">Error loading playlist.</div>;
  }

 
  // const locked = user.subscriptionTier === 'free' && !playlist.isFree;
  // if (locked) {
  //   return <div className="p-6 text-center text-white">This playlist is locked. Subscribe to access.</div>;
  // }


  const categoryObj = categories.find(c => c.id === playlist.categoryId);
  const categoryName = categoryObj?.title || '—';

  
  const fmt = sec => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  
  const handlePlaySong = (song) => {
  
  dispatch(setQueue(songs));

  
  dispatch(setTrack({
    id:       song.id,
    title:    song.name || song.title,
    artist:   song.artistName,
    image:    song.image || FALLBACK_BG,
    audioUrl: song.audioUrl,
    audio_src: song.audio_src
  }));

  
  dispatch(setIsPlaying(true));
  recordPlay(song.id);
};


  
  const toggleSelect = mplId =>
    setSelectedIds(prev => prev.includes(mplId) ? prev.filter(x => x !== mplId) : [...prev, mplId]);
  const handleAdd = () => {
    console.log('Add song', playlist.id, 'to playlists', selectedIds);
    setShowAddMenu(false);
    setSelectedIds([]);
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: `linear-gradient(to bottom, rgba(0,0,0,0.7), black), url(${playlist.image || FALLBACK_BG})`,
        backgroundSize: 'cover',
      }}
    >
      
      <div className="flex justify-between px-8 py-4">
        <button onClick={() => navigate(-1)} className="text-gray-300 hover:text-white flex items-center gap-2">
          <ArrowLeft /> Back
        </button>
        <button onClick={() => navigate('/dashboard')} className="text-gray-300 hover:text-white flex items-center gap-2">
          <ArrowRight /> All Playlists
        </button>
      </div>

      {/* Header */}
      <div className="p-8 flex items-end gap-6">
        <img src={playlist.image || FALLBACK_BG} alt={playlist.name} className="w-48 h-48 rounded-lg object-cover shadow-lg"/>
        <div>
          <p className="text-sm uppercase font-semibold">Playlist</p>
          <h1 className="text-5xl font-semibold">{playlist.name}</h1>
          <p className="mt-2 max-w-lg text-gray-300">{playlist.description || FALLBACK_DESC}</p>
          <p className="mt-2 text-sm text-gray-400">
            • {playlist.saveCount?.toLocaleString()||0} saves • {songs.length} songs
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 px-8">
        <button
          onClick={() => handlePlaySong(songs[0], 0)}
          className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/70 transition"
        >
          <Play className="w-8 h-8 text-black"/>
        </button>

        
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(v => !v)}
            className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center hover:bg-white/40 transition"
          >
            <Plus className="w-6 h-6 text-white"/>
          </button>
          <div className={`absolute top-14 bg-black/90 rounded-lg shadow-lg p-6 transform transition-all duration-200 origin-top-left ${showAddMenu ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
            <p className="mb-2 text-white font-semibold">Add to playlist</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {myPlaylistsStub.map(mpl => (
                <label key={mpl.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(mpl.id)}
                    onChange={() => toggleSelect(mpl.id)}
                    className="accent-secondary"
                  />
                  <span className="text-white">{mpl.name}</span>
                </label>
              ))}
            </div>
            {selectedIds.length > 0 && (
              <button
                onClick={handleAdd}
                className="mt-3 w-full bg-secondary py-2 rounded-lg hover:bg-secondary/70 transition"
              >
                Add to Selected
              </button>
            )}
          </div>
        </div>

        {/* Full‐screen share */}
        <button
          onClick={() => setShowShareModal(true)}
          className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center hover:bg-white/40 transition"
        >
          <Share2 className="w-6 h-6 text-white"/>
        </button>
      </div>

      {/* Song table */}
      <div className="px-8 pb-12">
        <div className="grid grid-cols-[50px_1fr_1fr_80px_100px] items-center text-gray-400 text-sm border-b border-gray-700 pb-2 mb-4">
          <span>#</span>
          <span>Title</span>
          <span>Category</span>
          <Clock />
          <span>Details</span>
        </div>

      {songs.map((song, idx) => (
        <div
          key={song.id}
          className="group grid grid-cols-[50px_1fr_1fr_80px_100px] items-center text-white py-2 px-2 rounded-lg transition hover:bg-secondary/30 cursor-pointer"
          onClick={() => handlePlaySong(song, idx)}
        >
          {/* 1: Track # */}
          <span className="text-gray-400">{idx + 1}</span>

          {/* 2: Title + artwork */}
          <div className="flex items-center gap-4">
            <img
              src={song.image || FALLBACK_SONG_IMG}
              alt={song.name || song.title}
              className="w-12 h-12 rounded-md object-cover"
            />
            <div>
              <p className="font-semibold">{song.name || song.title}</p>
              <p className="text-gray-400 text-sm">{song.artistName}</p>
            </div>
          </div>

          {/* 3: Category */}
          <span className="text-gray-400">{categoryName}</span>

          {/* 4: Duration */}
          <span className="text-gray-400">
            {durations[song.id] != null ? fmt(durations[song.id]) : '––:––'}
          </span>

          {/* 5: View Details button in its own column */}
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                navigate(`/dashboard/song/${song.id}`)  // make sure this matches your route
              }}
              className="opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/40 text-white text-sm px-2 py-1 rounded transition"
            >
              View Details
            </button>
          </div>
        </div>
      ))}


      </div>

      
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-400 ${showShareModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowShareModal(false)}
      >
        <div
          className={`bg-black/80 rounded-lg w-90 p-6 space-y-6 transform transition-all duration-400 ease-out ${showShareModal ? 'scale-100 opacity-100' : 'scale-25 opacity-0'}`}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setShowShareModal(false)}
            className="absolute top-3 right-3 p-1 hover:bg-secondary/70 rounded transition"
          >
            <X className="w-5 h-5 text-gray-400"/>
          </button>
          <h2 className="text-white text-xl font-semibold">Share</h2>
          <p className="text-gray-300 mb-2">Share link via</p>
          <div className="flex space-x-3 mb-4">
            {[FaTwitter, FaFacebookF, FaLinkedinIn, FaPinterestP, FaTelegramPlane].map((Icon, i) => (
              <button
                key={i}
                onClick={() => window.open(`https://share.example.com/${Icon.displayName}?url=${encodeURIComponent(window.location.href)}`)}
                className="p-2 bg-white/30 rounded-full hover:bg-white/50 cursor-pointer transition"
              >
                <Icon className="w-6 h-6 text-white hover:text-secondary/70 transition-colors"/>
              </button>
            ))}
          </div>
          <div>
            <p className="text-gray-300 mb-2">Copy direct link</p>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex items-center justify-center w-full py-2 bg-white/30 hover:bg-secondary/70 text-gray-200 rounded transition"
            >
              <FaTelegramPlane className="w-5 h-5 mr-2"/> Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
