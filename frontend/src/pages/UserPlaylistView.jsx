// src/pages/UserPlaylistView.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate }            from 'react-router-dom';
import { useDispatch }                        from 'react-redux';
import {
  Play, Clock, ArrowLeft, Edit3, Save, Trash2,
  Plus, X, CheckCircle, AlertCircle, Lock
} from 'lucide-react';
import { motion, AnimatePresence }            from 'framer-motion';
import {
  useGetUserPlaylistBySlugQuery,
  useUpdateUserPlaylistMutation,
  useDeleteUserPlaylistMutation,
  useAddSongToUserPlaylistMutation,
  useRemoveSongFromUserPlaylistMutation,
  useGetAllSongsQuery,
  useGetDashboardAllPlaylistsQuery,
  useRecordPlayMutation
} from '../utils/api';
import { setQueue, setTrack, setIsPlaying }   from '../store/playerSlice';
import useAuthUser                           from 'react-auth-kit/hooks/useAuthUser';

const FALLBACK_BG   = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';
const FALLBACK_DESC = 'No description available for this playlist.';

export default function UserPlaylistView() {
  const { slug }    = useParams();
  const nav         = useNavigate();
  const dispatch    = useDispatch();
  const user        = useAuthUser();
  const isSub       = Number(user?.is_subscribed) === 1;

  // — DATA —
  const { data: playlist = {}, isLoading, isError, refetch } =
    useGetUserPlaylistBySlugQuery(slug, {
      transformResponse: (res) => res.playlist,
      refetchOnMountOrArgChange: true,
    });

  const [recordPlay] = useRecordPlayMutation();

  const { data: allSongs = [] }   = useGetAllSongsQuery();
  const { data: allPLs   = [] }   = useGetDashboardAllPlaylistsQuery();
  const paidById = useMemo(() => {
    return allPLs.reduce((m, p) => {
      m[p.id] = p.paid === 1;
      return m;
    }, {});
  }, [allPLs]);

  // — MUTATIONS —
  const [renamePL, { isLoading: renaming }] = useUpdateUserPlaylistMutation();
  const [deletePL]                          = useDeleteUserPlaylistMutation();
  const [addSong]                           = useAddSongToUserPlaylistMutation();
  const [removeSong]                        = useRemoveSongFromUserPlaylistMutation();

  // — UI STATE —
  const [editMode, setEditMode]     = useState(false);
  const [title, setTitle]           = useState('');
  const [flash, setFlash]           = useState({ txt:'', ok:true });
  const [showDelete, setShowDelete] = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [search, setSearch]         = useState('');
  const [durations, setDurations]   = useState({});

  const lastRecordedRef = useRef({ songId: null, ts: 0 });

  // initialize title
  useEffect(() => {
    if (playlist.title) setTitle(playlist.title);
  }, [playlist.title]);

  // clear flash
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(()=>setFlash({txt:'', ok:true}),3000);
      return ()=>clearTimeout(t);
    }
  }, [flash]);

  // preload durations
  useEffect(() => {
    (playlist.songs || []).forEach(s => {
      if (!durations[s.id]) {
        const a = new Audio(s.audioUrl);
        a.addEventListener('loadedmetadata', () =>
          setDurations(d => ({ ...d, [s.id]: a.duration }))
        );
      }
    });
  }, [playlist.songs, durations]);

  if (isLoading) return <div className="text-white text-center py-20">Loading…</div>;
  if (isError)   return <div className="text-red-500 text-center py-20">Error loading playlist.</div>;

  const fmt = sec => {
    const m = Math.floor(sec/60), s = Math.floor(sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };

  // — ACTIONS —
  const doRename = async () => {
    try {
      const updated = await renamePL({ id: playlist.id, title }).unwrap();
      setFlash({ txt:'Renamed!', ok:true });
      setEditMode(false);
      if (updated.slug && updated.slug !== slug) {
        nav(`/dashboard/user-playlist/${updated.slug}`, { replace: true });
      }
    } catch {
      setFlash({ txt:'Rename failed', ok:false });
    }
  };

  const doDelete = async () => {
    try {
      await deletePL(playlist.id).unwrap();
      setFlash({ txt:'Deleted!', ok:true });
      setTimeout(()=>nav('/dashboard'),500);
    } catch {
      setFlash({ txt:'Delete failed', ok:false });
    }
  };

  const doAdd = async songId => {
    try {
      await addSong({ playlistId: playlist.id, songId }).unwrap();
      setFlash({ txt:'Added!', ok:true });
      setAddOpen(false);
      refetch();
    } catch {
      setFlash({ txt:'Add failed', ok:false });
    }
  };

  const doRemove = async songId => {
    try {
      await removeSong({ playlistId: playlist.id, songId }).unwrap();
      setFlash({ txt:'Removed!', ok:true });
      refetch();
    } catch {
      setFlash({ txt:'Remove failed', ok:false });
    }
  };

  const playSong = async (song) => {
    if (!song) return;

    // start playing immediately (optimistic)
    dispatch(setQueue(playlist.songs || []));
    dispatch(setTrack({
      id: song.id,
      title: song.title,
      artist: song.artist,
      image: song.image,
      audioUrl: song.audioUrl
    }));
    dispatch(setIsPlaying(true));

    // debounce guard
    const now = Date.now();
    if (lastRecordedRef.current.songId === song.id && (now - lastRecordedRef.current.ts) < RECORD_DEBOUNCE_MS) {
      return;
    }
    lastRecordedRef.current = { songId: song.id, ts: now };

    // attempt to record play with playlist context
    try {
      await recordPlay({ songId: song.id, sourcePlaylistId: playlist.id }).unwrap();
    } catch (err) {
      console.error('recordPlay failed', err);
      // do not block playback; optionally you could refetch recent lists or show a small toast
    }
  };

  const filtered = allSongs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen text-white"
    style={{
          background: `linear-gradient(to bottom,rgba(0,0,0,0.7),black),
                        url(${playlist.image||FALLBACK_BG})`,
          backgroundSize: 'cover'
        }}>

      {/* Flash */}
      <AnimatePresence>
        {flash.txt && (
          <motion.div
            className={`p-2 text-center ${flash.ok?'bg-green-600':'bg-red-600'}`}
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
          >
            {flash.txt}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4">
        <button onClick={()=>nav(-1)} className="text-gray-300 hover:text-white flex items-center gap-2 text-sm sm:text-base">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
        </button>
        <button
          onClick={()=>setShowDelete(true)}
          className="p-1 bg-red-700 rounded hover:bg-red-600"
        >
          <Trash2 size={16}/>
        </button>
      </div>

      {/* Header - matching PlaylistView exactly */}
      <div className="p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
        <img
          src={playlist.image||FALLBACK_BG}
          alt={playlist.title}
          className="w-45 h-45 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-lg object-cover shadow-lg"
        />
        <div>
          <p className="text-sm uppercase font-semibold text-gray-400">Playlist</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold leading-tight">{playlist.title}</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-400">
            • {(playlist.songs||[]).length} songs
          </p>
        </div>
      </div>

      {/* Add-Song Dropdown */}
      <div className="px-4 sm:px-6 md:px-8 py-4">
        <div className="relative">
          <input
            readOnly
            onClick={() => setAddOpen(o => !o)}
            placeholder="Search & add songs… "
            className="w-full sm:w-fit p-2 bg-secondary/50 rounded text-white cursor-pointer text-sm sm:text-base"
          />
          {addOpen && (
            <div className="absolute top-full left-0 right-0 sm:right-auto sm:min-w-[400px] max-h-64 overflow-y-auto bg-gray-800 rounded mt-1 z-10 shadow-xl">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter songs..."
                className="w-full p-2 bg-secondary/30 text-white rounded-t text-sm"
              />
              {filtered.map(s => {
                const locked = paidById[s.playlistId] && !isSub;
                const imgSrc = s.image || FALLBACK_BG;

                return (
                  <div
                    key={s.id}
                    onClick={() => !locked && doAdd(s.id)}
                    className={`flex items-center justify-between p-2 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition ${
                      locked ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full min-w-0">
                      <img
                        src={imgSrc}
                        alt={s.title}
                        onError={e => (e.target.src = FALLBACK_BG)}
                        className="w-10 h-10 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {locked && <Lock size={14} className="text-white flex-shrink-0" />}
                          <span className="truncate text-white text-sm">{s.title}</span>
                        </div>
                        <span className="text-xs text-gray-400 truncate">{s.artist}</span>
                      </div>
                      {!locked && (
                        <Plus
                          size={16}
                          className="text-white opacity-70 hover:opacity-100 flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="p-2 text-gray-400 text-sm">No songs found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Songs Table */}
      <div className="px-4 sm:px-6 md:px-8 py-12">
        {/* Mobile header */}
        <div className="grid md:hidden grid-cols-[32px_1fr_auto_60px] items-center text-gray-400 text-xs border-b border-gray-700 pb-2 mb-2 gap-x-2">
          <span>#</span>
          <span>Title</span>
          <span className="flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
          </span>
          <span className="text-center">Action</span>
        </div>

        {/* Desktop header */}
        <div className="hidden md:grid grid-cols-[50px_1fr_1fr_80px_100px] items-center text-gray-400 text-sm border-b border-gray-700 pb-2 mb-4">
          <span>#</span>
          <span>Title</span>
          <span>Artist</span>
          <Clock />
          <span>Details</span>
        </div>

        {/* Song rows */}
        {(playlist.songs||[]).map((s,i)=>(  
          <div key={s.id}
            className="group 
                       grid grid-cols-[32px_1fr_auto_60px]
                       md:grid-cols-[50px_1fr_1fr_80px_100px]
                       items-start md:items-center 
                       text-white py-3 md:py-2 px-1 rounded-lg
                       hover:bg-secondary/30 cursor-pointer transition gap-x-1 md:gap-x-0"
            onClick={()=>playSong(s)}
          >
            {/* Track # */}
            <span className="text-gray-400 text-sm md:text-base leading-6">{i+1}</span>
            
            {/* Title + Image */}
            <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0">
              <img 
                src={s.image||FALLBACK_BG} 
                alt={s.title}
                onError={e => (e.target.src = FALLBACK_BG)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover flex-shrink-0 mt-0.5"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm md:text-base whitespace-normal break-words md:line-clamp-2 md:leading-snug">
                  {s.title}
                </p>
                <p className="text-gray-400 text-xs md:text-sm truncate">{s.artist}</p>
              </div>
            </div>
            
            {/* Duration - mobile (3rd col) */}
            <span className="text-gray-400 text-xs md:hidden text-right leading-6">
              {durations[s.id]!=null?fmt(durations[s.id]):'––:––'}
            </span>

            {/* Actions - mobile (4th col) */}
            <div className="md:hidden flex items-start justify-center gap-1">
              <button 
                onClick={e=>{e.stopPropagation();nav(`/dashboard/song/${s.id}`);}}
                className="text-white text-[10px] px-1.5 py-1 bg-white/20 hover:bg-white/40 rounded transition"
              >
                View
              </button>
              <button 
                onClick={e=>{e.stopPropagation();doRemove(s.id);}}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <X size={12}/>
              </button>
            </div>

            {/* Desktop columns */}
            <span className="hidden md:block text-gray-400 text-sm">{s.artist}</span>
            <span className="hidden md:block text-gray-400">
              {durations[s.id]!=null?fmt(durations[s.id]):'––:––'}
            </span>
            
            {/* Desktop actions */}
            <div className="hidden md:flex justify-end opacity-0 group-hover:opacity-100 gap-2">
              <button 
                onClick={e=>{e.stopPropagation();nav(`/dashboard/song/${s.id}`);}}
                className="bg-white/20 hover:bg-white/40 text-white
                           text-sm px-2 py-1 rounded transition"
              >
                View
              </button>
              <button 
                onClick={e=>{e.stopPropagation();doRemove(s.id);}}
                className="text-red-400 hover:underline text-sm flex items-center gap-1"
              >
                <X size={14}/> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {showDelete && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40" initial={{opacity:0}}
              animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>setShowDelete(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}}
              exit={{scale:0.8,opacity:0}}
            >
              <div className="bg-gray-900 p-6 rounded-lg space-y-4 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
                <p className="text-gray-300">Delete "{playlist.title}"?</p>
                <div className="flex justify-end gap-2">
                  <button onClick={()=>setShowDelete(false)}
                          className="px-4 py-2 bg-gray-700 rounded text-white text-sm">
                    Cancel
                  </button>
                  <button onClick={doDelete}
                          className="px-4 py-2 bg-red-600 rounded text-white text-sm">
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
