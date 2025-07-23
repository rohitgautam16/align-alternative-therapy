// src/components/RecentlyPlayed.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { useGetRecentPlaysQuery, useRecordPlayMutation } from '../utils/api';
import { setQueue, setTrack, setIsPlaying } from '../store/playerSlice';
import SongCard from '../components/custom-ui/SongCard';

export default function RecentlyPlayed() {
  const dispatch = useDispatch();
  const { data: recent = [], isLoading, isError } = useGetRecentPlaysQuery(10);
  const [recordPlay] = useRecordPlayMutation();

  const handlePlay = (song) => {
    dispatch(setQueue([song]));
    dispatch(setTrack({
      id:       song.id,
      title:    song.title,
      artist:   song.artist,
      image:    song.image,
      audioUrl: song.audioUrl,
    }));
    dispatch(setIsPlaying(true));
    recordPlay(song.id);
  };

  if (isLoading) {
    return (
      <section className="px-4 py-12 text-center">
        <p className="text-gray-400">Loading your recent plays…</p>
      </section>
    );
  }
  if (isError) {
    return (
      <section className="px-4 py-12 text-center">
        <p className="text-red-500">Couldn’t load recent plays.</p>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen px-4 py-12 bg-gradient-to-b from-black to-gray-900 rounded-lg">
      <h2 className="text-4xl md:text-5xl font-extrabold text-center text-white mb-4">
        Recently Played
      </h2>
      <p className="text-center text-gray-400 mb-8">
        Catch up with the tracks you’ve enjoyed most recently.
      </p>

      {recent.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          You haven’t played anything yet.
        </p>
      ) : (
        <div
          className="
            grid gap-6
            grid-cols-1
            sm:grid-cols-1
            md:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-3
          "
        >
          {recent.map(song => (
            <SongCard
              key={song.id}
              song={song}
              onPlay={() => handlePlay(song)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
