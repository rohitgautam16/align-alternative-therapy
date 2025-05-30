import React from 'react';
import CarouselSection from '../components/dashboard/CarouselSection';
import CategoryBanner from '../components/ui/CategoryBanner';
import PlaylistCard from '../components/ui/PlaylistCard';
import CategorySection from '../components/dashboard/CategorySection';


import {
  useGetCategoriesQuery,
  useGetPlaylistByIdQuery,
  useGetRecentlyPlayedQuery,
  useGetMostListenedQuery,
  useGetNewReleasesQuery,
} from '../utils/api';


export default function DashboardHome() {
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
}
