import React from 'react';
import { useCreateQuestionMutation } from '../../../utils/api';
import { useDispatch } from 'react-redux';

const CATEGORIES = ['stress_relief','focus_study','sleep_aid','emotional_healing','other'];
const MOODS      = ['calm','anxious','sad','angry','tired','stressed','motivated','neutral','other'];
const URGENCY    = ['low','normal','high'];

/* ---------------- Glass tokens (match cards/shelf) ---------------- */
const surface = `
  rounded-2xl
  bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(56,189,248,0.10),transparent),
      radial-gradient(1200px_600px_at_110%_120%,rgba(167,139,250,0.10),transparent)]
  from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b
  backdrop-blur-sm shadow-[0_12px_40px_-16px_rgba(0,0,0,0.8)] text-white
`;
const field = 'px-3 py-2.5 rounded-lg bg-[#0b1220] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-600';
const label = 'text-xs font-medium text-gray-300';
const btnPrimary = 'w-full py-2.5 rounded-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 disabled:opacity-60 shadow hover:shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60';

/* Non-shrinking control base (flex-wrap friendly) */
const ctrlWide = 'grow shrink-0 basis-[220px] sm:basis-[260px] xl:basis-[300px]';

export default function NewQuestionForm({ onCreated }) {
  const [form, setForm] = React.useState({
    title: '',
    category: 'other',
    mood: 'other',
    mood_text: '',
    urgency: 'normal',
    description: '',
  });

  const dispatch = useDispatch();
  const [createQuestion, { isLoading }] = useCreateQuestionMutation();

  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      mood_text: form.mood_text || null,
      description: form.description || null,
    };
    try {
      const res = await createQuestion(payload).unwrap(); // { id }
      onCreated?.(res.id);
      setForm({ title: '', category: 'other', mood: 'other', mood_text: '', urgency: 'normal', description: '' });
    } catch (err) {
      console.error('createQuestion error', err);
      alert(err?.data?.error || 'Failed to create request');
    }
  }

  return (
    <div className={surface}>
      {/* Header (no hard borders, slightly larger type) */}
      <div className="px-5 py-4">
        <h2 className="text-lg font-semibold text-white">Create New Request</h2>
        <p className="text-sm text-gray-400 mt-1">Tell us what you need; we’ll tune playlists & tracks for you.</p>
      </div>

      {/* Divider (soft) */}
      <div className="h-px bg-white/10" />

      {/* Form */}
      <form onSubmit={submit} className="p-5 space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className={label} htmlFor="pq-title">Title</label>
          <input
            id="pq-title"
            className={`${field} w-full`}
            placeholder="e.g., Focus playlist for late-night study"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            required
          />
        </div>

        {/* Select row (wraps on small screens) */}
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1.5">
            <label className={label} htmlFor="pq-category">Category</label>
            <select
              id="pq-category"
              className={`${field} ${ctrlWide}`}
              value={form.category}
              onChange={(e)=>setForm(s=>({...s, category:e.target.value}))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={label} htmlFor="pq-mood">Mood</label>
            <select
              id="pq-mood"
              className={`${field} ${ctrlWide}`}
              value={form.mood}
              onChange={(e)=>setForm(s=>({...s, mood:e.target.value}))}
            >
              {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={label} htmlFor="pq-urgency">Urgency</label>
            <select
              id="pq-urgency"
              className={`${field} ${ctrlWide}`}
              value={form.urgency}
              onChange={(e)=>setForm(s=>({...s, urgency:e.target.value}))}
            >
              {URGENCY.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Mood free text */}
        <div className="space-y-1.5">
          <label className={label} htmlFor="pq-mood-text">Mood (free text)</label>
          <input
            id="pq-mood-text"
            className={`${field} w-full`}
            placeholder="Optional — e.g., overwhelmed, racing thoughts, need calm…"
            value={form.mood_text}
            onChange={(e) => setForm((s) => ({ ...s, mood_text: e.target.value }))}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className={label} htmlFor="pq-desc">Describe your need</label>
          <textarea
            id="pq-desc"
            className={`${field} w-full`}
            placeholder="Share context like session length, time of day, instruments you like, triggers to avoid…"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          />
          <div className="text-[11px] text-gray-400">
            Tip: specific details help us hit the vibe on the first try.
          </div>
        </div>

        <button className={btnPrimary} disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  );
}
