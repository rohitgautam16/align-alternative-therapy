import React from 'react';
import {
  useAdminListQuestionsQuery,
  useAdminGetQuestionQuery,
  useAdminAssignQuestionMutation,
  useAdminAddMessageMutation,
  useAdminUpdateQuestionStatusMutation,
  useAdminCreateRecommendationMutation,
  api
} from '../../utils/api';
import { useDispatch } from 'react-redux';
import { useAuthStatus } from '../../hooks/useAuthStatus';


const CATS = ['stress_relief','focus_study','sleep_aid','emotional_healing','other'];
const MOODS = ['calm','anxious','sad','angry','tired','stressed','motivated','neutral','other'];
const URG = ['low','normal','high'];
const QSTATUS = ['open','in_progress','awaiting_user','answered','closed'];

const surface = 'bg-gradient-to-b from-[#0f172a]/90 to-[#0b1220]/90 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]';
const inputCx = 'px-3 py-2 rounded-lg bg-[#0b1220] text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600';
const btnPrimary = 'px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50 shadow hover:shadow-lg transition';
const btnGhost = 'px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition';

export default function QuestionsInbox({
  selectedQuestionId,
  onSelectQuestion,
  onOpenRec,
  onCreateRecForQuestion,
}) {
  const [filters, setFilters] = React.useState({ status: 'open', page: 1, pageSize: 30, assigned_admin_id: undefined, q: '' });

  const { data: list = [], isLoading, isError, refetch } = useAdminListQuestionsQuery(filters, {
    refetchOnFocus: false, refetchOnReconnect: false
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: Filters + List */}
      <div className="lg:col-span-1 space-y-3 lg:sticky lg:top-4 self-start">
        <Filters filters={filters} setFilters={setFilters} />

        <div className={`rounded-xl ${surface}`}>
          <div className="px-3 py-2 text-sm text-gray-300">Questions</div>
          <ul className="max-h-[520px] overflow-auto divide-y divide-white/5">
            {isLoading && <li className="px-3 py-3 text-gray-400">Loading…</li>}
            {isError && (
              <li className="px-3 py-3 text-red-400">
                Error loading. <button className="underline" onClick={refetch}>Retry</button>
              </li>
            )}
            {!isLoading && !isError && list.map((q) => {
              const selected = selectedQuestionId === q.id;
              return (
                <li key={q.id}>
                  <button
                    onClick={() => onSelectQuestion(q.id)}
                    className={[
                      'w-full text-left px-3 py-2 transition',
                      selected ? 'bg-white/10' : 'hover:bg-white/5'
                    ].join(' ')}
                  >
                    <div className="font-medium text-gray-100 truncate">{q.title}</div>
                    <div className="text-[12px] text-gray-400">
                      <StatusChip s={q.status} /> • {q.category} • {q.mood}
                    </div>
                    <div className="text-[11px] text-gray-500">{q.user_name}</div>
                  </button>
                </li>
              );
            })}
            {!isLoading && !isError && (!list || list.length === 0) && (
              <li className="px-3 py-3 text-gray-400">No results</li>
            )}
          </ul>
        </div>
      </div>

      {/* RIGHT: Thread / Detail */}
      <div className="lg:col-span-2">
        {selectedQuestionId ? (
          <QuestionThread
            questionId={selectedQuestionId}
            onOpenRec={onOpenRec}
            onCreateRecForQuestion={onCreateRecForQuestion}
          />
        ) : (
          <div className={`rounded-xl ${surface} p-6 text-gray-400`}>Select a question</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Filters (with debounced search) ---------- */
function Filters({ filters, setFilters }) {
  const [qInput, setQInput] = React.useState(filters.q || '');

  React.useEffect(() => {
    const t = setTimeout(() => setFilters((s) => ({ ...s, q: qInput })), 300);
    return () => clearTimeout(t);
  }, [qInput, setFilters]);

  // wider, non-shrinking control
  const ctrl = [
    'px-3 py-2 rounded-lg',
    'bg-[#0b1220] text-gray-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-600',
    'basis-[240px] sm:basis-[260px] xl:basis-[300px]', // <- default widths
    'grow shrink-0',                                    // <- prevent tiny shrink
    'max-w-full',                                       // <- never overflow
  ].join(' ');

  return (
    <div className={`rounded-xl p-3 sm:p-4 ${surface}`}>
      {/* flex-wrap ensures nice wrapping; basis keeps comfortable width */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value || undefined }))}
          className={ctrl}
        >
          <option value="">All statuses</option>
          {QSTATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.category || ''}
          onChange={(e) => setFilters((s) => ({ ...s, category: e.target.value || undefined }))}
          className={ctrl}
        >
          <option value="">All categories</option>
          {CATS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filters.mood || ''}
          onChange={(e) => setFilters((s) => ({ ...s, mood: e.target.value || undefined }))}
          className={ctrl}
        >
          <option value="">All moods</option>
          {MOODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={filters.urgency || ''}
          onChange={(e) => setFilters((s) => ({ ...s, urgency: e.target.value || undefined }))}
          className={ctrl}
        >
          <option value="">All urgency</option>
          {URG.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        {/* make search a bit wider by default */}
        <input
          className={[ctrl, 'basis-[300px] xl:basis-[360px]'].join(' ')}
          placeholder="Search title/desc…"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
      </div>
    </div>
  );
}


/* ---------- Status chip ---------- */
function StatusChip({ s }) {
  const map = {
    open: 'bg-emerald-500/20 text-emerald-300',
    in_progress: 'bg-blue-500/20 text-blue-300',
    awaiting_user: 'bg-amber-500/20 text-amber-300',
    answered: 'bg-purple-500/20 text-purple-300',
    closed: 'bg-gray-500/20 text-gray-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${map[s] || 'bg-white/10 text-gray-200'}`}>
      {s}
    </span>
  );
}

/* ---------- Thread ---------- */
function QuestionThread({ questionId, onOpenRec, onCreateRecForQuestion }) {
  const dispatch = useDispatch();
  const { user } = useAuthStatus();
  const myAdminId = user?.id;

  const { data, isLoading, isError, refetch } = useAdminGetQuestionQuery(questionId, {
    skip: !questionId, refetchOnFocus: false, refetchOnReconnect: false
  });
  const [assign] = useAdminAssignQuestionMutation();
  const [updateStatus] = useAdminUpdateQuestionStatusMutation();
  const [sendMsg, { isLoading: sending }] = useAdminAddMessageMutation();
  const [createRec, { isLoading: creatingRec }] = useAdminCreateRecommendationMutation();

  const [body, setBody] = React.useState('');
  const [summary, setSummary] = React.useState('');

  if (isLoading) return <div className={`${surface} rounded-xl p-4 text-gray-400`}>Loading…</div>;
  if (isError || !data) return (
    <div className={`${surface} rounded-xl p-4 text-gray-300`}>
      Not found. <button onClick={refetch} className="underline text-blue-300">Retry</button>
    </div>
  );

  const { question, messages, recommendations } = data;

  async function assignToMe() {
    try {
      await assign({ questionId, adminId: myAdminId }).unwrap();
    } catch (e) { alert(e?.data?.error || 'Assign failed'); }
  }

  async function setQStatus(status) {
    try {
      await updateStatus({ questionId, status }).unwrap();
    } catch (e) { alert(e?.data?.error || 'Status update failed'); }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    try {
      const res = await sendMsg({ questionId, body: text }).unwrap();
      // optimistic append to adminGetQuestion cache
      dispatch(api.util.updateQueryData('adminGetQuestion', questionId, (draft) => {
        draft.messages = draft.messages || [];
        draft.messages.push({
          id: res.id, question_id: questionId, sender_role: 'admin',
          body: text, attachment_url: null, created_at: new Date().toISOString(),
          sender_name: null,
        });
      }));
      setBody('');
    } catch (e) { alert(e?.data?.error || 'Send failed'); }
  }

  async function createDraftRecommendation() {
    try {
      const res = await createRec({ questionId, summary_note: summary }).unwrap(); // { id }
      onOpenRec?.(res.id);
    } catch (e) { alert(e?.data?.error || 'Create recommendation failed'); }
  }

  return (
    <div className={`rounded-xl ${surface}`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-100">{question.title}</div>
          <div className="text-xs text-gray-400">
            <StatusChip s={question.status} /> • {question.category} • {question.mood}
          </div>
          <div className="text-[11px] text-gray-500">User: {question.user_id} • Assigned: {question.assigned_admin_id ?? '—'}</div>
        </div>
        <div className="flex gap-2">
          <button className={btnGhost} onClick={assignToMe}>Assign to me</button>
          <select
            className={inputCx}
            value={question.status}
            onChange={(e)=>setQStatus(e.target.value)}
          >
            {QSTATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-2">
        {/* Conversation */}
        <div className="p-4 lg:border-r border-white/5">
          <h3 className="font-medium text-gray-100">Conversation</h3>
          <div className="space-y-3 max-h-[420px] overflow-auto pr-2 mt-2">
            {messages?.map((m) => (
              <div key={m.id} className="p-3 rounded-lg bg-white/5">
                <div className="text-xs text-gray-400">{m.sender_role} • {new Date(m.created_at).toLocaleString()}</div>
                <div className="mt-1 whitespace-pre-wrap text-gray-100">{m.body}</div>
              </div>
            ))}
            {(!messages || messages.length === 0) && <div className="text-gray-400">No messages</div>}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 items-center mt-3">
            <input className={`flex-1 ${inputCx}`} placeholder="Reply…" value={body} onChange={e=>setBody(e.target.value)} />
            <button className={btnPrimary} disabled={sending || !body.trim()}>{sending ? 'Sending…' : 'Send'}</button>
          </form>
        </div>

        {/* Recommendations */}
        <div className="p-4 space-y-3">
          <h3 className="font-medium text-gray-100">Recommendations</h3>
          <ul className="space-y-2">
            {recommendations?.map((r) => (
              <li key={r.id} className="rounded-lg bg-white/5 p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-100">#{r.id} • {r.status}</div>
                  <div className="text-xs text-gray-400">
                    {r.sent_at ? `sent ${new Date(r.sent_at).toLocaleString()}` : `updated ${new Date(r.updated_at).toLocaleString()}`}
                  </div>
                </div>
                <button className={btnGhost} onClick={() => onOpenRec?.(r.id)}>Open</button>
              </li>
            ))}
            {(!recommendations || recommendations.length === 0) && <li className="text-gray-400">No recommendations yet.</li>}
          </ul>

          <div className="mt-3 rounded-lg bg-white/5 p-3">
            <div className="text-sm mb-2 font-medium text-gray-100">Create draft recommendation</div>
            <textarea className={`${inputCx} w-full`} rows={3} placeholder="Summary note (optional)" value={summary} onChange={e=>setSummary(e.target.value)} />
            <button className={`${btnPrimary} mt-2`} disabled={creatingRec} onClick={createDraftRecommendation}>
              {creatingRec ? 'Creating…' : 'Create draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
