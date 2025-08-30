import React from 'react';
import {
  useGetMyRecommendationQuery,
  useAddItemFeedbackMutation,
  useGetAllSongsQuery,
  useGetDashboardAllPlaylistsQuery,
} from '../../../utils/api';
import PlaylistCard from '../../custom-ui/PlaylistCard';
import SongCard from '../../custom-ui/SongCard';

/* --- Cool dark, CLEAN (no borders/rings) --- */
const surface = `
  rounded-2xl
  bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(56,189,248,0.10),transparent),
      radial-gradient(1200px_600px_at_110%_120%,rgba(167,139,250,0.10),transparent)]
  from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b
  backdrop-blur-sm shadow-[0_12px_40px_-16px_rgba(0,0,0,0.8)] text-white
`;
const surfaceSub = `
  rounded-2xl
  bg-[radial-gradient(1000px_500px_at_-20%_-20%,rgba(56,189,248,0.08),transparent),
      radial-gradient(1000px_500px_at_120%_120%,rgba(167,139,250,0.08),transparent)]
  from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b
  backdrop-blur-sm shadow-[0_10px_30px_-18px_rgba(0,0,0,0.75)] text-white
`;
const chipBase = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-white/10';
const btnBase = 'inline-flex items-center gap-2 rounded-lg disabled:opacity-60 shadow hover:shadow-lg transition focus:outline-none focus-visible:ring-2';
const btnGood = `${btnBase} px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white focus-visible:ring-emerald-400/60`;
const btnWarn = `${btnBase} px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white focus-visible:ring-amber-400/60`;

function StatusChip({ s }) {
  const map = {
    draft:     'text-slate-200',
    sent:      'text-cyan-200',
    updated:   'text-violet-200',
    withdrawn: 'text-rose-200',
  };
  return <span className={`${chipBase} ${map[s] || 'text-gray-200'}`}>{s || '—'}</span>;
}

const fmt = (ts) => { try { return new Date(ts).toLocaleString(); } catch { return String(ts||''); } };

export default function RecommendationView({ recId }) {
  const { data, isLoading, isError, refetch } = useGetMyRecommendationQuery(recId, {
    skip: !recId,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const [submitFeedback] = useAddItemFeedbackMutation();
  const [sentMap, setSentMap] = React.useState({}); // itemId -> 'helpful' | 'needs_change'

  const recommendation = data?.recommendation || null;
  const items = data?.items || [];

  const trackIds = React.useMemo(
    () => Array.from(new Set(items.filter(i => i.item_type === 'track' && i.track_id != null).map(i => Number(i.track_id)))),
    [items]
  );
  const playlistIds = React.useMemo(
    () => Array.from(new Set(items.filter(i => i.item_type === 'playlist' && i.playlist_id != null).map(i => Number(i.playlist_id)))),
    [items]
  );

  const { songsMap, songsLoading } = useGetAllSongsQuery(undefined, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
    selectFromResult: ({ data: songs, isLoading }) => {
      const m = new Map();
      if (Array.isArray(songs)) {
        for (const s of songs) if (trackIds.includes(Number(s.id))) m.set(Number(s.id), s);
      }
      return { songsMap: m, songsLoading: isLoading };
    },
  });

  const { playlistsMap, playlistsLoading } = useGetDashboardAllPlaylistsQuery(undefined, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
    selectFromResult: ({ data: raw, isLoading }) => {
      const list = Array.isArray(raw) ? raw : (raw?.playlists ?? raw ?? []);
      const m = new Map();
      if (Array.isArray(list)) {
        for (const p of list) if (playlistIds.includes(Number(p.id))) m.set(Number(p.id), p);
      }
      return { playlistsMap: m, playlistsLoading: isLoading };
    },
  });

  async function sendFeedback(itemId, feedback) {
    try {
      await submitFeedback({ itemId, feedback }).unwrap();
      setSentMap((m) => ({ ...m, [itemId]: feedback }));
    } catch (err) {
      console.error('feedback error', err);
      alert(err?.data?.error || 'Failed to submit feedback');
    }
  }

  if (!recId) return null;

  if (isLoading) return <div className={`${surface} p-5 text-base`}>Loading…</div>;
  if (isError || !recommendation) {
    return (
      <div className={`${surface} p-5 text-base`}>
        Not found. <button onClick={refetch} className="underline text-cyan-300">Retry</button>
      </div>
    );
  }

  const loadingAny = songsLoading || playlistsLoading;

  return (
    <div className={surface}>
      {/* Header (no borders) */}
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-lg sm:text-xl font-semibold text-white">
              Recommendation #{recommendation.id}
            </div>
            <StatusChip s={recommendation.status} />
          </div>
          <div className="text-sm text-gray-400">
            {recommendation.sent_at ? `Sent: ${fmt(recommendation.sent_at)}` : `Updated: ${fmt(recommendation.updated_at)}`}
          </div>
        </div>
        {recommendation.summary_note && (
          <div className="text-base text-gray-300 mt-3 whitespace-pre-wrap leading-6">
            {recommendation.summary_note}
          </div>
        )}
      </div>

      {/* Items Grid (no borders/rings) */}
      <div className="p-5">
        {loadingAny && <div className={`${surfaceSub} p-5 text-base text-gray-300 mb-4`}>Loading items…</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const disabled = Boolean(sentMap[it.id]);
            const isTrack = it.item_type === 'track';
            const song = isTrack ? songsMap.get(Number(it.track_id)) : null;
            const pl = !isTrack ? playlistsMap.get(Number(it.playlist_id)) : null;

            return (
              <div key={it.id} className={`${surfaceSub} p-4 sm:p-5 flex flex-col`}>
                {/* Media card (force unlocked playlists; no borders) */}
                <div className="mb-4">
                  {isTrack ? (
                    song ? (
                      <SongCard key={`s-${it.id}`} song={song} />
                    ) : (
                      <div className="rounded-2xl bg-white/5 p-4 text-gray-300">Track #{it.track_id} (loading…)</div>
                    )
                  ) : (
                    pl ? (
                      // Hint to your component that user is premium / unlocked
                      <PlaylistCard
                        key={`p-${it.id}`}
                        playlist={pl}
                        premium={true}
                        isPremium={true}
                        locked={false}
                        showLock={false}
                        forceUnlocked
                      />
                    ) : (
                      <div className="rounded-2xl bg-white/5 p-4 text-gray-300">Playlist #{it.playlist_id} (loading…)</div>
                    )
                  )}
                </div>

                {/* Prescription / notes (if any) */}
                {it.prescription_note && (
                  <div className="text-base text-gray-300 mb-4 whitespace-pre-wrap leading-6">
                    {it.prescription_note}
                  </div>
                )}

                {/* Feedback actions (no borders) */}
                <div className="mt-auto flex flex-wrap gap-3">
                  <button
                    className={btnGood}
                    disabled={disabled}
                    onClick={() => sendFeedback(it.id, 'helpful')}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M7 11v9H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h3zm2 9h6.28a2 2 0 0 0 1.94-1.48l1.26-5.03A2 2 0 0 0 16.56 11H13V7a3 3 0 0 0-3-3c-.35 0-.7.06-1.02.18L8 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm font-medium">Helpful</span>
                  </button>

                  <button
                    className={btnWarn}
                    disabled={disabled}
                    onClick={() => sendFeedback(it.id, 'needs_change')}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
                    </svg>
                    <span className="text-sm font-medium">Needs change</span>
                  </button>

                  {disabled && (
                    <span className="text-xs text-gray-400 self-center">
                      Thanks! ({sentMap[it.id]})
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className={`${surfaceSub} p-5 text-base text-gray-300 col-span-full`}>No items.</div>
          )}
        </div>
      </div>
    </div>
  );
}
