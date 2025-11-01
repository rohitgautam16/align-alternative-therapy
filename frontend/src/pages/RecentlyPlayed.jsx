// src/components/RecentlyPlayed.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { useGetRecentPlaysQuery, useRecordPlayMutation } from '../utils/api';
import { setQueue, setTrack, setIsPlaying } from '../store/playerSlice';
import SongCard from '../components/custom-ui/SongCard';

export default function RecentlyPlayed() {
  const dispatch = useDispatch();
  const { data: recentRaw, isLoading, isError } = useGetRecentPlaysQuery(10);
  const [recordPlay] = useRecordPlayMutation();

  const recent = Array.isArray(recentRaw) ? recentRaw : (recentRaw?.items ?? []);
  console.log(recent);

  const handlePlay = (song) => {
    dispatch(setQueue([song]));
    dispatch(setTrack({
      id:       song.id,
      title:    song.title,
      artist:   song.artist,
      image:    song.image,
      audioUrl: song.audioUrl,
      description: song.description,
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
        <div className="flex flex-wrap gap-6 justify-center sm:justify-center md:justify-center lg:justify-start">
          {recent.map((song) => {
            const slug = song?.slug ?? song?.song_slug ?? null;
            const key  = slug ? `${song.id}-${slug}` : `id-${song.id}`;
            return (
              <div key={key} className="flex-none">
                <SongCard song={song} onPlay={() => handlePlay(song)} />
              </div>
            );
          })}
        </div>

      )}
    </section>
  );
}
