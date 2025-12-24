import React from 'react';
import {
  useAdminListTemplatesQuery,
  useAdminCreateTemplateMutation,
  useAdminUpdateTemplateMutation,
  useAdminDeleteTemplateMutation
} from '../../utils/api';

const CATS = ['stress_relief','focus_study','sleep_aid','emotional_healing','other'];
const MOODS = ['calm','anxious','sad','angry','tired','stressed','motivated','neutral','other'];

// Shared styles
const surface    = 'rounded-xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1220]/90 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]';
const inputCx    = 'px-3 py-2 rounded-lg bg-[#0b1220] text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600';
const btnPrimary = 'px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50 shadow hover:shadow-lg transition';
const btnGhost   = 'px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition';

export default function TemplatesManager() {
  const [params, setParams] = React.useState({});
  const { data = [], isLoading, isError, refetch } = useAdminListTemplatesQuery(params, { refetchOnFocus: false });
  const [createT, { isLoading: creating }] = useAdminCreateTemplateMutation();

  const [form, setForm] = React.useState({ title: '', body: '', category: '', mood: '' });

  async function createTemplate() {
    try {
      await createT({
        title: form.title,
        body: form.body,
        category: form.category || null,
        mood: form.mood || null,
      }).unwrap();
      setForm({ title: '', body: '', category: '', mood: '' });
      refetch();
    } catch (e) { alert(e?.data?.error || 'Create failed'); }
  }

  const createDisabled = creating || !form.title.trim() || !form.body.trim();

  return (
    <div className="space-y-4 text-white">
      {/* Create template */}
      <div className={`${surface} p-3 sm:p-4`}>
        <div className="font-medium mb-3">Create template</div>

        {/* Wide, non-shrinking controls */}
        <div className="flex flex-wrap gap-2">
          <input
            className={[inputCx, 'basis-[300px] sm:basis-[360px] grow shrink-0'].join(' ')}
            placeholder="Title"
            value={form.title}
            onChange={e=>setForm(s=>({...s, title: e.target.value}))}
          />

          <select
            className={[inputCx, 'basis-[220px] grow shrink-0'].join(' ')}
            value={form.category}
            onChange={e=>setForm(s=>({...s, category: e.target.value}))}
          >
            <option value="">(category)</option>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className={[inputCx, 'basis-[220px] grow shrink-0'].join(' ')}
            value={form.mood}
            onChange={e=>setForm(s=>({...s, mood: e.target.value}))}
          >
            <option value="">(mood)</option>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <textarea
            className={[inputCx, 'basis-[100%]'].join(' ')}
            rows={4}
            placeholder="Body"
            value={form.body}
            onChange={e=>setForm(s=>({...s, body: e.target.value}))}
          />
        </div>

        <button
          className={`${btnPrimary} mt-3`}
          onClick={createTemplate}
          disabled={createDisabled}
          title={createDisabled ? 'Title and body are required' : ''}
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </div>

      {/* List templates */}
      <div className={`${surface} p-3 sm:p-4`}>
        <div className="font-medium mb-3">Templates</div>
        {isLoading ? (
          <div className="text-gray-300">Loading…</div>
        ) : isError ? (
          <div className="text-gray-300">
            Error. <button onClick={refetch} className="underline text-blue-300">Retry</button>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map(t => <TemplateRow key={t.id} t={t} onChanged={refetch} />)}
            {(!data || data.length===0) && <div className="text-gray-400">No templates</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateRow({ t, onChanged }) {
  const [patch, setPatch] = React.useState({
    title: t.title,
    body: t.body,
    category: t.category || '',
    mood: t.mood || ''
  });

  const [updateT, { isLoading: saving }] = useAdminUpdateTemplateMutation();
  const [deleteT, { isLoading: removing }] = useAdminDeleteTemplateMutation();

  async function save() {
    try {
      await updateT({
        templateId: t.id,
        patch: {
          title: patch.title,
          body: patch.body,
          category: patch.category || null,
          mood: patch.mood || null,
        }
      }).unwrap();
      onChanged?.();
    } catch (e) { alert(e?.data?.error || 'Save failed'); }
  }

  async function remove() {
    if (!confirm('Delete template?')) return;
    try {
      await deleteT({ templateId: t.id }).unwrap();
      onChanged?.();
    } catch (e) { alert(e?.data?.error || 'Delete failed'); }
  }

  const saveDisabled = saving || !patch.title.trim() || !patch.body.trim();

  return (
    <div className={`${surface} p-3 sm:p-4 space-y-2`}>
      <input
        className={[inputCx, 'w-full'].join(' ')}
        value={patch.title}
        onChange={e=>setPatch(s=>({...s, title: e.target.value}))}
        placeholder="Title"
      />

      <div className="flex flex-wrap gap-2">
        <select
          className={[inputCx, 'basis-[220px] grow shrink-0'].join(' ')}
          value={patch.category}
          onChange={e=>setPatch(s=>({...s, category: e.target.value}))}
        >
          <option value="">(category)</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className={[inputCx, 'basis-[220px] grow shrink-0'].join(' ')}
          value={patch.mood}
          onChange={e=>setPatch(s=>({...s, mood: e.target.value}))}
        >
          <option value="">(mood)</option>
          {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <textarea
        className={[inputCx, 'w-full'].join(' ')}
        rows={4}
        value={patch.body}
        onChange={e=>setPatch(s=>({...s, body: e.target.value}))}
        placeholder="Body"
      />

      <div className="flex gap-2">
        <button className={btnGhost} disabled={saveDisabled} onClick={save}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          className="px-3 py-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-white transition"
          disabled={removing}
          onClick={remove}
        >
          {removing ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
