// src/components/music/PlayerUIDesktop.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'react-slick';
import {
  Shuffle,
  SkipBack,
  PlayCircle,
  PauseCircle,
  SkipForward,
  Repeat,
  Volume2,
  Maximize,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

// Slick carousel CSS
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export const PLAYER_HEIGHT = 72;
export const HANDLE_HEIGHT = 4;

function fmt(sec = 0) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}

/**
 * Desktop/Tablet player chrome.
 * Props must match the headless PlayerShell contract:
 * currentTrack, queue, isPlaying, progress, duration, volume, shuffle, repeatOne, expanded
 * onTogglePlay, onNext, onPrev, onSeek, onVolume, onToggleShuffle, onToggleRepeatOne, onToggleExpanded, onSelectTrack
 */
export default function PlayerUIDesktop(props) {
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

  const [isFullscreen, setIsFullscreen] = useState(false);
  const sliderRef = useRef(null);

  const currentIndex = useMemo(
    () => (currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1),
    [queue, currentTrack]
  );
  const initialSlide = currentIndex >= 0 ? currentIndex : 0;

  // Keep slider in sync with selected track; optionally expand like your original
  useEffect(() => {
    if (!currentTrack) return;
    if (!expanded) onToggleExpanded?.();
    const idx = queue.findIndex(t => t.id === currentTrack.id);
    if (idx >= 0 && sliderRef.current) {
      sliderRef.current.slickGoTo(idx);
    }
  }, [currentTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  const sliderSettings = {
    centerMode: true,
    infinite: queue.length > 1,
    centerPadding: '20px',
    slidesToShow: 3,
    speed: 600,
    cssEase: "ease-out",
    focusOnSelect: true,
    initialSlide,
    arrows: false,
    dots: false,
    variableWidth: false,
    afterChange: (newIndex) => {
      const selected = queue[newIndex];
      if (selected && selected.id !== currentTrack?.id) {
        onSelectTrack?.(selected);
      }
    },
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 1, centerPadding: '50px' } },
      { breakpoint: 640,  settings: { slidesToShow: 1, centerPadding: '30px' } },
    ]
  };

  if (!currentTrack) return null;

  const toggleFullscreen = () => setIsFullscreen(v => !v);

  return (
    <motion.div
      initial={false}
      animate={{
        bottom: isFullscreen ? 0 : (expanded ? 0 : -(PLAYER_HEIGHT - HANDLE_HEIGHT)),
        height: isFullscreen ? '100vh' : PLAYER_HEIGHT,
        opacity: expanded ? 1 : 0.95
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 40, duration: 0.6 }}
      className={`fixed left-0 right-0 z-50 overflow-visible ${
        expanded || isFullscreen ? 'backdrop-blur-2xl bg-black/80' : ''
      }`}
    >
      {/* Handle (hidden in fullscreen) */}
      {!isFullscreen && (
        <div
          className="absolute -top-[24px] left-4 p-1 bg-black/70 rounded-t cursor-pointer"
          onClick={onToggleExpanded}
        >
          {expanded ? <ChevronDown /> : <ChevronUp />}
        </div>
      )}

      {isFullscreen ? (
        /* ── Fullscreen Layout ── */
        <div className="relative h-screen w-full overflow-hidden">
          {/* Cross-fading blurred background */}
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentTrack.id}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${currentTrack.image})`,
                filter: 'blur(8px)'
              }}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.7 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/40" />

          {/* Close Fullscreen Button */}
          <div className="absolute top-6 right-6 z-10">
            <X
              size={32}
              onClick={toggleFullscreen}
              className="cursor-pointer text-white hover:text-secondary transition-colors"
            />
          </div>

          {/* Main Container */}
          <div className="relative h-full flex flex-col">
            {/* ── Carousel Section (75vh) ── */}
            <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-4" style={{ height: '75vh' }}>
              <div className="mx-auto max-w-screen-lg w-full">
                <Slider ref={sliderRef} {...sliderSettings}>
                  {queue.length > 0 ? (
                    queue.map((track, idx) => (
                      <div key={track.id || idx} className="px-2">
                        <div
                          className={`w-56 h-56 mx-auto relative transition-transform duration-300 ${
                            track.id === currentTrack.id ? 'scale-100' : 'scale-75 opacity-60'
                          }`}
                          onClick={() => {
                            if (track.id !== currentTrack.id) onSelectTrack?.(track);
                          }}
                        >
                          <img
                            src={track.image}
                            alt={track.title}
                            className="w-full h-full object-cover rounded-lg shadow-2xl cursor-pointer"
                            onError={e => (e.currentTarget.src = '/fallback-image.png')}
                          />
                          {track.id === currentTrack.id && (
                            <div className="absolute inset-0 bg-black/20 rounded-lg" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-2">
                      <div className="w-56 h-56 mx-auto relative">
                        <img
                          src={currentTrack.image}
                          alt={currentTrack.title}
                          className="w-full h-full object-cover rounded-lg shadow-2xl"
                          onError={e => (e.currentTarget.src = '/fallback-image.png')}
                        />
                      </div>
                    </div>
                  )}
                </Slider>
              </div>
            </div>

            {/* ── Bottom Player Bar (15vh) ── */}
            <div className="backdrop-blur-3xl" style={{ height: '15vh' }}>
              {/* Progress Bar */}
              <div className="mb-1 flex flex-col">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={progress}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="w-full h-1 mb-1 rounded-lg accent-secondary cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{fmt(progress)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Controls Row: three equal segments */}
              <div className="flex">
                {/* Left (1/3): Album art + Title/Artist */}
                <div className="flex items-center gap-1 w-1/3 px-4">
                  <img
                    src={currentTrack.image}
                    alt={currentTrack.title}
                    className="w-12 h-12 rounded-lg"
                    onError={(e) => (e.currentTarget.src = '/fallback-image.png')}
                  />
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{currentTrack.title}</h3>
                    <p className="text-gray-300 text-xs truncate">{currentTrack.artist}</p>
                  </div>
                </div>

                {/* Center (1/3): Player Controls */}
                <div className="flex items-center justify-center space-x-6 w-1/3">
                  <Shuffle
                    size={20}
                    onClick={onToggleShuffle}
                    className={`cursor-pointer transition-colors ${
                      shuffle ? 'text-secondary' : 'text-white hover:text-secondary/70'
                    }`}
                  />
                  <SkipBack
                    size={24}
                    onClick={onPrev}
                    className="cursor-pointer text-white hover:text-secondary/70 transition-colors"
                  />
                  {isPlaying ? (
                    <PauseCircle
                      size={40}
                      onClick={onTogglePlay}
                      className="cursor-pointer text-secondary hover:scale-105 transition-transform"
                    />
                  ) : (
                    <PlayCircle
                      size={40}
                      onClick={onTogglePlay}
                      className="cursor-pointer text-secondary hover:scale-105 transition-transform"
                    />
                  )}
                  <SkipForward
                    size={24}
                    onClick={onNext}
                    className="cursor-pointer text-white hover:text-secondary/70 transition-colors"
                  />
                  <Repeat
                    size={20}
                    onClick={onToggleRepeatOne}
                    className={`cursor-pointer transition-colors ${
                      repeatOne ? 'text-secondary' : 'text-white hover:text-secondary/70'
                    }`}
                  />
                </div>

                {/* Right (1/3): Volume Control */}
                <div className="flex items-center space-x-3 w-1/3 px-4 justify-end">
                  <Volume2
                    size={20}
                    className="text-white cursor-pointer hover:text-secondary/70 transition-colors"
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => onVolume(Number(e.target.value))}
                    className="w-20 h-1 bg-gray-600 rounded-lg accent-secondary cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Normal (Compact) Player Bar ── */
        <div
          className="flex items-center bg-black/70 mx-1.5 rounded-lg text-white px-6 py-2"
          style={{ height: PLAYER_HEIGHT }}
        >
          {/* Left: artwork + info */}
          <div className="flex items-center space-x-4 w-1/4">
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="h-12 w-12 rounded"
              onError={(e) => (e.currentTarget.src = '/fallback-image.png')}
            />
            <div className="truncate">
              <p className="font-semibold truncate">{currentTrack.title}</p>
              <p className="text-sm text-gray-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Center: controls + progress */}
          <div className="flex flex-col items-center w-2/4">
            <div className="flex items-center space-x-6 mb-1">
              <Shuffle
                onClick={onToggleShuffle}
                className={`cursor-pointer ${shuffle ? 'text-secondary' : 'hover:text-secondary/70'}`}
              />
              <SkipBack
                onClick={onPrev}
                className="cursor-pointer hover:text-secondary/70"
              />
              {isPlaying ? (
                <PauseCircle
                  size={36}
                  onClick={onTogglePlay}
                  className="cursor-pointer text-secondary"
                />
              ) : (
                <PlayCircle
                  size={36}
                  onClick={onTogglePlay}
                  className="cursor-pointer text-secondary"
                />
              )}
              <SkipForward
                onClick={onNext}
                className="cursor-pointer hover:text-secondary/70"
              />
              <Repeat
                onClick={onToggleRepeatOne}
                className={`cursor-pointer ${repeatOne ? 'text-secondary' : 'hover:text-secondary/70'}`}
              />
            </div>
            <div className="flex items-center space-x-2 w-full">
              <span className="text-xs text-gray-400">{fmt(progress)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={progress}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="flex-1 h-1 bg-gray-600 rounded-lg accent-secondary cursor-pointer"
              />
              <span className="text-xs text-gray-400">{fmt(duration)}</span>
            </div>
          </div>

          {/* Right: volume & fullscreen toggle */}
          <div className="flex items-center space-x-4 w-1/4 justify-end">
            <Volume2 className="cursor-pointer hover:text-secondary/70" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              className="w-24 h-1 bg-gray-600 rounded-lg accent-secondary cursor-pointer"
            />
            <Maximize
              onClick={toggleFullscreen}
              className="cursor-pointer hover:text-secondary/70 transition-colors"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
