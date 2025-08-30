// src/components/dashboard/Personalized Service/PBMyRecommendations.jsx
import React from 'react';
import { useListMyPbRecommendationsQuery } from '../../../utils/api';
import { useSubscription } from '../../../context/SubscriptionContext';
import CarouselSection from '../../dashboard/CarouselSection';
import PlaylistCard from '../../custom-ui/PlaylistCard';
import SongCard from '../../custom-ui/SongCard';

export default function PBMyRecommendations() {
  const { data, isLoading, isError } = useListMyPbRecommendationsQuery();

  // Entitlement from context (server-driven when available)
  const { baseEntitled, addonEntitled } = useSubscription();

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[#0b0f19] ring-1 ring-white/10 p-5">
        <div className="h-4 w-40 bg-white/10 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, k) => (
            <div key={k} className="h-36 bg-white/10 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // If endpoint fails or nothing to show, don't render the section
  if (isError || !Array.isArray(data) || data.length === 0) return null;

  // Build a single unified carousel list across all recommendations.
  const unified = [];
  for (const entry of data) {
    const rec = entry?.recommendation;
    const recTitle = rec?.title?.trim() || 'Personalized Pack';
    const recId = rec?.id;
    const items = Array.isArray(entry?.items) ? entry.items : [];
    for (const it of items) {
      if (it.item_type === 'track' && it.track) {
        unified.push({
          type: 'song',
          data: it.track,
          meta: { recId, recTitle, prescription: it.prescription_note || '' },
          key: `rec-${recId}-song-${it.track.id}-${it.id}`,
        });
      } else if (it.item_type === 'playlist' && it.playlist) {
        unified.push({
          type: 'playlist',
          data: it.playlist,
          meta: { recId, recTitle, prescription: it.prescription_note || '' },
          key: `rec-${recId}-pl-${it.playlist.id}-${it.id}`,
        });
      }
    }
  }

  if (unified.length === 0) return null;

  // Single card renderer with overlays
  function CardWithMeta({ kind, item, meta, k }) {
    // Consider paid playlists as requiring base entitlement
    const requiresBase = kind === 'playlist' ? Boolean(item?.paid) : false;
    const locked = requiresBase && !baseEntitled;

    return (
      <div key={k} className="relative">
        {/* Core card (unchanged logic) */}
        {kind === 'playlist'
          ? <PlaylistCard playlist={item} />
          : <SongCard song={item} />
        }

        {/* Rec title badge (top-left) with blur background for legibility */}
        <div className="absolute top-2 left-2">
          <span
            className="
              inline-flex items-center px-2 py-1 rounded-full text-[11px]
              bg-transparent backdrop-blur-sm text-gray-100
              ring-1 ring-white/15
            "
            title={meta.recTitle}
          >
            {meta.recTitle}
          </span>
        </div>

        {/* Lock overlay if user not entitled for paid content */}
        {/* {locked && (
          <div className="absolute inset-0 rounded-md bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-white/10 ring-1 ring-white/15 text-white">
              Subscribe to play
            </span>
          </div>
        )} */}

        {/* Prescription note (caption) with same blur treatment */}
        {meta.prescription?.trim() ? (
          <div
            className="
              mt-2 px-2 py-1 text-xs text-gray-100 line-clamp-2
              backdrop-blur-sm
            "
            title={meta.prescription}
          >
            Note — {meta.prescription}
          </div>
        ) : null}
      </div>
    );
  }

  // Optionally: if you want to hide the whole section for users without add-on entitlement:
  // if (!addonEntitled) return null;

  return (
    <CarouselSection
      title="For You"
      items={unified}
      renderItem={(entry) => (
        <CardWithMeta
          key={entry.key}
          kind={entry.type === 'playlist' ? 'playlist' : 'song'}
          item={entry.data}
          meta={entry.meta}
          k={entry.key}
        />
      )}
    />
  );
}
