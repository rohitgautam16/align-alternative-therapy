// src/store/playerSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  queue: [],             
  currentIndex: 0,
  currentTrack: null,   
  audioSrc: '',          
  isPlaying: false,
  progress: 0,
  volume: 0.8,
  shuffle: false,       
  repeatOne: false,
};

const computeAudioSrc = (track) => {
  const useCdn = import.meta.env.VITE_USE_CDN === 'true';
  return useCdn
    ? (track.audio_src || track.audioUrl)
    : (track.audioUrl || track.audio_src);
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setQueue(state, action) {
      state.queue = action.payload;
    },
    setTrack(state, action) {
      const track = action.payload;
      state.currentTrack = track;

      const useCdn = import.meta.env.VITE_USE_CDN === 'true';
      state.audioSrc = useCdn
        ? (track.audio_src || track.audioUrl)
        : (track.audioUrl || track.audio_src);

      state.currentIndex = state.queue.findIndex(t => t.id === track.id);
      state.progress = 0;
      state.isPlaying = true;  
    },
    togglePlay(state) {
      state.isPlaying = !state.isPlaying;
    },
    setIsPlaying(state, action) {
      state.isPlaying = action.payload;
    },
    setProgress(state, action) {
      state.progress = action.payload;
    },
    setVolume(state, action) {
      state.volume = action.payload;
    },
    toggleShuffle(state) {
      state.shuffle = !state.shuffle;
    },
    toggleRepeatOne(state) {
      state.repeatOne = !state.repeatOne;
    },
    nextTrack(state) {
      const len = state.queue.length;
      if (len === 0) return;

      if (state.repeatOne) {
        
        state.progress = 0;
        state.isPlaying = true;
        return;
      }

      if (state.shuffle) {
        
        let next = Math.floor(Math.random() * len);
        if (len > 1) {
          while (next === state.currentIndex) {
            next = Math.floor(Math.random() * len);
          }
        }
        state.currentIndex = next;
      } else {
        state.currentIndex = (state.currentIndex + 1) % len;
      }

      state.currentTrack = state.queue[state.currentIndex];
      state.audioSrc = computeAudioSrc(state.currentTrack);
      state.progress = 0;
      state.isPlaying = true;
    },
    prevTrack(state) {
      const len = state.queue.length;
      if (len === 0) return;

      if (state.repeat) {
        // repeat the same track
        state.progress = 0;
        state.isPlaying = true;
        return;
      }

      if (state.shuffle) {
        let prev = Math.floor(Math.random() * len);
        if (len > 1) {
          while (prev === state.currentIndex) {
            prev = Math.floor(Math.random() * len);
          }
        }
        state.currentIndex = prev;
      } else {
        state.currentIndex = (state.currentIndex - 1 + len) % len;
      }

      state.currentTrack = state.queue[state.currentIndex];
      state.audioSrc = computeAudioSrc(state.currentTrack);
      state.progress = 0;
      state.isPlaying = true;
    },
  },
});

export const {
  setQueue,
  setTrack,
  togglePlay,
  setIsPlaying,
  setProgress,
  setVolume,
  toggleShuffle,
  toggleRepeatOne,
  nextTrack,
  prevTrack,
} = playerSlice.actions;

export default playerSlice.reducer;
