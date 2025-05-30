// src/components/music/MusicPlayer.jsx
import React, { useEffect } from 'react';
import ReactHowler from 'react-howler';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
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
  ChevronUp
} from 'lucide-react';
import {
  togglePlay,
  setProgress,
  nextTrack,
  prevTrack,
  setVolume,
  toggleShuffle,
  toggleRepeat,
  setIsPlaying
} from '../../store/playerSlice';
import { useHowler } from '../../hooks/useHowler';
import { usePlayerUI } from '../../context/PlayerUIContext';


export const PLAYER_HEIGHT = 72;
export const HANDLE_HEIGHT = 24;
const FALLBACK = '/rain.mp3';

export default function MusicPlayer() {
 
  const dispatch = useDispatch();
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    shuffle,
    repeatOne
  } = useSelector(s => s.player);
  const { expanded, toggleExpanded } = usePlayerUI();

  
  const srcs = currentTrack
    ? [currentTrack.audioUrl, FALLBACK]
    : [FALLBACK];
  const { soundRef, duration, seekTo, handleLoad, handleEnd } = useHowler({
    src: srcs,
    playing: isPlaying,
    volume,
    onEnd: () => dispatch(nextTrack())
  });

 
  useEffect(() => {
    if (currentTrack) {
      dispatch(setIsPlaying(true));
      if (!expanded) toggleExpanded();
    }
  }, [currentTrack]);

 
  useEffect(() => {
    let raf;
    const loop = () => {
      if (soundRef.current && isPlaying) {
        dispatch(setProgress(soundRef.current.seek()));
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, soundRef]);

  
  if (!currentTrack) return null;

  
  const fmt = sec => {
    const m = Math.floor(sec / 60);
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.div
      initial={false}
      animate={{
        bottom: expanded ? 0 : -(PLAYER_HEIGHT - HANDLE_HEIGHT)
      }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed left-0 right-0 z-50 overflow-visible"
      style={{ height: PLAYER_HEIGHT }}
    >
      {/* Handle */}
      <div
        className="absolute -top-[24px] left-4 p-1 bg-black/70 rounded-t cursor-pointer"
        onClick={toggleExpanded}
      >
        {expanded ? <ChevronDown /> : <ChevronUp />}
      </div>

      {/* Player bar */}
      <div
        className="flex items-center bg-black/70 mx-1.5 rounded-lg text-white px-6 py-2"
        style={{ height: PLAYER_HEIGHT }}
      >
        <ReactHowler
          ref={soundRef}
          src={srcs}
          playing={isPlaying}
          html5
          volume={volume}
          format={['mp3']}
          onLoad={handleLoad}
          onEnd={handleEnd}
        />

        {/* Left: artwork + info */}
        <div className="flex items-center space-x-4 w-1/4">
          <img
            src={currentTrack.image}
            alt={currentTrack.title}
            className="h-12 w-12 rounded"
            onError={e => (e.target.src = '/fallback-image.png')}
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
              onClick={() => dispatch(toggleShuffle())}
              className={`cursor-pointer ${shuffle ? 'text-red-500' : 'hover:text-red-500'}`}
            />
            <SkipBack
              onClick={() => dispatch(prevTrack())}
              className="cursor-pointer hover:text-red-500"
            />
            {isPlaying ? (
              <PauseCircle
                size={36}
                onClick={() => dispatch(togglePlay())}
                className="cursor-pointer text-red-500"
              />
            ) : (
              <PlayCircle
                size={36}
                onClick={() => dispatch(togglePlay())}
                className="cursor-pointer text-red-500"
              />
            )}
            <SkipForward
              onClick={() => dispatch(nextTrack())}
              className="cursor-pointer hover:text-red-500"
            />
            <Repeat
              onClick={() => dispatch(toggleRepeat())}
              className={`cursor-pointer ${repeatOne ? 'text-red-500' : 'hover:text-red-500'}`}
            />
          </div>
          <div className="flex items-center space-x-2 w-full">
            <span className="text-xs text-gray-400">{fmt(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration}
              value={progress}
              onChange={e => {
                const t = Number(e.target.value);
                seekTo(t);
                dispatch(setProgress(t));
              }}
              className="flex-1 h-1 bg-gray-600 rounded-lg accent-red-500 cursor-pointer"
            />
            <span className="text-xs text-gray-400">{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: volume & full-screen */}
        <div className="flex items-center space-x-4 w-1/4 justify-end">
          <Volume2 className="cursor-pointer hover:text-red-500" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={e => {
              const v = Number(e.target.value);
              soundRef.current.volume(v);
              dispatch(setVolume(v));
            }}
            className="w-24 h-1 bg-gray-600 rounded-lg accent-red-500 cursor-pointer"
          />
          <Maximize className="cursor-pointer hover:text-red-500" />
        </div>
      </div>
    </motion.div>
  );
}
