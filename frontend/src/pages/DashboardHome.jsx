// src/pages/DashboardHome.jsx
import React from 'react';
import CarouselSection from '../components/dashboard/CarouselSection';
import CategorySection from '../components/dashboard/CategorySection';
import PlaylistCard from '../components/custom-ui/PlaylistCard';
import SongCard     from '../components/custom-ui/SongCard';
import TransitionWrapper from '../components/custom-ui/transition';

import {
  useGetDashboardAllPlaylistsQuery,
  useGetDashboardFreePlaylistsQuery,
  useGetDashboardNewReleasesQuery,
  useGetRecentPlaysQuery,
} from '../utils/api';

const DashboardHome = () => {
  // New releases
  const { data: nrRaw = {}, isLoading: nrL, isError: nrE } =
    useGetDashboardNewReleasesQuery({ playlistLimit: 12, songLimit: 8 });
  const newPlaylists = Array.isArray(nrRaw.playlists) ? nrRaw.playlists : [];
  const newSongs     = Array.isArray(nrRaw.songs)     ? nrRaw.songs     : [];
  const combinedNew  = [
    ...newPlaylists.map(pl => ({ type: 'playlist', data: pl })),
    ...newSongs.map(s   => ({ type: 'song',     data: s  })),
  ];

  // Recently played
  const { data: recent = [], isLoading: rpL, isError: rpE } = useGetRecentPlaysQuery(10);

  return (
    <div className="space-y-12 rounded-2xl">
      <CategorySection />

      {/* New Releases */}
      <CarouselSection
        title="New Releases"
        items={combinedNew}
        renderItem={({ type, data }) =>
          type === 'playlist'
            ? <PlaylistCard key={`pl-${data.id}`} playlist={data} />
            : <SongCard     key={`s-${data.id}`}  song={data}      />
        }
      />

      {/* Recently Played */}
      {!rpL && !rpE && recent.length > 0 && (
      <CarouselSection
        title="Recently Played"
        items={recent}
        renderItem={(song) => (
          <SongCard
            key={song.id}
            song={song}
            onPlay={() => {}}
          />
        )}
      />
      )}

      {/* Free Playlists */}
      <CarouselSection
        title="Free Playlists"
        useQuery={useGetDashboardFreePlaylistsQuery}
        renderItem={(pl) => <PlaylistCard key={pl.id} playlist={pl} />}
      />

      {/* All Playlists */}
      <CarouselSection
        title="All Playlists"
        useQuery={useGetDashboardAllPlaylistsQuery}
        renderItem={(pl) => <PlaylistCard key={pl.id} playlist={pl} />}
      />
    </div>
  );
};

export default TransitionWrapper(DashboardHome);
