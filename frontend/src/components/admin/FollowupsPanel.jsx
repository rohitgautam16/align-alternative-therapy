import React from 'react';
import { useAdminListFollowupsQuery, useAdminMarkFollowupSentMutation } from '../../utils/api';

// Shared styles (consistent with other admin panels)
const surface    = 'rounded-xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1220]/90 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]';
const inputCx    = 'px-3 py-2 rounded-lg bg-[#0b1220] text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600';
const btnPrimary = 'px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50 shadow hover:shadow-lg transition';
const btnGhost   = 'px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition';

// Small status chip
function StatusChip({ s }) {
  const map = {
    pending:  'bg-amber-500/20 text-amber-200',
    sent:     'bg-blue-500/20 text-blue-200',
    skipped:  'bg-purple-500/20 text-purple-200',
    done:     'bg-emerald-500/20 text-emerald-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${map[s] || 'bg-white/10 text-gray-200'}`}>
      {s}
    </span>
  );
}

export default function FollowupsPanel() {
  const [params, setParams] = React.useState({ status: 'pending', limit: 100 });
  const { data = [], isLoading, isError, refetch } = useAdminListFollowupsQuery(params, { refetchOnFocus: false });
  const [mark, { isLoading: marking }] = useAdminMarkFollowupSentMutation();

  if (isLoading) {
    return <div className={`${surface} p-4 text-gray-300`}>Loading…</div>;
  }
  if (isError) {
    return (
      <div className={`${surface} p-4 text-gray-300`}>
        Error. <button onClick={refetch} className="underline text-blue-300">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-white">
      {/* Controls */}
      <div className={`${surface} p-3 sm:p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={`${inputCx} basis-[220px] grow shrink-0`}
            value={params.status || ''}
            onChange={(e)=>setParams(s=>({...s, status: e.target.value || undefined}))}
          >
            <option value="">All statuses</option>
            {['pending','sent','skipped','done'].map(s=>(
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className={`${inputCx} basis-[160px] grow shrink-0`}
            value={params.limit}
            onChange={(e)=>setParams(s=>({...s, limit: Number(e.target.value)}))}
          >
            {[25,50,100,200].map(n=> <option key={n} value={n}>{n} rows</option>)}
          </select>

          <button className={`${btnGhost} ml-auto`} onClick={refetch}>Refresh</button>
        </div>
      </div>

      {/* List */}
      <ul className="space-y-2">
        {data.map((f) => (
          <li key={f.id} className={`${surface} p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-medium text-gray-100">#{f.id}</div>
                <StatusChip s={f.status} />
                <div className="text-xs text-gray-400">
                  Scheduled: {new Date(f.scheduled_for).toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                User: {f.user_id} • Recommendation: {f.recommendation_id}
              </div>
              {f.notes && (
                <div className="text-sm text-gray-300 mt-1 line-clamp-2">
                  {f.notes}
                </div>
              )}
            </div>

            {f.status === 'pending' ? (
              <button
                className={btnPrimary}
                disabled={marking}
                onClick={async () => {
                  try {
                    await mark({ followupId: f.id }).unwrap();
                  } catch (e) {
                    alert(e?.data?.error || 'Mark failed');
                  }
                }}
              >
                {marking ? 'Marking…' : 'Mark sent'}
              </button>
            ) : (
              <div className="text-xs text-gray-400">—</div>
            )}
          </li>
        ))}
        {(!data || data.length === 0) && (
          <li className={`${surface} p-4 text-gray-400`}>No follow-ups</li>
        )}
      </ul>
    </div>
  );
}
