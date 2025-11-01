// src/hooks/useHowler.js
import { useEffect, useRef, useState } from 'react';

export function useHowler({ src = [], playing, volume = 1, onEnd, preloadSrc }) {
  const soundRef = useRef(null);
  const nextRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // const [seek, setSeek] = useState(0);


  // useEffect(() => {
  //   if (!playing) return;
  //   const id = setInterval(() => {
  //     if (soundRef.current) {
  //       setSeek(soundRef.current.seek());
  //     }
  //   }, 200);
  //   return () => clearInterval(id);
  // }, [playing]);


  const handleLoad = () => {
    if (soundRef.current) {
      setDuration(soundRef.current.duration());
      setIsLoading(false);
    }
  };

  const handleEnd = () => {
    onEnd?.();
  };
  
  useEffect(() => {
    if (!preloadSrc) return;

    const audio = new Audio(preloadSrc);
    audio.preload = 'auto';
    audio.onerror = () => console.warn('Failed to preload next track:', preloadSrc);
  }, [preloadSrc]);

  useEffect(() => {
    setIsLoading(true);
  }, [src.join(',')]);

  const play   = () => soundRef.current?.play();
  const pause  = () => soundRef.current?.pause();
  const seekTo = (t) => soundRef.current?.seek(t);
  const setVol = (v) => soundRef.current?.volume(v);

  return {
    soundRef,
    duration,
    isLoading,
    //seek,
    play,
    pause,
    seekTo,
    setVol,
    handleLoad,
    handleEnd,
  };
}
