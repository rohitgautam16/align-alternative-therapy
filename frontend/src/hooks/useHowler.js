// src/hooks/useHowler.js
import { useEffect, useRef, useState } from 'react';

export function useHowler({ src = [], playing, volume = 1, onEnd }) {
  const soundRef = useRef(null);
  const [duration, setDuration] = useState(0);
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
    }
  };

  const handleEnd = () => {
    onEnd?.();
  };


  const play   = () => soundRef.current?.play();
  const pause  = () => soundRef.current?.pause();
  const seekTo = (t) => soundRef.current?.seek(t);
  const setVol = (v) => soundRef.current?.volume(v);

  return {
    soundRef,
    duration,
    //seek,
    play,
    pause,
    seekTo,
    setVol,
    handleLoad,
    handleEnd,
  };
}
