// src/pages/DashboardHome.jsx
import React from 'react';
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CarouselSection from '../components/dashboard/CarouselSection';
import CategorySection from '../components/dashboard/CategorySection';
import PlaylistCard from '../components/custom-ui/PlaylistCard';
import SongCard     from '../components/custom-ui/SongCard';
import PersonalizeBanner from '../components/dashboard/Personalized Service/PersonalizeBanner';

import PersonalizeCTA from '../components/dashboard/Personalized Service/PersonalizeCTA';
import PBMyRecommendations from '../components/dashboard/Personalized Service/PBMyRecommendations';

import {
  useGetDashboardAllPlaylistsQuery,
  useGetDashboardFreePlaylistsQuery,
  useGetDashboardNewReleasesQuery,
  useGetRecentPlaysQuery,
} from '../utils/api';

const DashboardHome = () => {

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const returnTo = sessionStorage.getItem('returnToPath') || sessionStorage.getItem('returnTo');
    if (returnTo) {
      sessionStorage.removeItem('returnToPath')
      sessionStorage.removeItem('returnTo')
      navigate(returnTo, { replace: true })
    }
  }, [navigate])


  // New releases
  const { data: nrRaw = {}, isLoading: nrL, isError: nrE } =
    useGetDashboardNewReleasesQuery({ playlistLimit: 12, songLimit: 8 });
  const newPlaylists = Array.isArray(nrRaw.playlists) ? nrRaw.playlists : [];
  const newSongs     = Array.isArray(nrRaw.songs)     ? nrRaw.songs     : [];
  const combinedNew  = [
    ...newPlaylists.map(pl => ({ type: 'playlist', data: pl })),
    ...newSongs.map(s   => ({ type: 'song',     data: s  })),
  ];


 const { data: rpRaw, isLoading: rpL, isError: rpE } = useGetRecentPlaysQuery(10);
   // Normalize: supports either ARRAY or { items: [...] }
 const recentItemsRaw = Array.isArray(rpRaw) ? rpRaw : (rpRaw?.items ?? []);
   // Optional: ensure a `slug` field exists (fallback to `song_slug`)
 const recentItems = recentItemsRaw.map(s => ({
   ...s,
   slug: s?.slug ?? s?.song_slug ?? s?.id?.toString(),
 }));

  return (
      <div className="space-y-1 sm:space-y-6 rounded-2xl">
      <CategorySection />

      {/* <PersonalizeBanner /> */}

      
     <PBMyRecommendations />


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
      {!rpL && !rpE && recentItems.length > 0 && (
      <CarouselSection
        title="Recently Played"
        items={recentItems}
        renderItem={(song) => (
          <SongCard
            key={`s-${song.id}-${song.slug}`}
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

      <PersonalizeCTA/>
      
    </div>
    
  );
};

export default DashboardHome;
