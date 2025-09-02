// src/components/music/PlayerUIMobile.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'react-slick';
import {
  Shuffle, SkipBack, PlayCircle, PauseCircle, SkipForward, Repeat,
  Volume2, ChevronDown, ChevronUp
} from 'lucide-react';

// slick CSS (ensure imported once in your app)
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const FULL = '100vh';

function fmt(sec = 0) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}

/**
 * Mobile player (collapsed bar + fullscreen).
 * - Center-mode Slick with gaps + 3D-ish focus (center pops, sides recede).
 * - Background: solid black base + stronger blur + black overlay + bottom→top gradient.
 * - Controls (fullscreen + compact bar): glassmorphism (semi-transparent, blur, ring, shadow).
 */
export default function PlayerUIMobile(props) {
  const {
    currentTrack,
    queue = [],
    isPlaying,
    progress,
    duration,
    volume,
    shuffle,
    repeatOne,
    expanded,
    onTogglePlay,
    onNext,
    onPrev,
    onSeek,
    onVolume,
    onToggleShuffle,
    onToggleRepeatOne,
    onToggleExpanded,
    onSelectTrack,
  } = props;

  if (!currentTrack) return null;

  const sliderRef = useRef(null);
  const volumePct = Math.round((volume ?? 0) * 100);

  // Keep slider and background aligned with the active slide
  const currentIndex = useMemo(
    () => (currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1),
    [queue, currentTrack]
  );
  const [activeIdx, setActiveIdx] = useState(Math.max(0, currentIndex));
  useEffect(() => {
    if (currentIndex >= 0 && sliderRef.current) {
      sliderRef.current.slickGoTo(currentIndex, true);
      setActiveIdx(currentIndex);
    }
  }, [currentIndex]);

  const sliderSettings = {
    className: 'center slider-3d',
    centerMode: true,
    infinite: queue.length > 1,
    centerPadding: '48px',   // gap/peek around the centered card
    slidesToShow: 1,
    speed: 500,
    cssEase: 'ease-out',
    swipe: true,
    touchThreshold: 10,
    arrows: false,
    dots: false,
    adaptiveHeight: false,
    initialSlide: Math.max(0, currentIndex),
    beforeChange: (_oldIdx, newIdx) => setActiveIdx(newIdx), // background tracks the moving slide
    afterChange: (idx) => {
      const t = queue[idx];
      if (t && t.id !== currentTrack.id) onSelectTrack?.(t);
    },
  };

  const bgImage = (queue[activeIdx] || currentTrack).image;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
      {/* 3D focus + gaps styles for Slick */}
      <style>{`
        .slider-3d .slick-list { overflow: visible; }
        .slider-3d .slick-track { display: flex; align-items: center; }
        .slider-3d .slick-slide {
          padding: 0 10px;
          transition: transform 0.45s ease, opacity 0.45s ease, filter 0.45s ease;
          transform: translateZ(0) scale(0.86);
          opacity: 0.65;
          filter: saturate(0.9);
        }
        .slider-3d .slick-center {
          transform: translateZ(0) scale(1.02);
          opacity: 1;
          filter: none;
        }
      `}</style>

      {/* Compact bar — GLASS */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="collapsed"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="
              pointer-events-auto mx-4 mb-4
              rounded-2xl
              bg-white/10 backdrop-blur-xl
              ring-1 ring-white/15
              shadow-[0_8px_24px_rgba(0,0,0,0.35)]
              text-white
              p-3 flex items-center justify-between
            "
            onClick={onToggleExpanded}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-20 rounded-xl overflow-hidden ring-1 ring-white/10">
                <img
                  src={currentTrack.image}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = '/fallback-image.png')}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
                <p className="text-xs text-gray-200/90 truncate">{currentTrack.artist}</p>
              </div>
            </div>
      
            <div className="flex items-center gap-2">
                <button
                className="w-9 h-9 rounded-full grid place-items-center bg-white/10 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/15 transition"
                onClick={(e) => { e.stopPropagation(); onToggleExpanded(); }}
                aria-label="Expand player"
              >
                <ChevronUp size={18} />
              </button>
            <button
              className="
                shrink-0 w-10 h-10 rounded-full grid place-items-center
                bg-secondary/80 text-black ring-1 ring-white/40 backdrop-blur-md
                hover:scale-[1.03] transition
              "
              onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
            </button>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen */}
      <AnimatePresence initial={false}>
        {!expanded && (
          <motion.div
            key="expanded"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="pointer-events-auto text-white max-h-screen pb-10 pt-2"
            style={{ height: FULL }}
          >
            {/* Background: black base + STRONG blur + black overlay + bottom→top gradient */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-black" />
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${bgImage})`,
                  filter: 'blur(16px)',          // stronger blur
                  transform: 'scale(1.12)',      // avoid blur-edge gaps
                  willChange: 'transform'
                }}
              />
              {/* <div className="absolute inset-0 bg-black/40" /> */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            </div>

            {/* Top bar */}
            <div className="relative pt-[env(safe-area-inset-top,0px)]">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={onToggleExpanded}
                  aria-label="Close"
                  className="p-2 rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/15 backdrop-blur-md transition"
                >
                  <ChevronDown />
                </button>
                <h2 className="text-base font-semibold">Now playing</h2>
                <span className="inline-block w-9" />
              </div>
            </div>

            {/* Foreground */}
            <div className="relative h-full flex flex-col">
              {/* Center-mode card slider */}
              <div className="flex-1 flex items-center justify-center px-0">
                <div className="w-full max-w-sm mx-auto">
                  <Slider ref={sliderRef} {...sliderSettings}>
                    {(queue.length ? queue : [currentTrack]).map((t) => (
                      <div key={t.id || t.title} className="px-0">
                        <div className="flex flex-col justify-center">
                          <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                            <img
                              src={t.image}
                              alt={t.title}
                              className="w-full h-full object-cover block"
                              onError={(e) => (e.currentTarget.src = '/fallback-image.png')}
                            />
                          </div>
                          <div className="relative text-center mt-2 mb-1 px-6">
                            <p className="text-xs text-gray-200 truncate">{currentTrack.artist}</p>
                        </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              </div>
              

              {/* GLASS control card (semi-transparent, blur, ring, shadow), with bottom margin */}
              <div className="relative p-3 mb-[calc(env(safe-area-inset-bottom,0px)+56px)]">
                <div
                  className="
                    mx-auto max-w-[520px]
                    rounded-[28px] p-4 sm:p-5
                    bg-white/10 backdrop-blur-2xl
                    ring-1 ring-white/15
                    shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                  "
                >
                  {/* Title above progress */}
                  <div className="text-center px-2 mb-2 mt-1.5">
                    <h3 className="text-md font-medium truncate">{currentTrack.name}</h3>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={progress}
                      onChange={(e) => onSeek(Number(e.target.value))}
                      className="w-full h-1 accent-secondary cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-gray-200/90 mt-1">
                      <span>{fmt(progress)}</span>
                      <span>{fmt(duration)}</span>
                    </div>
                  </div>

                  {/* Main controls — glass buttons */}
                  <div className="mt-2 flex items-center justify-between px-1">
                    <button
                      onClick={onToggleRepeatOne}
                      aria-label="Repeat one"
                      className="p-2 rounded-full bg-white/10 ring-1  hover:text-secondary ring-white/15 backdrop-blur-md hover:bg-white/15 transition"
                    >
                      <Repeat size={20} className={repeatOne ? 'text-secondary' : 'text-white'} />
                    </button>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => sliderRef.current?.slickPrev()}
                        aria-label="Previous"
                        className="p-2 rounded-full bg-white/10 ring-1 ring-white/15  hover:text-secondary backdrop-blur-md hover:bg-white/15 transition"
                      >
                        <SkipBack size={24} />
                      </button>

                      <button
                        onClick={onTogglePlay}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                        className="
                          w-16 h-16 rounded-full grid place-items-center
                          bg-white/10 text-white hover:text-secondary
                          ring-1 ring-white/15 backdrop-blur-md
                          hover:scale-[1.03] transition
                        "
                      >
                        {isPlaying ? <PauseCircle size={36} /> : <PlayCircle size={36} />}
                      </button>

                      <button
                        onClick={() => sliderRef.current?.slickNext()}
                        aria-label="Next"
                        className="p-2 rounded-full bg-white/10 ring-1  hover:text-secondary ring-white/15 backdrop-blur-md hover:bg-white/15 transition"
                      >
                        <SkipForward size={24} />
                      </button>
                    </div>

                    <button
                      onClick={onToggleShuffle}
                      aria-label="Shuffle"
                      className="p-2 rounded-full bg-white/10 ring-1  hover:text-secondary ring-white/15 backdrop-blur-md hover:bg-white/15 transition"
                    >
                      <Shuffle size={20} className={shuffle ? 'text-secondary' : 'text-white'} />
                    </button>
                  </div>

                  {/* Volume — glass row */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white/10 ring-1  hover:text-secondary ring-white/15 backdrop-blur-md">
                      <Volume2 size={18} className="text-white/90" />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => onVolume(Number(e.target.value))}
                      className="flex-1 h-1 accent-secondary cursor-pointer"
                    />
                    <div className="text-[11px] text-white/90 w-10 text-right">{volumePct}%</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
