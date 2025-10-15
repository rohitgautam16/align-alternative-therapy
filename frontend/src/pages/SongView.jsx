// src/pages/SongView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Share2, ArrowLeft, X, Clock } from 'lucide-react';
import {
  FaTwitter, FaFacebookF, FaLinkedinIn, FaPinterestP, FaTelegramPlane,
} from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { useGetSongBySlugQuery, useRecordPlayMutation } from '../utils/api';
import { setQueue, setTrack, setIsPlaying } from '../store/playerSlice';
import { AnimatePresence, motion } from 'framer-motion';
import { buildImageUrl } from '../utils/imageHelpers';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop';
const FALLBACK_DESC = 'No description available for this track.';

export default function SongView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showShare, setShowShare] = useState(false);

  const { data: song, isLoading, isError } = useGetSongBySlugQuery(slug);
  const [recordPlay] = useRecordPlayMutation();

  // duration loader
  const [durationSec, setDurationSec] = useState(null);
  useEffect(() => {
    if (!song?.audioUrl) { setDurationSec(null); return; }
    const audio = new Audio(song.audioUrl);
    const onLoaded = () => setDurationSec(audio.duration);
    const onError = () => setDurationSec(null);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };
  }, [song?.audioUrl]);

  const fmt = (sec) => {
    if (sec == null || !isFinite(sec)) return '—:—';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  const timeText = fmt(durationSec);

  // ✅ robust image fallback (handles 404s)
  // const [heroImg, setHeroImg] = useState(FALLBACK_IMG);
  // useEffect(() => {
  //   const url = song?.image;
  //   if (!url) { setHeroImg(FALLBACK_IMG); return; }
  //   let cancelled = false;
  //   const img = new Image();
  //   img.onload = () => { if (!cancelled) setHeroImg(url); };
  //   img.onerror = () => { if (!cancelled) setHeroImg(FALLBACK_IMG); };
  //   img.src = url;
  //   return () => { cancelled = true; };
  // }, [song?.image]);

  const handlePlay = () => {
    if (!song) return;
    dispatch(setQueue([song]));
    dispatch(setTrack({
      id:       song.id,
      title:    song.title || song.name,
      artist:   song.artist,
      image:    heroImg,        // use the resolved image
      audioUrl: song.audioUrl,
    }));
    dispatch(setIsPlaying(true));
    recordPlay(song.id);
  };

  if (isLoading) return <div className="text-white text-center py-20">Loading song…</div>;
  if (isError || !song) return <div className="text-red-500 text-center py-20">Error loading song.</div>;

// const heroImg = song?.image
//   ? song.image.startsWith('http')
//     ? song.image.includes('%20')
//       ? song.image // already encoded → leave as-is
//       : song.image.replace(/ /g, '%20') // encode spaces
//     : `https://cdn.align-alternativetherapy.com/align-images/categories/${encodeURIComponent(song.image)}`
//   : song?.artwork_filename
//   ? `https://cdn.align-alternativetherapy.com/align-images/categories/${encodeURIComponent(song.artwork_filename)}`
//   : undefined;

const heroImg = buildImageUrl(
  'https://cdn.align-alternativetherapy.com/align-images/categories',
  song?.image,
  song?.artwork_filename,
  FALLBACK_IMG
);


const bgUrl = heroImg
  ? `linear-gradient(to bottom, rgba(0,0,0,0.4), black), url(${heroImg})`
  : 'transparent';

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: `linear-gradient(to bottom, rgba(0,0,0,0.7), black), url(${heroImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top nav */}
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4">
        <button onClick={() => navigate(-1)} className="text-gray-300 hover:text-white flex items-center gap-2 text-sm sm:text-base">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
        </button>
      </div>

      {/* Header */}
      <div className="p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
        <img
          src={heroImg}
          alt={song.title || song.name}
          className="w-45 h-45 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-lg object-cover shadow-lg"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
          loading="lazy"
          decoding="async"
        />
        <div>
          <p className="text-sm uppercase font-semibold">Track</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold leading-tight">
            {song.name || song.title}
          </h1>
          <p className="mt-2 text-gray-400 text-sm sm:text-base">{song.artist}</p>
          <p className="mt-3 max-w-none sm:max-w-xl text-gray-300 text-base sm:text-lg">
            {song.description || FALLBACK_DESC}
          </p>
          <p className="mt-2 text-sm sm:text-base text-gray-400">
            • Released: {new Date(song.createdAt).toLocaleDateString()} 
            • {song.category || 'Uncategorized'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 md:px-8">
        <button
          onClick={handlePlay}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/70 transition"
        >
          <Play className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
        </button>
        <button
          onClick={() => setShowShare(true)}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700/50 rounded-full flex items-center justify-center hover:bg-white/40 transition"
        >
          <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
      </div>

      {/* Row-like table */}
      <div className="px-4 sm:px-6 md:px-8 py-12">
        {/* Mobile header */}
        <div className="grid md:hidden grid-cols-[32px_1fr_auto_36px] items-center text-gray-400 text-xs border-b border-gray-700 pb-2 mb-2 gap-x-2">
          <span>#</span>
          <span>Title</span>
          <span className="justify-self-end flex items-center gap-1">
            <Clock className="w-4 h-4" /> Time
          </span>
          <span className="sr-only">Play</span>
        </div>

        {/* Tablet/Desktop header */}
        <div className="hidden md:grid md:grid-cols-[50px_minmax(0,1.5fr)_minmax(0,1fr)_84px_100px] lg:grid-cols-[50px_1fr_1fr_80px_120px] items-center text-gray-400 text-sm border-b border-gray-700 pb-2 mb-4">
          <span>#</span>
          <span>Title</span>
          <span>Category</span>
          <Clock />
          <span>Action</span>
        </div>

        {/* Single row */}
        <div
          className="group grid grid-cols-[32px_1fr_auto_36px] md:grid-cols-[50px_minmax(0,1.5fr)_minmax(0,1fr)_84px_100px] lg:grid-cols-[50px_1fr_1fr_80px_120px] items-start md:items-center text-white py-3 px-2 rounded-lg transition hover:bg-secondary/30 cursor-pointer gap-x-2"
          onClick={handlePlay}
        >
          <span className="text-gray-400 text-sm md:text-base leading-6">1</span>

          <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0">
            <img
              src={heroImg}
              alt={song.title || song.name}
              className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover flex-none mt-0.5"
              onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              loading="lazy"
              decoding="async"
            />
            <div className="min-w-0">
              <p className="font-semibold whitespace-normal break-words md:line-clamp-2 md:leading-snug">
                {song.name || song.title}
              </p>
              <p className="text-gray-400 text-xs md:text-sm truncate">{song.artist}</p>
              <div className="mt-1 md:hidden">
                <span className="text-gray-400 text-xs">{song.category || '—'}</span>
              </div>
            </div>
          </div>

          <span className="text-gray-400 text-sm text-right md:hidden leading-6">{timeText}</span>

          <div className="md:hidden flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); handlePlay(); }}
              aria-label="Play"
              className="inline-flex items-center justify-center w-8 h-8 transition"
            >
              <Play className="w-4 h-4 text-white" />
            </button>
          </div>

          <span className="hidden md:block text-gray-400">{song.category || '—'}</span>
          <span className="hidden md:block text-gray-400">{timeText}</span>
          <div className="hidden md:flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); handlePlay(); }}
              className="md:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 bg-white/20 hover:bg-white/40 text-white text-sm px-2 py-1 rounded transition"
            >
              Play
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShare(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-60 p-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div
                className="bg-black/80 p-6 rounded-xl space-y-4 max-w-md w-[90vw] relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowShare(false)}
                  className="absolute top-3 right-3 p-1 hover:bg-secondary/70 rounded transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
                <h2 className="text-white text-xl font-semibold">Share Track</h2>
                <p className="text-gray-300 mb-2">Share via</p>
                <div className="flex flex-wrap gap-3 mb-2">
                  {[FaTwitter, FaFacebookF, FaLinkedinIn, FaPinterestP, FaTelegramPlane].map((Icon, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        window.open(
                          `${Icon === FaTelegramPlane
                            ? 'https://t.me/share/url'
                            : Icon === FaTwitter
                              ? 'https://twitter.com/intent/tweet'
                              : Icon === FaFacebookF
                                ? 'https://www.facebook.com/sharer/sharer.php'
                                : 'https://www.linkedin.com/shareArticle'
                          }?url=${encodeURIComponent(window.location.href)}`
                        )
                      }
                      className="p-2 bg-white/30 rounded-full hover:bg-white/70 transition"
                    >
                      <Icon className="w-6 h-6 text-white" />
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
