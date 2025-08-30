import React from 'react';
import { useGetMyQuestionsQuery } from '../../../utils/api';

/* Cool dark (no borders) */
const surface = `
  rounded-2xl
  bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(56,189,248,0.10),transparent),
      radial-gradient(1200px_600px_at_110%_120%,rgba(167,139,250,0.10),transparent)]
  from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b
  backdrop-blur-sm shadow-[0_12px_40px_-16px_rgba(0,0,0,0.8)] text-white
`;
const chipBase = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-white/10';

const StatusChip = ({ s }) => {
  const map = {
    open:           'text-emerald-200',
    in_progress:    'text-cyan-200',
    awaiting_user:  'text-amber-200',
    answered:       'text-violet-200',
    closed:         'text-slate-200',
  };
  return <span className={`${chipBase} ${map[s] || 'text-gray-200'}`}>{s}</span>;
};

function fmt(ts) { try { return new Date(ts).toLocaleDateString(); } catch { return String(ts||''); } }

/**
 * Props:
 *  - onSelect(id:number)
 *  - selectedId?: number
 */
export default function QuestionsList({ onSelect, selectedId, carousel = false }) {
  const args = React.useMemo(() => ({ page: 1, pageSize: 50 }), []);
  const { data, isLoading, isError, refetch } = useGetMyQuestionsQuery(args, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
    pollingInterval: 0,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${surface} relative overflow-hidden`} style={{ paddingTop: '100%' }}>
            <div className="absolute inset-0 p-5 animate-pulse">
              <div className="h-5 w-2/3 rounded bg-white/10" />
              <div className="mt-3 h-4 w-5/6 rounded bg-white/10" />
              <div className="mt-2 h-4 w-2/3 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className={`${surface} p-5 text-sm`}>
        Failed to load your requests. <button onClick={refetch} className="underline text-cyan-300">Retry</button>
      </div>
    );
  }

  const list = Array.isArray(data) ? data : [];

  if (!list.length) {
    return (
      <div className={`${surface} p-8 text-center text-gray-300`}>
        <div className="text-base font-medium mb-1">No requests yet</div>
        <div className="text-sm">Create a new request to get tailored playlists & tracks.</div>
      </div>
    );
  }

  return (
    <div className={
     carousel
       ? "inline-flex gap-3 sm:gap-4 snap-x snap-mandatory"
       : "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
   }>
      {list.map((q) => {
        const active = selectedId === q.id;
        return (
          <button
            key={q.id}
            onClick={() => onSelect?.(q.id)}
            className={`group relative overflow-hidden rounded-2xl text-left focus:outline-none transition-transform duration-150 hover:-translate-y-0.5 ${
                  carousel ? "snap-start min-w-[220px] sm:min-w-[240px] lg:min-w-[260px]" : ""
                }`}
            style={{ aspectRatio: '4 / 5' }}
            aria-label={`Open question ${q.id}`}
          >
            {/* Glass canvas */}
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_-20%_-20%,rgba(56,189,248,0.10),transparent),radial-gradient(1000px_500px_at_120%_120%,rgba(167,139,250,0.10),transparent)] from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b" />
            {/* Active glow */}
            {active && <div aria-hidden className="absolute inset-0 shadow-[0_0_0_2px_rgba(34,211,238,0.35)_inset] rounded-2xl" />}

            {/* Content */}
            <div className="absolute inset-0 p-3.5 sm:p-4 flex flex-col">
              {/* Status + icon */}
              <div className="flex items-center justify-between">
                <StatusChip s={q.status} />
                <svg className="w-6 h-6 text-white/40 group-hover:text-white/70 transition" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17l10-10M17 7H9M17 7v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>

              {/* Title */}
              <div className="mt-2.5 text-lg md:text-xl font-semibold text-white leading-snug line-clamp-2">
                {q.title}
              </div>

              {/* Meta */}
              <div className="mt-auto">
                <div className="text-xs text-gray-300">{q.category}</div>
                <div className="mt-1 text-sm text-gray-400">{fmt(q.created_at)}</div>
              </div>
            </div>

            {/* Accent glows */}
            <div aria-hidden className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
            <div aria-hidden className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />
          </button>
        );
      })}
    </div>
  );
}
