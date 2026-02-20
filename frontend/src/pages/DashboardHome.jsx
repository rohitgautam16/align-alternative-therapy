// src/pages/DashboardHome.jsx
import React from 'react';
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CarouselSection from '../components/dashboard/CarouselSection';
import CategorySection from '../components/dashboard/CategorySection';
import PlaylistCard from '../components/custom-ui/PlaylistCard';
import SongCard     from '../components/custom-ui/SongCard';
import VerticalStripCarousel from '../components/custom-ui/VerticalStripCarousel';
import PersonalizeBanner from '../components/dashboard/Personalized Service/PersonalizeBanner';
import { useSubscription } from '../context/SubscriptionContext';
import PersonalizeCTA from '../components/dashboard/Personalized Service/PersonalizeCTA';
import PBMyRecommendations from '../components/dashboard/Personalized Service/PBMyRecommendations';

import {
  useGetDashboardAllPlaylistsQuery,
  useGetDashboardFreePlaylistsQuery,
  useGetDashboardNewReleasesQuery,
  useGetRecentPlaysQuery,
  useGetRecentPlaylistsQuery,
  useGetDashboardTagsQuery
} from '../utils/api';

const DashboardHome = () => {

  const navigate = useNavigate()
  const location = useLocation()
  const { isRecommendationOnly } = useSubscription();

  useEffect(() => {
    const returnTo = sessionStorage.getItem('returnToPath') || sessionStorage.getItem('returnTo');
    if (returnTo) {
      sessionStorage.removeItem('returnToPath')
      sessionStorage.removeItem('returnTo')
      navigate(returnTo, { replace: true })
    }
  }, [navigate])

  const [selectedTag, setSelectedTag] = useState(null);
  const { data: tags = [] } = useGetDashboardTagsQuery();


  const {
    data: nrRaw = {},
    isLoading: nrL,
    isFetching: nrF,
    isError: nrE
  } = useGetDashboardNewReleasesQuery({
    playlistLimit: 12,
    songLimit: 8,
    tag: selectedTag
  });
  const isNewReleasesLoading = nrL || nrF;
  const isInitialLoading = nrL || nrF;
  const isRefetching = !nrL && nrF; 
  const isFiltering = selectedTag && nrF;
  const newPlaylists = Array.isArray(nrRaw.playlists) ? nrRaw.playlists : [];
  const newSongs     = Array.isArray(nrRaw.songs)     ? nrRaw.songs     : [];
  const combinedNew  = [
    ...newPlaylists.map(pl => ({ type: 'playlist', data: pl })),
    ...newSongs.map(s   => ({ type: 'song',     data: s  })),
  ];


 const { data: rpRaw, isLoading: rpL, isError: rpE } = useGetRecentPlaysQuery(10);
   
 const recentItemsRaw = Array.isArray(rpRaw) ? rpRaw : (rpRaw?.items ?? []);
   
 const recentItems = recentItemsRaw.map(s => ({
   ...s,
   slug: s?.slug ?? s?.song_slug ?? s?.id?.toString(),
 }));

 const { data: rplRaw, isLoading: rplL, isError: rplE } = useGetRecentPlaylistsQuery(8);
  const recentPlaylists = Array.isArray(rplRaw) ? rplRaw : (rplRaw?.items ?? []);
  
  const normalizedRecentPlaylists = recentPlaylists.map(p => ({
    ...p,
    slug: p?.slug ?? p?.playlist_slug ?? p?.id?.toString(),
  }));



  return (
      <div className="space-y-1 sm:space-y-6 rounded-2xl overflow-hidden">
      <CategorySection />

      <div className="relative">
      {isFiltering && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity duration-300 pointer-events-none" />
      )}

      <div className="flex gap-3 md:gap-5 overflow-x-auto px-6 py-4">
        <button
          onClick={() => setSelectedTag(null)}
          className={`
            px-4 py-1.5 rounded-full border text-sm whitespace-nowrap transition-all duration-200
            ${!selectedTag
              ? 'bg-secondary text-black border-secondary'
              : 'border-white text-white hover:bg-white/10'}
          `}
        >
          All
        </button>

        {tags.map(tag => (
          <button
            key={tag.slug}
            onClick={() =>
              setSelectedTag(prev => prev === tag.slug ? null : tag.slug)
            }
            className={`
              px-4 py-1.5 rounded-full border text-sm whitespace-nowrap transition-all duration-200
              ${selectedTag === tag.slug
                ? 'bg-secondary text-black border-secondary'
                : 'border-white text-white hover:bg-white/10'}
            `}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* <PersonalizeBanner /> */}

      {/* {!isRecommendationOnly && (
      <CarouselSection
        title="New Releases"
        items={combinedNew}
        renderItem={({ type, data }) =>
          type === 'playlist'
            ? <PlaylistCard key={`pl-${data.id}`} playlist={data} />
            : <SongCard     key={`s-${data.id}`}  song={data}      />
        }
      />
      )} */}

      {!isRecommendationOnly && (
        <>
          {/* 📱 Mobile */}
          <div className="md:hidden">
            <VerticalStripCarousel
              title="New Releases"
              items={combinedNew}
              isLoading={nrL || nrF}
            />
          </div>

          {/* 🖥 Desktop */}
          <div className="hidden md:block">
            {(nrL || nrF) ? (
              <CarouselSection title="New Releases" items={[]} />
            ) : (
              <CarouselSection
                title="New Releases"
                items={combinedNew}
                renderItem={({ type, data }) =>
                  type === 'playlist'
                    ? <PlaylistCard playlist={data} />
                    : <SongCard song={data} />
                }
              />
            )}
          </div>
        </>
      )}

      {!isRecommendationOnly && (
      <CarouselSection
        title="All Playlists"
        useQuery={useGetDashboardAllPlaylistsQuery}
        queryArg={{ tag: selectedTag }}
        renderItem={(pl) => <PlaylistCard key={pl.id} playlist={pl} />}
      />
      )}


      <PBMyRecommendations />



      {/* Recently Played */}
      {/* {!isRecommendationOnly && !rpL && !rpE && recentItems.length > 0 && (
        <CarouselSection
          title="Recently Played Songs"
          items={recentItems}
          renderItem={(song) => (
            <SongCard
              key={`s-${song.id}-${song.slug}`}
              song={song}
              onPlay={() => {}}
            />
          )}
        />
      )} */}

      {!isRecommendationOnly && !rplL && !rplE && normalizedRecentPlaylists.length > 0 && (
        <CarouselSection
          title="Recently Played"
          items={normalizedRecentPlaylists}
          renderItem={(pl) => (
            <PlaylistCard key={`rpl-${pl.id}`} playlist={pl} />
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
      {/* {!isRecommendationOnly && (
      <CarouselSection
        title="All Playlists"
        useQuery={useGetDashboardAllPlaylistsQuery}
        queryArg={{ tag: selectedTag }}
        renderItem={(pl) => <PlaylistCard key={pl.id} playlist={pl} />}
      />
      )} */}

      <PersonalizeCTA/>

      </div>
  </div>
      

    
  );
};

export default DashboardHome;
