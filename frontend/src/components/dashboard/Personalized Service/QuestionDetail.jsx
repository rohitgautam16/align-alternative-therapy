import React from 'react';
import { useDispatch } from 'react-redux';
import { useGetMyQuestionQuery, useAddMyMessageMutation, api } from '../../../utils/api';
import RecommendationView from './RecommendationView';

/* ------------------ Cool glass tokens (match cards) ------------------ */
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
const inputCx = 'px-3 py-2.5 rounded-lg bg-[#0b1220] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-600';
const btnPrimary = 'px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 disabled:opacity-60 shadow hover:shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60';
const btnGhost = 'px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50';
const chipBase = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-white/10';

/* ------------------ Helpers ------------------ */
const chipMap = {
  status: {
    open:           'text-emerald-200',
    in_progress:    'text-cyan-200',
    awaiting_user:  'text-amber-200',
    answered:       'text-violet-200',
    closed:         'text-slate-200',
  },
  category: 'text-gray-200',
  mood:     'text-gray-200',
};

function chip(cx) { return `${chipBase} ${cx}`; }

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return String(ts || ''); }
}

/* ------------------ Component ------------------ */
export default function QuestionDetail({ questionId }) {
  const dispatch = useDispatch();
  const { data, isLoading, isError, refetch } = useGetMyQuestionQuery(questionId, {
    skip: !questionId,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const [addMessage, { isLoading: sending }] = useAddMyMessageMutation();
  const [body, setBody] = React.useState('');
  const [activeRecId, setActiveRecId] = React.useState(null);

  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    setActiveRecId(null);
    setBody('');
  }, [questionId]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [data?.messages?.length]);

  if (!questionId) return null;

  if (isLoading) return <div className={`${surface} p-5 text-base`}>Loading…</div>;
  if (isError || !data) {
    return (
      <div className={`${surface} p-5 text-base`}>
        Not found. <button onClick={refetch} className="underline text-cyan-300">Retry</button>
      </div>
    );
  }

  const { question, messages, recommendations } = data;

  async function sendMessage(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;

    try {
      const res = await addMessage({ questionId, body: text }).unwrap(); // { id }
      dispatch(
        api.util.updateQueryData('getMyQuestion', questionId, (draft) => {
          draft.messages = draft.messages || [];
          draft.messages.push({
            id: res.id,
            question_id: questionId,
            sender_role: 'user',
            body: text,
            attachment_url: null,
            created_at: new Date().toISOString(),
            sender_name: null,
          });
        })
      );
      setBody('');
      setTimeout(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 0);
    } catch (err) {
      console.error('addMessage error', err);
      alert(err?.data?.error || 'Failed to send message');
    }
  }

  return (
    <div className={surface}>
      {/* Header (no borders) */}
      <div className="p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="text-xl sm:text-2xl font-semibold text-white">{question.title}</div>
            <div className="flex flex-wrap gap-2">
              <span className={chip(chipMap.status[question.status] || 'text-gray-200')}>{question.status}</span>
              <span className={chip(chipMap.category)}>{question.category}</span>
              <span className={chip(chipMap.mood)}>{question.mood}</span>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Created {fmt(question.created_at)}
          </div>
        </div>
      </div>

      {/* Body: two columns on lg */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 p-4">
        {/* Conversation */}
        <section className={`${surfaceSub} p-4 flex flex-col h-[560px]`}>
          <div className="font-medium text-gray-100">Conversation</div>

          {/* Scroll area */}
          <div ref={scrollRef} className="mt-3 flex-1 overflow-auto pr-1 space-y-3">
            {messages?.map((m) => {
              const mine = m.sender_role === 'user';
              return (
                <div
                  key={m.id}
                  className={['flex', mine ? 'justify-end' : 'justify-start'].join(' ')}
                >
                  <div
                    className={[
                      'max-w-[80%] rounded-2xl px-3.5 py-2.5 leading-relaxed',
                      mine
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                        : 'bg-white/10 text-gray-100'
                    ].join(' ')}
                  >
                    <div className="text-[11px] opacity-80">
                      {m.sender_role} • {fmt(m.created_at)}
                    </div>
                    <div className="mt-1.5 whitespace-pre-wrap">{m.body}</div>
                  </div>
                </div>
              );
            })}
            {(!messages || messages.length === 0) && (
              <div className="text-gray-400">No messages yet.</div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={sendMessage} className="mt-3 flex gap-2">
            <input
              className={`${inputCx} flex-1`}
              placeholder="Type a message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (!sending && body.trim()) sendMessage(e);
                }
              }}
            />
            <button
              className={btnPrimary}
              disabled={sending || !body.trim()}
              type="submit"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </section>

        {/* Recommendations (compact list -> glass items) */}
        <section className="space-y-3">
          <div className={`${surfaceSub} p-4`}>
            <div className="font-medium text-gray-100 mb-3">Recommendations</div>
            <ul className="space-y-2">
              {recommendations?.map((r) => (
                <li key={r.id} className="rounded-xl bg-white/5 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-100">#{r.id} • {r.status}</div>
                    <div className="text-xs text-gray-400">
                      {r.sent_at ? `sent ${fmt(r.sent_at)}` : `updated ${fmt(r.updated_at)}`}
                    </div>
                  </div>
                  <button
                    className={btnGhost}
                    onClick={() => setActiveRecId(r.id)}
                    type="button"
                  >
                    View
                  </button>
                </li>
              ))}
              {(!recommendations || recommendations.length === 0) && (
                <li className="text-gray-400">No recommendations yet.</li>
              )}
            </ul>
          </div>

          {activeRecId && (
            <div
              className={`
                ${surfaceSub} p-4 sm:p-5
                overflow-x-auto overflow-y-visible
                overscroll-x-contain
                scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent
                -mx-2 sm:-mx-3 px-2 sm:px-3   
              `}
            >
              {/* Make the whole view wider so x-scroll appears */}
              <div className="inline-block min-w-[1000px] align-top">
                <RecommendationView recId={activeRecId} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
