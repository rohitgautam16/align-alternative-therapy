// src/components/dashboard/Personalized Service/PBMyRecommendations.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useListMyPbRecommendationsQuery } from '../../../utils/api';
import { useSubscription } from '../../../context/SubscriptionContext';
import CarouselSection from '../../dashboard/CarouselSection';
import PlaylistCard from '../../custom-ui/PlaylistCard';
import SongCard from '../../custom-ui/SongCard';

export default function PBMyRecommendations() {
  const location = useLocation();
  const { data, isLoading, isError, refetch } = useListMyPbRecommendationsQuery();

    useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('pb') === 'success') {
      refetch(); 
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [location, refetch]);

  // Subscription entitlement (still valid, but not gating PB content anymore)
  const { baseEntitled } = useSubscription();

  if (isLoading) {
    return (
      <div className="rounded-xl p-5 m-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, k) => (
            <div key={k} className="flex flex-col space-y-2">
              <div className="h-46 w-full bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !Array.isArray(data) || data.length === 0) return null;

  const unified = [];
  for (const entry of data) {
    const rec = entry?.recommendation;
    if (!rec) continue;

    const recTitle = rec.title?.trim() || 'Personalized Pack';
    const recId = rec.id;
    const paymentStatus = rec.payment_status || 'pending'; // 'pending' | 'paid' | etc.
    const paymentLinkUrl = rec.payment_link_url || null;

    const items = Array.isArray(entry?.items) ? entry.items : [];

    for (const it of items) {
      if (it.item_type === 'track' && it.track) {
        unified.push({
          type: 'song',
          data: it.track,
          meta: {
            recId,
            recTitle,
            paymentStatus,
            paymentLinkUrl,
            prescription: it.prescription_note || '',
          },
          key: `rec-${recId}-song-${it.track.id}-${it.id}`,
        });
      } else if (it.item_type === 'playlist' && it.playlist) {
        unified.push({
          type: 'playlist',
          data: it.playlist,
          meta: {
            recId,
            recTitle,
            paymentStatus,
            paymentLinkUrl,
            prescription: it.prescription_note || '',
          },
          key: `rec-${recId}-pl-${it.playlist.id}-${it.id}`,
        });
      }
    }
  }

  if (unified.length === 0) return null;

  // 🧠 Single card renderer with payment lock overlay
  function CardWithMeta({ kind, item, meta, k }) {
    const locked = meta.paymentStatus !== 'paid';

    return (
      <div key={k} className="relative group">
        {/* Core card */}
        {kind === 'playlist'
          ? <PlaylistCard playlist={item} />
          : <SongCard song={item} />
        }

        {/* Recommendation title badge */}
        <div className="absolute top-2 left-2">
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-[11px]
              bg-transparent backdrop-blur-sm text-gray-100 ring-1 ring-white/15"
            title={meta.recTitle}
          >
            {meta.recTitle}
          </span>
        </div>

        {/* 🔒 Payment lock overlay */}
        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md
                          bg-black/60 backdrop-blur-[2px] text-center space-y-2 opacity-100">
            <span className="text-white text-md font-medium">Unlock this Recommendation</span>
            {meta.paymentLinkUrl ? (
              <a
                href={meta.paymentLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-transparent border border-white hover:bg-secondary hover:border-secondary rounded-full text-white text-sm transition"
              >
                Pay to Unlock
              </a>
            ) : (
              <span className="text-xs text-gray-300 italic">Link not available</span>
            )}
          </div>
        )}

        {/* Optional prescription caption */}
        {meta.prescription?.trim() && (
          <div
            className="mt-2 px-2 py-1 text-xs text-gray-100 line-clamp-2 backdrop-blur-sm"
            title={meta.prescription}
          >
            Note — {meta.prescription}
          </div>
        )}
      </div>
    );
  }

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
