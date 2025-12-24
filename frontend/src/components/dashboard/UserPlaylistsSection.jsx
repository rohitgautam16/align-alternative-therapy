import React from 'react';
import { useGetUserPlaylistsQuery } from '../../utils/api';
import UserPlaylistCard from '../custom-ui/UserPlaylistCard';

export default function UserPlaylistsSection() {
  const { data, isLoading, isError } = useGetUserPlaylistsQuery();

  if (isLoading) return <p>Loading your playlists…</p>;
  if (isError) return <p>Error loading your playlists.</p>;

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-white">Your Playlists</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.playlists.map(playlist => (
          <UserPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
    </section>
  );
}
