// src/pages/PlaylistView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Plus, Share2, Clock, ArrowLeft, ArrowRight, X, Eye,
} from 'lucide-react'; // ⬅️ added Eye
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
const FALLBACK_DESC = '';
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
  const [activeTooltip, setActiveTooltip] = useState(null);

  const [showDescModal, setShowDescModal] = useState(false);
  const [isDescTruncated, setIsDescTruncated] = useState(false);
  const descRef = React.useRef(null);

  useEffect(() => {
    if (descRef.current) {
      const el = descRef.current;
      setIsDescTruncated(el.scrollHeight > el.clientHeight + 5);
    }
  }, [playlist?.description]);

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

  useEffect(() => {
  const closeTooltip = () => setActiveTooltip(null);
  window.addEventListener('click', closeTooltip);
  return () => window.removeEventListener('click', closeTooltip);
}, []);


  if (plLoading || songsLoading || userLoading || !playlist) {
    return <div className="text-white text-center py-20">Loading playlist…</div>;
  }
  if (plError || songsError) {
    return <div className="text-red-500 text-center py-20">Error loading playlist.</div>;
  }

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
      audio_src: song.audio_src,
      description: song.description,
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

  
  const bgImage = playlist?.image
    ? playlist.image.startsWith('http')
      ? playlist.image.includes('%20')
        ? playlist.image // already encoded → leave as-is
        : playlist.image.replace(/ /g, '%20') // encode only spaces
      : `https://cdn.align-alternativetherapy.com/align-images/playlists/${encodeURIComponent(playlist.image)}`
    : playlist?.artwork_filename
    ? `https://cdn.align-alternativetherapy.com/align-images/playlists/${encodeURIComponent(playlist.artwork_filename)}`
    : undefined;


  const bgUrl = bgImage
    ? `linear-gradient(to bottom, rgba(0,0,0,0.4), black), url(${bgImage})`
    : 'transparent';

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: bgUrl, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Top nav */}
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4">
        <button onClick={() => navigate(-1)} className="text-gray-300 hover:text-white flex items-center gap-2 text-sm sm:text-base">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
        </button>
        {/* <button onClick={() => navigate('/dashboard')} className="text-gray-300 hover:text-white flex items-center gap-2 text-sm sm:text-base">
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" /> All Playlists
        </button> */}
      </div>


      <div className="p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
        <img
          src={playlist.image || FALLBACK_BG}
          alt={playlist.name}
          className="w-45 h-45 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-lg object-cover shadow-lg"
        />
        <div>
          <p className="text-sm uppercase font-semibold">Playlist</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold leading-tight">{playlist.name}</h1>
          <p 
           className="mt-2 max-w-none sm:max-w-lg text-gray-300 text-base sm:text-lg line-clamp-3"
           ref={descRef}
            >
            {playlist.description || FALLBACK_DESC}
          </p>
          {isDescTruncated && (
            <button
              onClick={() => setShowDescModal(true)}
              className="mt-2 text-secondary cursor pointer font-medium hover:underline"
            >
              Read more
            </button>
          )}

          {/* Read More Modal */}
          <div
            className={`fixed inset-0 z-200 flex items-center justify-center bg-black/40 backdrop-blur-lg transition-all duration-300 ${
              showDescModal ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-0 pointer-events-none'
            }`}
            onClick={() => setShowDescModal(false)}
          >
            <div
              className="relative bg-black/30 backdrop-blur-lg rounded-xl w-[85vw] h-[75vh] overflow-x-scroll max-w-3xl p-6 sm:p-8 text-gray-200 transform transition-all duration-300 ease-out"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDescModal(false)}
                className="absolute top-3 right-3 p-1 hover:bg-secondary/70 rounded transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <h3 className="text-2xl pt-4 sm:text-3xl text-secondary font-semibold mb-3">About {playlist.name}</h3>
              <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                {playlist.description}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm sm:text-base text-gray-400">
            {/* • {playlist.saveCount?.toLocaleString()||0} saves  */}
            • {songs.length} songs
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 md:px-8">
        <button
          onClick={() => handlePlaySong(songs[0], 0)}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/70 transition"
        >
          <Play className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
        </button>

        {/* <div className="relative">
          <button
            onClick={() => setShowAddMenu(v => !v)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/50 rounded-full flex items-center justify-center hover:bg-white/40 transition"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <div className={`absolute left-0 top-12 sm:top-14 w-64 sm:w-72 bg-black/90 rounded-lg shadow-lg p-6 transform transition-all duration-200 origin-top-left ${showAddMenu ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
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
        </div> */}

        <button
          onClick={() => setShowShareModal(true)}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/50 rounded-full flex items-center justify-center hover:bg-white/40 transition"
        >
          <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
      </div>

      {/* Song list */}
      <div className="px-4 sm:px-6 md:px-8 py-12">
        {/* Mobile header */}
        <div className="grid md:hidden grid-cols-[32px_1fr_auto_32px] items-center text-gray-400 text-xs border-b border-gray-700 pb-2 mb-2 gap-x-2">
          <span>#</span>
          <span>Title</span>
          <span className="justify-self-end flex items-center gap-1">
            <Clock className="w-4 h-4" /> Time
          </span>
          <span className="sr-only">View</span>
        </div>

        {/* Tablet/Desktop header row */}
        <div className="hidden md:grid md:grid-cols-[50px_minmax(0,1.5fr)_minmax(0,1fr)_84px_120px] lg:grid-cols-[50px_1fr_1fr_80px_120px] items-center text-gray-400 text-sm border-b border-gray-700 pb-2 mb-4">
          <span>#</span>
          <span>Title</span>
          <span>Category</span>
          <Clock />
          <span>Details</span>
        </div>

        {songs.map((song, idx) => {
          const durationText = durations[song.id] != null ? fmt(durations[song.id]) : '––:––';
          return (
            <div
              key={song.id}
              className="group grid grid-cols-[32px_1fr_auto_32px] md:grid-cols-[50px_minmax(0,1.5fr)_minmax(0,1fr)_84px_120px] lg:grid-cols-[50px_1fr_1fr_80px_120px] items-start md:items-center text-white py-3 px-1 rounded-lg transition hover:bg-secondary/30 cursor-pointer gap-x-1"
              onClick={() => handlePlaySong(song, idx)}
            >
              {/* # */}
              <span className="text-gray-400 text-sm md:text-base leading-6">{idx + 1}</span>

              {/* Title + artwork */}
              <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0">
                <img
                  src={song.image || FALLBACK_SONG_IMG}
                  onError={(e) => { e.currentTarget.src = FALLBACK_SONG_IMG; }}
                  alt={song.name || song.title}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover flex-none mt-0.5"
                />
                <div className="min-w-0">
                  {/* mobile: wrap; tablet: clamp to 2 lines; desktop: can be single line by design */}
                  <p className="font-semibold whitespace-normal break-words md:line-clamp-2 md:leading-snug">
                    {song.name || song.title}
                  </p>
                  <p className="text-gray-400 text-xs md:text-sm truncate">{song.artistName}</p>

                  {/* category under title on mobile */}
                  <div className="mt-1 md:hidden">
                    <span className="text-gray-400 text-xs">{categoryName}</span>
                  </div>
                </div>
              </div>

              {/* Time (mobile 3rd col) */}
              <span className="text-gray-400 text-sm text-right md:hidden leading-6">{durationText}</span>

              {/* Eye (mobile 4th col) */}
              <div className="md:hidden flex justify-end">
                <div className="relative overflow-visible">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTooltip(activeTooltip === song.id ? null : song.id);
                    }}
                    aria-label="View details"
                    className="inline-flex items-center justify-center w-8 h-8 transition"
                  >
                    <Eye className="w-4 h-4 text-white" />
                  </button>

                  {/* Tooltip Popup */}
                  {activeTooltip === song.id && (
                    <div
                      className="absolute bottom-full right-0 mt-2 w-64 p-6 bg-transparent backdrop-blur-lg border border-gray-700 rounded-lg shadow-xl z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-gray-200 text-sm line-clamp-4">
                        {song.description || 'No description available.'}
                      </p>
                      <button
                        onClick={() => navigate(`/dashboard/song/${song.slug}`)}
                        className="mt-3 w-full text-sm bg-secondary hover:bg-secondary/80 text-black font-semibold py-1.5 rounded transition"
                      >
                        View more
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tablet/Desktop columns */}
              <span className="hidden md:block text-gray-400">{categoryName}</span>
              <span className="hidden md:block text-gray-400">{durationText}</span>

              {/* Details button: visible on md, hover-only on lg+ */}
              <div className="hidden md:flex justify-start">
                <div className="relative overflow-visible">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTooltip(activeTooltip === song.id ? null : song.id);
                    }}
                    className="md:opacity-100 flex flex-row items-center cursor-pointer gap-1 lg:opacity-0 lg:group-hover:opacity-100 px-2 py-1 rounded transition"
                  >
                    <Eye className="w-6 h-6 text-white" />
                  </button>

                  {/* Tooltip Popup */}
                  {activeTooltip === song.id && (
                    <div
                      className="absolute bottom-full right-0 mt-2 w-64 p-6 bg-transparent backdrop-blur-lg border border-gray-700 rounded-lg shadow-xl z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-gray-200 text-sm line-clamp-4">
                        {song.description || 'No description available.'}
                      </p>
                      <button
                        onClick={() => navigate(`/dashboard/song/${song.slug}`)}
                        className="mt-3 w-full text-sm bg-secondary hover:bg-secondary/80 text-black font-semibold py-1.5 rounded transition"
                      >
                        View more
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${showShareModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowShareModal(false)}
      >
        <div
          className={`relative bg-black/80 rounded-xl w-[90vw] max-w-md sm:max-w-lg p-5 sm:p-6 space-y-5 transform transition-all duration-300 ease-out ${showShareModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setShowShareModal(false)}
            className="absolute top-3 right-3 p-1 hover:bg-secondary/70 rounded transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-white text-lg sm:text-xl font-semibold">Share</h2>
          <p className="text-gray-300">Share link via</p>
          <div className="flex flex-wrap gap-3">
            {[FaTwitter, FaFacebookF, FaLinkedinIn, FaPinterestP, FaTelegramPlane].map((Icon, i) => (
              <button
                key={i}
                onClick={() => window.open(`https://share.example.com/${Icon.displayName}?url=${encodeURIComponent(window.location.href)}`)}
                className="p-2 bg-white/30 rounded-full hover:bg-white/50 transition"
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            ))}
          </div>
          <div>
            <p className="text-gray-300 mb-2">Copy direct link</p>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex items-center justify-center w-full py-2 bg-white/30 hover:bg-secondary/70 text-gray-200 rounded transition"
            >
              <FaTelegramPlane className="w-5 h-5 mr-2" /> Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
