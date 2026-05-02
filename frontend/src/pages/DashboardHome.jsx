// src/pages/DashboardHome.jsx
import React from 'react';
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion';
import CarouselSection from '../components/dashboard/CarouselSection';
import CategorySection from '../components/dashboard/CategorySection';
import PlaylistCard from '../components/custom-ui/PlaylistCard';
import SongCard     from '../components/custom-ui/SongCard';
import VerticalStripCarousel from '../components/custom-ui/VerticalStripCarousel';
import PersonalizeBanner from '../components/dashboard/Personalized Service/PersonalizeBanner';
import { useSubscription } from '../context/SubscriptionContext';
import PersonalizeCTA from '../components/dashboard/Personalized Service/PersonalizeCTA';
import PBMyRecommendations from '../components/dashboard/Personalized Service/PBMyRecommendations';
import MobilePagedGrid from '../components/custom-ui/MobilePagedGrid';
import { SquareMediaCard } from '../components/custom-ui/SquareMediaCard';
import TagResultsSection from '../components/dashboard/TagResultsSection';

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
    playlistLimit: 8,
    songLimit: 8
  });
  const newPlaylists = Array.isArray(nrRaw.playlists) ? nrRaw.playlists : [];
  const newSongs     = Array.isArray(nrRaw.songs)     ? nrRaw.songs     : [];
  const combinedNew  = [
    ...newPlaylists.map(pl => ({ type: 'playlist', data: pl })),
    ...newSongs.map(s   => ({ type: 'song',     data: s  })),
  ];

  const fallback = 'https://cdn.align-alternativetherapy.com/static-pages-media/Align-fallback-img.png';


 const { data: rpRaw, isLoading: rpL, isError: rpE } = useGetRecentPlaysQuery(10);
   
 const recentItemsRaw = Array.isArray(rpRaw) ? rpRaw : (rpRaw?.items ?? []);
   
 const recentItems = recentItemsRaw.map(s => ({
   ...s,
   slug: s?.slug ?? s?.song_slug ?? s?.id?.toString(),
 }));

 const { data: rplRaw, isLoading: rplL, isError: rplE } = useGetRecentPlaylistsQuery(15);
  const recentPlaylists = Array.isArray(rplRaw) ? rplRaw : (rplRaw?.items ?? []);
  
  const normalizedRecentPlaylists = recentPlaylists.map(p => ({
    ...p,
    slug: p?.slug ?? p?.playlist_slug ?? p?.id?.toString(),
  }));

  const combinedRecentPlaylists = normalizedRecentPlaylists.map(pl => ({
    type: 'playlist',
    data: pl
  }));

  const renderGridItem = useCallback(
    (item, fallback) => (
      <SquareMediaCard
        type={item.type}
        data={item.data}
        fallback={fallback}
      />
    ),
    []
  );

  const activeTag = tags.find((tag) => tag.slug === selectedTag) ?? null;
  const activeTagLabel = activeTag
    ? activeTag.name.charAt(0).toUpperCase() + activeTag.name.slice(1)
    : null;


  return (
      <div className="space-y-1 sm:space-y-6 rounded-2xl overflow-hidden">
      <div className="lg:hidden">
        <CategorySection />
      </div>

      <div className="relative">
     <div className="flex gap-3 md:gap-5 overflow-x-auto px-6 py-4">

        {(!tags || tags.length === 0) ? (
          // Skeleton chips
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-20 rounded-full bg-white/10 border border-white/10 shrink-0 animate-pulse"
            />
          ))
        ) : (
          <>
            {/* <button
              onClick={() => setSelectedTag(null)}
              className={`
                px-4 py-1.5 rounded-full cursor-pointer border text-sm whitespace-nowrap transition-all duration-200
                ${!selectedTag
                  ? 'bg-secondary text-black border-secondary'
                  : 'border-white text-white hover:bg-white/10'}
              `}
            >
              All
            </button> */}

            {tags.map(tag => (
              <button
                key={tag.slug}
                onClick={() =>
                  setSelectedTag(prev => prev === tag.slug ? null : tag.slug)
                }
                className={`
                  px-4 py-1.5 rounded-full border text-sm whitespace-nowrap cursor-pointer transition-all duration-200
                  ${selectedTag === tag.slug
                    ? 'bg-secondary text-black border-secondary'
                    : 'border-white text-white hover:bg-white/20 hover:backdrop-blur-2xl'}
                `}
              >
                {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
              </button>
            ))}
          </>
        )}

      </div>

      <AnimatePresence initial={false}>
        {selectedTag && activeTagLabel && (
          <TagResultsSection
            key={selectedTag}
            tagSlug={selectedTag}
            tagLabel={activeTagLabel}
          />
        )}
      </AnimatePresence>

      <PBMyRecommendations hideDesktop />

      <section
        className={`hidden md:grid gap-5 px-4 py-2 md:px-6 ${
          isRecommendationOnly ? 'grid-cols-1' : 'grid-cols-2'
        }`}
      >
        <PBMyRecommendations
          hideMobile
          desktopVariant="strip"
        />

        {!isRecommendationOnly && !rplE && (rplL || combinedRecentPlaylists.length > 0) && (
          <VerticalStripCarousel
            title="Recently Played"
            items={combinedRecentPlaylists}
            isLoading={rplL}
            itemsPerPage={4}
            wrapperClassName="min-w-0 px-0 py-0"
            pageClassName="w-full shrink-0 grid grid-cols-1 auto-rows-min gap-3 h-fit content-start"
          />
        )}
      </section>

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

      

      {/* <MobilePagedGrid
  title="New Releases"
  items={combinedNew}
  isLoading={nrL}
  renderItem={renderGridItem}
/> */}

      {!isRecommendationOnly && (
        <>
          {/* 📱 Mobile Grid */}
          <div className="md:hidden">
            <MobilePagedGrid
              title="Recently Played"
              items={combinedRecentPlaylists}
              isLoading={rplL}
              renderItem={renderGridItem}
            />
          </div>

        </>
      )}

{!isRecommendationOnly && (
        <>
          {/* 📱 Mobile */}
          <div className="xl:hidden">
            <VerticalStripCarousel
              title="Explore"
              items={combinedNew}
              isLoading={nrL || nrF}
            />
          </div>

          {/* 🖥 Desktop */}
          <div className="hidden md:block xl:hidden">
            {(nrL || nrF) ? (
              <CarouselSection title="Explore" items={[]} />
            ) : (
              <CarouselSection
                title="Explore"
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

      
      {/* Free Playlists */}
      <CarouselSection
        title="Free Playlists"
        useQuery={useGetDashboardFreePlaylistsQuery}
        queryArg={{ limit: 18, offset: 0 }}
        renderItem={(pl) => <PlaylistCard key={pl.id} playlist={pl} />}
      />

      {!isRecommendationOnly && (
      <CarouselSection
        title="All Playlists"
        useQuery={useGetDashboardAllPlaylistsQuery}
        queryArg={{ limit: 18, offset: 0 }}
        renderItem={(pl) => <PlaylistCard key={pl.id} playlist={pl} />}
      />
      )}



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
