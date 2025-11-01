import React, { useEffect, useRef } from 'react';
import ReactHowler from 'react-howler';
import { useDispatch, useSelector } from 'react-redux';
import {
  togglePlay, setProgress, nextTrack, prevTrack, setVolume,
  toggleShuffle, toggleRepeatOne, setTrack
} from '../../store/playerSlice';
import { usePlayerUI } from '../../context/PlayerUIContext';
import { useHowler } from '../../hooks/useHowler';
import { useIsMobile } from './useIsMobile';

const FALLBACK = '/rain.mp3';

export default function PlayerShell() {
  const dispatch = useDispatch();
  const isMobile = useIsMobile(640);
  const { expanded, toggleExpanded } = usePlayerUI();

  const {
    currentTrack, audioSrc, isPlaying, progress, volume,
    shuffle, repeatOne, queue = [], currentIndex
  } = useSelector(s => s.player);

  // build sources + key once
  const primary = audioSrc || currentTrack?.audioUrl;
  const srcs = primary ? [primary, FALLBACK] : [FALLBACK];
  const howlerKey = `${currentTrack?.id ?? 'noid'}::${primary ?? 'fallback'}`;
  const nextTrackSrc = queue[currentIndex + 1]?.audioUrl;

  // howler hook
  const { soundRef, duration, seekTo, handleLoad, handleEnd, isLoading } = useHowler({
    src: srcs,
    playing: isPlaying,
    volume,
    onEnd: () => {
      if (repeatOne && soundRef.current) {
        soundRef.current.seek(0);
        soundRef.current.play();
        dispatch(setProgress(0));
      } else {
        dispatch(nextTrack());
      }
    },
    preloadSrc: queue[currentIndex + 1]?.audioUrl
  });


  useEffect(() => {
    let raf;
    const loop = () => {
      if (soundRef.current && isPlaying) {
        const t = soundRef.current.seek();
        if (typeof t === 'number') dispatch(setProgress(t));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dispatch, isPlaying, soundRef]);

  if (!currentTrack) return null; 


  const onTogglePlay       = () => dispatch(togglePlay());
  const onNext             = () => dispatch(nextTrack());
  const onPrev             = () => dispatch(prevTrack());
  const onSeek             = (t) => { seekTo(t); dispatch(setProgress(t)); };
  const onVolume           = (v) => { soundRef.current?.volume(v); dispatch(setVolume(v)); };
  const onToggleShuffle    = () => dispatch(toggleShuffle());
  const onToggleRepeatOne  = () => dispatch(toggleRepeatOne());
  const onToggleExpanded   = () => toggleExpanded();
  const onSelectTrack      = (track) => dispatch(setTrack(track));

  const sharedProps = {
    currentTrack, queue, isPlaying, progress, duration, volume,
    shuffle, repeatOne, expanded,
    onTogglePlay, onNext, onPrev, onSeek, onVolume,
    onToggleShuffle, onToggleRepeatOne, onToggleExpanded, onSelectTrack,
  };

  return (
    <>
      <ReactHowler
        key={howlerKey}
        ref={soundRef}
        src={srcs}
        playing={isPlaying}
        html5
        volume={volume}
        format={['mp3']}
        onLoad={handleLoad}
        onEnd={handleEnd}
      />

      {isMobile
        ? <PlayerUIMobile {...sharedProps}  isLoading={isLoading} />
        : <PlayerUIDesktop {...sharedProps}  isLoading={isLoading} />
      }
    </>
  );
}


import PlayerUIDesktop from './PlayerUIDesktop';
import PlayerUIMobile from './PlayerUIMobile';
