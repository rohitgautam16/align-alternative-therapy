// src/pages/UserPlaylistView.jsx
import React, { useState, useEffect, useMemo } from 'react';
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

  const playSong = song => {
    dispatch(setQueue(playlist.songs));
    dispatch(setTrack({
      id: song.id,
      title: song.title,
      artist: song.artist,
      image: song.image,
      audioUrl: song.audioUrl
    }));
    dispatch(setIsPlaying(true));
    recordPlay(song.id);
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
      <div className="flex justify-between items-center px-6 py-4">
        <button onClick={()=>nav(-1)} className="flex items-center gap-1 text-gray-300 hover:text-white">
          <ArrowLeft size={20}/> Back
        </button>
        <div className="flex items-center gap-3">
          {/* {!editMode
            ? <h1 className="text-2xl font-bold flex items-center gap-1">
                {playlist.title}
                <Edit3 size={18} className="opacity-50 hover:opacity-100 cursor-pointer"
                  onClick={()=>setEditMode(true)}
                />
              </h1>
            : <input
                value={title}
                onChange={e=>setTitle(e.target.value)}
                className="p-1 bg-gray-700 rounded text-white w-48"
              />
          }
          {editMode && (
            <button
              onClick={doRename} disabled={renaming}
              className="p-1 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50"
            >
              <Save size={16}/>
            </button>
          )} */}
          <button
            onClick={()=>setShowDelete(true)}
            className="p-1 bg-red-700 rounded hover:bg-red-600"
          >
            <Trash2 size={16}/>
          </button>
        </div>
      </div>

      {/* Header */}
      <div
        className="flex items-end gap-6 px-6 py-8"
        
      >
        <img
          src={playlist.image||FALLBACK_BG}
          alt={playlist.title}
          className="w-48 h-48 rounded-lg object-cover shadow-lg"
        />
        <div>
          <p className="text-sm uppercase text-gray-400">Playlist</p>
          <h2 className="text-4xl font-semibold">{playlist.title}</h2>
          {/* <p className="mt-2 text-gray-300 max-w-lg">
            {playlist.description || FALLBACK_DESC}
          </p> */}
        </div>
      </div>

      {/* Add‑Song Dropdown */}
      <div className="px-6 py-4">
        <div className="relative">
          <input
            readOnly
            onClick={()=>setAddOpen(o=>!o)}
            placeholder="Search & add songs… "
            className="w-fit p-2 bg-secondary/50 rounded text-white cursor-pointer"
          />
          {addOpen && (
            <div className="absolute top-full left-0 right-0 max-h-64 overflow-y-auto bg-gray-800 rounded mt-1 z-10">
              <input
                type="text"
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Filter songs..."
                className="w-full p-2 bg-secondary/30 text-white rounded-t"
              />
              {filtered.map(s => {
                const locked = paidById[s.playlistId] && !isSub;
                return (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-secondary/30 hover:bg-secondary/50">
                    <div className="flex items-center gap-2">
                      {locked && <Lock size={14} className="text-white"/>}
                      <span className={locked?'text-white truncate':'truncate'}>
                        {s.title}
                      </span>
                    </div>
                    <button
                      onClick={()=>!locked && doAdd(s.id)}
                      disabled={locked}
                      className={`p-1 rounded ${locked?'opacity-50':'bg-red-600 hover:bg-red-700'}`}
                    >
                      <Plus size={14}/>
                    </button>
                  </div>
                );
              })}
              {filtered.length===0 && <div className="p-2 text-gray-400">No songs found.</div>}
            </div>
          )}
        </div>
      </div>

      {/* Songs Table */}
      <div className="px-8 pb-12">
        <div className="grid grid-cols-[50px_1fr_1fr_80px_100px] items-center text-gray-400 text-sm border-b border-gray-700 pb-2 mb-4">
          <span>#</span><span>Title</span><span>Artist</span><Clock/><span>Details</span>
        </div>
        {(playlist.songs||[]).map((s,i)=>(  
          <div key={s.id}
            className="group grid grid-cols-[50px_1fr_1fr_80px_100px]
                       items-center text-white py-2 px-2 rounded-lg
                       hover:bg-red-700/30 cursor-pointer transition"
            onClick={()=>playSong(s)}
          >
            <span className="text-gray-400">{i+1}</span>
            <div className="flex items-center gap-4">
              <img src={s.image||FALLBACK_BG} alt={s.title}
                   className="w-12 h-12 rounded-md object-cover"/>
              <p className="font-semibold">{s.title}</p>
            </div>
            <span className="text-gray-400 text-sm">{s.artist}</span>
            <span className="text-gray-400">
              {durations[s.id]!=null?fmt(durations[s.id]):'––:––'}
            </span>
            <div className="flex justify-end opacity-0 group-hover:opacity-100 gap-2">
              <button onClick={e=>{e.stopPropagation();nav(`/dashboard/song/${s.id}`);}}
                      className="bg-white/20 hover:bg-white/40 text-white
                                 text-sm px-2 py-1 rounded transition">
                View
              </button>
              <button onClick={e=>{e.stopPropagation();doRemove(s.id);}}
                      className="text-red-400 hover:underline text-sm">
                <X size={14}/> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Delete */}
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
                <p className="text-gray-300">Delete “{playlist.title}”?</p>
                <div className="flex justify-end gap-2">
                  <button onClick={()=>setShowDelete(false)}
                          className="px-4 py-2 bg-gray-700 rounded text-white">
                    Cancel
                  </button>
                  <button onClick={doDelete}
                          className="px-4 py-2 bg-red-600 rounded text-white">
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
