import React from 'react';
import { useListMyFollowupsQuery, useRecordMyFollowupResponseMutation, api } from '../../../utils/api';
import { useDispatch } from 'react-redux';

/* --------- Glass tokens (match cards/shelf) --------- */
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

const btnBase = 'px-4 py-2.5 rounded-lg text-white disabled:opacity-60 shadow hover:shadow-lg transition focus:outline-none focus-visible:ring-2';
const btnPrimary = `${btnBase} bg-gradient-to-r from-cyan-600 to-blue-600 focus-visible:ring-cyan-400/60`;
const btnWarn    = `${btnBase} bg-gradient-to-r from-amber-600 to-orange-600 focus-visible:ring-amber-400/60`;
const btnGhost   = 'px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50';

const chipBase = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-white/10';
function StatusChip({ s }) {
  const map = {
    pending:  'text-amber-200',
    sent:     'text-cyan-200',
    skipped:  'text-violet-200',
    done:     'text-emerald-200',
  };
  return <span className={`${chipBase} ${map[s] || 'text-gray-200'}`}>{s}</span>;
}

function fmt(ts) { try { return new Date(ts).toLocaleString(); } catch { return String(ts || ''); } }

export default function FollowupsList() {
  const dispatch = useDispatch();
  const queryArgs = { status: 'pending', limit: 50 };
  const { data, isLoading, isError, refetch } = useListMyFollowupsQuery(queryArgs, {
    refetchOnFocus: false, refetchOnReconnect: false,
  });
  const [respond, { isLoading: saving }] = useRecordMyFollowupResponseMutation();

  async function submitResponse(followupId, response) {
    try {
      await respond({ followupId, response }).unwrap();
      // Optimistic remove from pending list
      dispatch(
        api.util.updateQueryData('listMyFollowups', queryArgs, (draft) => {
          const idx = draft.findIndex((f) => f.id === followupId);
          if (idx >= 0) draft.splice(idx, 1);
        })
      );
    } catch (err) {
      console.error('followup response error', err);
      alert(err?.data?.error || 'Failed to submit response');
    }
  }

  if (isLoading) {
    return (
      <div className={`${surface} p-5 text-base`}>
        Loading…
      </div>
    );
  }
  if (isError) {
    return (
      <div className={`${surface} p-5 text-base`}>
        Error. <button onClick={refetch} className="underline text-cyan-300">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header (glass, no borders) */}
      <div className={`${surface} px-6 py-5 sm:px-8 sm:py-6 relative overflow-hidden`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Your Follow-ups</h2>
            <p className="text-sm text-gray-300">Tell us if your personalized plan helped.</p>
          </div>
          <button className={btnGhost} onClick={refetch} type="button">Refresh</button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {data?.map((f) => (
          <div
            key={f.id}
            className={`${surfaceSub} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 min-w-0`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-base sm:text-lg font-medium text-white">Follow-up #{f.id}</div>
                <StatusChip s={f.status} />
                <div className="text-xs text-gray-400">Scheduled: {fmt(f.scheduled_for)}</div>
              </div>

              <div className="text-xs text-gray-400 mt-1">
                {f.recommendation_id ? <>Recommendation: {f.recommendation_id}</> : null}
              </div>

              {f.notes && (
                <div className="text-sm text-gray-300 mt-2 line-clamp-2">
                  {f.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <button
                className={btnPrimary}
                disabled={saving}
                onClick={() => submitResponse(f.id, 'helped')}
                title="The plan helped"
                type="button"
              >
                Helped
              </button>
              <button
                className={btnWarn}
                disabled={saving}
                onClick={() => submitResponse(f.id, 'not_helped')}
                title="The plan didn’t help"
                type="button"
              >
                Not helped
              </button>
              <button
                className={btnGhost}
                disabled={saving}
                onClick={() => submitResponse(f.id, 'no_response')}
                title="Skip for now"
                type="button"
              >
                Skip
              </button>
            </div>
          </div>
        ))}

        {(!data || data.length === 0) && (
          <div className={`${surface} p-10 text-center text-gray-300`}>
            <div className="text-base font-medium mb-1">No pending follow-ups</div>
            <div className="text-sm">We’ll ping you after your next recommendation.</div>
          </div>
        )}
      </div>
    </div>
  );
}
