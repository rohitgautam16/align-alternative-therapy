import React from 'react';
import CarouselSection from '../components/dashboard/CarouselSection';
import CategoryBanner from '../components/custom-ui/CategoryBanner';
import PlaylistCard from '../components/custom-ui/PlaylistCard';
import CategorySection from '../components/dashboard/CategorySection';
import TransitionWrapper from '../components/custom-ui/transition';


import {
  useGetCategoriesQuery,
  useGetPlaylistByIdQuery,
  useGetRecentlyPlayedQuery,
  useGetMostListenedQuery,
  useGetNewReleasesQuery,
} from '../utils/api';


const DashboardHome = () => {
  return (
    <div className="space-y-12 rounded-2xl">
      {/* <CarouselSection title="Categories" useQuery={useGetCategoriesQuery} renderItem={(cat) => <CategoryBanner category={cat} />} /> */}
      <CategorySection />
      <CarouselSection title="All Playlists" useQuery={useGetPlaylistByIdQuery} renderItem={(pl) => <PlaylistCard playlist={pl} />} />
      <CarouselSection title="For You" useQuery={useGetPlaylistByIdQuery} />
      <CarouselSection title="Recently Played" useQuery={useGetPlaylistByIdQuery} />
      <CarouselSection title="Most Listened" useQuery={useGetPlaylistByIdQuery} />
      <CarouselSection title="New Releases" useQuery={useGetPlaylistByIdQuery} />
    </div>
  );
};

export default TransitionWrapper(DashboardHome);

