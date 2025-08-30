// src/components/personalize/RecommendationsShelf.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { useGetMyQuestionsQuery, api } from '../../../utils/api';
import RecommendationView from './RecommendationView';

const surface    = 'rounded-2xl bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(56,189,248,0.10),transparent),radial-gradient(1200px_600px_at_110%_120%,rgba(167,139,250,0.10),transparent)] from-[#0b0f19] to-[#070b12] bg-gradient-to-b backdrop-blur-sm ring-1 ring-white/5 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.8)] text-white';
const surfaceSub = 'rounded-2xl bg-[radial-gradient(1000px_500px_at_-20%_-20%,rgba(56,189,248,0.08),transparent),radial-gradient(1000px_500px_at_120%_120%,rgba(167,139,250,0.08),transparent)] from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b backdrop-blur-sm ring-1 ring-white/5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.75)] text-white';

const btnGhost   = 'px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60';
const chipBase   = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs ring-1 ring-white/10';


const StatusChip = ({ s }) => {
  const map = {
    draft:     'bg-slate-600/20 text-slate-200',
    sent:      'bg-cyan-500/20 text-cyan-200',
    updated:   'bg-violet-500/20 text-violet-200',
    withdrawn: 'bg-rose-500/20 text-rose-200',
  };
  return <span className={`${chipBase} ${map[s] || 'bg-white/10 text-gray-200'}`}>{s || '—'}</span>;
};

const fmtDate = (ts) => { try { return new Date(ts).toLocaleDateString(); } catch { return String(ts||''); } };

function Modal({ open, onClose, title, children }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur and subtle color wash */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`
            relative w-full max-w-5xl h-[80vh]
            rounded-2xl ring-1 ring-white/10
            bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(56,189,248,0.10),transparent),radial-gradient(1200px_600px_at_110%_120%,rgba(167,139,250,0.10),transparent)]
            from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b
            shadow-[0_30px_80px_-24px_rgba(0,0,0,0.85)]
            text-white
            transform transition-all duration-150
            motion-safe:animate-[fadeIn_120ms_ease-out]
            flex flex-col              
          `}
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Recommendation'}
        >
          {/* Header (larger text and button) */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-lg font-medium text-gray-200">{title || 'Recommendation'}</div>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
              aria-label="Close"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* Body (scrolls within fixed-height modal) */}
          <div className="p-5 sm:p-6 flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}



export default function RecommendationsShelf({ carousel = false }) {
  const dispatch = useDispatch();

  // 1) Your questions via RTK (same auth/baseQuery)
  const args = React.useMemo(() => ({ page: 1, pageSize: 50 }), []);
  const { data: questions, isLoading, isError, refetch } = useGetMyQuestionsQuery(args, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  // 2) For each question, fetch details via RTK programmatic queries (auth-safe)
  const [state, setState] = React.useState({ loading: true, error: null, recs: [] });

  React.useEffect(() => {
    let alive = true;
    const subs = []; // to unsubscribe pending queries on unmount

    (async () => {
      try {
        if (!Array.isArray(questions) || questions.length === 0) {
          if (alive) setState({ loading: false, error: null, recs: [] });
          return;
        }

        if (alive) setState(prev => ({ ...prev, loading: true, error: null }));

        const detailPromises = questions
          .map(q => q.id)
          .filter(Boolean)
          .map(async (qid) => {
            const sub = dispatch(api.endpoints.getMyQuestion.initiate(qid));
            subs.push(sub);
            const json = await sub.unwrap(); // { question, messages, recommendations }
            const recs = Array.isArray(json?.recommendations) ? json.recommendations : [];
            const title = json?.question?.title || `Request #${json?.question?.id || qid}`;
            return recs.map(r => ({
              id: r.id,
              question_id: r.question_id,
              question_title: title,
              status: r.status || 'sent',
              sent_at: r.sent_at,
              updated_at: r.updated_at,
              summary: r.summary_note || '',
              created_at: r.created_at,
            }));
          });

        const nested = await Promise.all(detailPromises);
        const flattened = nested.flat().sort((a, b) => {
          const aT = a.sent_at || a.updated_at || a.created_at;
          const bT = b.sent_at || b.updated_at || b.created_at;
          return new Date(bT || 0) - new Date(aT || 0);
        });

        if (!alive) return;
        setState({ loading: false, error: null, recs: flattened });
      } catch (e) {
        if (!alive) return;
        setState({ loading: false, error: e?.data?.error || e.message || 'Error', recs: [] });
      }
    })();

    return () => {
      alive = false;
      subs.forEach(s => s.unsubscribe && s.unsubscribe());
    };
  }, [dispatch, questions]);

  // 3) Modal for full detail (uses your existing useGetMyRecommendationQuery inside)
  const [openRecId, setOpenRecId] = React.useState(null);
  const [openTitle, setOpenTitle] = React.useState('');
  const open = (rec) => { setOpenRecId(rec.id); setOpenTitle(rec.question_title || `Recommendation #${rec.id}`); };
  const close = () => { setOpenRecId(null); setOpenTitle(''); };

  // ---- Render
  if (isError) {
    return (
      <div className={`${surface} p-4 text-sm`}>
        Failed to load questions. <button onClick={refetch} className="underline text-blue-300">Retry</button>
      </div>
    );
  }

  if (isLoading || state.loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(3)].map((_,i) => (
          <div key={i} className={`${surfaceSub} p-5 animate-pulse`}>
            <div className="h-4 w-2/3 rounded bg-white/10"></div>
            <div className="mt-3 h-3 w-full rounded bg-white/10"></div>
            <div className="mt-2 h-3 w-5/6 rounded bg-white/10"></div>
            <div className="mt-5 h-6 w-1/3 rounded bg-white/10"></div>
          </div>
        ))}
      </div>
    );
  }

  if (state.error) {
    return <div className={`${surface} p-4 text-sm text-red-300`}>Failed to load recommendations: {state.error}</div>;
  }

  if (!state.recs.length) {
    return (
      <div className={`${surface} p-8 text-center text-gray-300`}>
        <div className="text-base font-medium mb-1">No recommendations yet</div>
        <div className="text-sm">Create a new request to receive tailored tracks & playlists.</div>
      </div>
    );
  }

  return (
    <>
{/* Cards grid (cool palette, square, friendly, BIGGER TEXT) */}
<div className={
       carousel
         ? "inline-flex gap-3 sm:gap-4 snap-x snap-mandatory"
         : "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
     }>
  {state.recs.map((rec) => {
    const when = rec.sent_at || rec.updated_at || rec.created_at;
    return (
      <button
        key={`${rec.question_id}-${rec.id}`}
        onClick={() => open(rec)}
        className={`group relative overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform duration-150 hover:-translate-y-0.5 ${
       carousel ? "snap-start min-w-[220px] sm:min-w-[240px] lg:min-w-[260px]" : ""
     }`}
     style={{ aspectRatio: '4 / 5' }}

        aria-label={`Open recommendation ${rec.id} for ${rec.question_title}`}
      >
        {/* ambient gradient canvas */}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_-20%_-20%,rgba(56,189,248,0.10),transparent),radial-gradient(1000px_500px_at_120%_120%,rgba(167,139,250,0.10),transparent)] from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b" />
        {/* subtle border glow on hover */}
        <div aria-hidden className="absolute inset-0 rounded-2xl ring-1 ring-white/10 group-hover:ring-cyan-400/30 transition" />

        {/* content */}
        <div className="absolute inset-0 p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <StatusChip s={rec.status} />
            <svg className="w-6 h-6 text-white/40 group-hover:text-white/70 transition" viewBox="0 0 24 24" fill="none">
              <path d="M7 17l10-10M17 7H9M17 7v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>

          {/* bigger title */}
          <div className="mt-2.5 text-lg md:text-xl text-left font-semibold text-white leading-snug line-clamp-2">
            {rec.question_title}
          </div>

          {/* bigger summary */}
          <div className="relative mt-1.5 text-base text-left text-gray-300 flex-1 overflow-hidden">
            <div className="line-clamp-4 leading-6">
              <span className='text-white font-medium opacity-75'>Remarks - </span>{rec.summary || 'Tap to view the full recommendation.'}
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0e17] to-transparent" />
          </div>

          {/* bigger meta + arrow */}
          <div className="mt-2.5 flex items-center justify-between text-sm text-gray-400">
            <span>{fmtDate(when)}</span>
            <span className="inline-flex items-center gap-1.5 text-gray-300 group-hover:text-white transition">
              Open
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M7 17l10-10M17 7H9M17 7v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </span>
          </div>
        </div>

        {/* corner accent glows */}
        <div aria-hidden className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />
      </button>
    );
  })}
</div>



      <Modal open={!!openRecId} onClose={close} title={openTitle}>
        {openRecId ? <RecommendationView recId={openRecId} /> : null}
      </Modal>
    </>
  );
}
