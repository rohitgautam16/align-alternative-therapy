// src/components/admin/RecommendationDetail.jsx
import React from 'react';
import {
  useAdminGetRecommendationQuery,
  useAdminAddRecommendationItemMutation,
  useAdminUpdateRecommendationItemMutation,
  useAdminDeleteRecommendationItemMutation,
  useAdminSendRecommendationMutation,
  useAdminUpdateRecommendationStatusMutation,
  useAdminCreateRecommendationMutation,
  useGetAdminSongsQuery,
  useGetAdminSongQuery,
  useListPlaylistsQuery,
  useGetAdminPlaylistQuery,
} from '../../utils/api';

/* --- Glass tokens (match user theme) --- */
const surface = `
  rounded-xl
  bg-[radial-gradient(1000px_500px_at_-20%_-20%,rgba(56,189,248,0.08),transparent),
      radial-gradient(1000px_500px_at_120%_120%,rgba(167,139,250,0.08),transparent)]
  from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b
  shadow-[0_10px_30px_-18px_rgba(0,0,0,0.75)] text-white
`;
const inputCx = 'px-3 py-2.5 rounded-lg bg-[#0b1220] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-600';
const btnPrimary = 'px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white disabled:opacity-50 shadow hover:shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60';
const btnGhost = 'px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50';

/* ============================== Main ============================== */
export default function RecommendationDetail({ questionId, recId, onBackToInbox, onRecOpened }) {
  const creatingNew = !recId && !!questionId;

  return (
    <div className={`${surface} p-4 space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Recommendation</h2>
        <button className={btnGhost} onClick={onBackToInbox}>Back to Inbox</button>
      </div>

      {creatingNew ? (
        <CreateFirstRecommendation questionId={questionId} onCreated={onRecOpened} />
      ) : (
        <ExistingRecommendation recId={recId} />
      )}
    </div>
  );
}

/* ============================== Create First ============================== */
function CreateFirstRecommendation({ questionId, onCreated }) {
  const [summary, setSummary] = React.useState('');
  const [createRec, { isLoading }] = useAdminCreateRecommendationMutation();

  async function createIt() {
    try {
      const res = await createRec({ questionId, summary_note: summary, items: [] }).unwrap();
      onCreated?.(res.id);
    } catch (e) {
      alert(e?.data?.error || 'Failed to create');
    }
  }

  return (
    <div className={`${surface} p-4 space-y-3`}>
      <div className="text-sm text-gray-300">No recommendation selected. Create a draft for this question.</div>
      <textarea
        className={`${inputCx} w-full`}
        rows={3}
        placeholder="Summary note"
        value={summary}
        onChange={(e)=>setSummary(e.target.value)}
      />
      <button className={btnPrimary} disabled={isLoading} onClick={createIt}>
        {isLoading ? 'Creating…' : 'Create draft'}
      </button>
    </div>
  );
}

/* ============================== Existing Rec ============================== */
function ExistingRecommendation({ recId }) {
  const { data, isLoading, isError, refetch, error } = useAdminGetRecommendationQuery(recId, {
    skip: !recId, refetchOnFocus: false, refetchOnReconnect: false
  });
  const [addItem,   { isLoading: adding }]    = useAdminAddRecommendationItemMutation();
  const [updateItem]                          = useAdminUpdateRecommendationItemMutation();
  const [deleteItem]                          = useAdminDeleteRecommendationItemMutation();
  const [sendRec,  { isLoading: sending }]    = useAdminSendRecommendationMutation();
  const [setStatus,{ isLoading: statusing }]  = useAdminUpdateRecommendationStatusMutation();

  const [form, setForm] = React.useState({
    item_type: 'track', track_id: '', playlist_id: '', prescription_note: '', display_order: ''
  });

  if (isLoading) return <div className={`${surface} p-4 text-gray-300`}>Loading…</div>;
  if (isError || !data) {
    const msg = (error && (error.data?.error || error.error || error.status)) || 'Unknown error';
    return (
      <div className={`${surface} p-4 text-gray-300`}>
        Error: {String(msg)}. <button onClick={refetch} className="underline text-cyan-300">Retry</button>
      </div>
    );
  }

  const { recommendation, items } = data;

  async function add() {
    const payload = {
      recId,
      item_type: form.item_type,
      track_id: form.item_type === 'track' ? Number(form.track_id) : undefined,
      playlist_id: form.item_type === 'playlist' ? Number(form.playlist_id) : undefined,
      prescription_note: form.prescription_note || undefined,
      display_order: form.display_order ? Number(form.display_order) : undefined,
    };
    try {
      await addItem(payload).unwrap();
      setForm({ item_type: 'track', track_id: '', playlist_id: '', prescription_note: '', display_order: '' });
    } catch (e) { alert(e?.data?.error || 'Add failed'); }
  }

  async function sendNow() { try { await sendRec({ recId }).unwrap(); } catch (e) { alert(e?.data?.error || 'Send failed'); } }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${surface} p-4 flex flex-wrap items-center gap-3`}>
        <div className="font-medium text-white">
          #{recommendation.id} • <StatusChip s={recommendation.status} />
        </div>
        {recommendation.sent_at && (
          <div className="text-xs text-gray-400">Sent: {new Date(recommendation.sent_at).toLocaleString()}</div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <select
            className={`${inputCx} min-w-[220px] w-auto`}
            value={recommendation.status}
            onChange={(e)=>setStatus({ recId, status: e.target.value })}
            disabled={statusing}
          >
            {['draft','sent','updated','withdrawn'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className={btnPrimary} onClick={sendNow} disabled={sending}>
            {sending ? 'Sending…' : 'Send to user'}
          </button>
        </div>
      </div>

      {/* Add item */}
      <div className={`${surface} p-4 space-y-3`}>
        <div className="font-medium text-white">Add item</div>

        <div className="flex flex-wrap gap-3">
          {/* type */}
          <select
            className={[inputCx, 'basis-[180px] sm:basis-[200px] grow shrink-0'].join(' ')}
            value={form.item_type}
            onChange={(e)=>setForm(s=>({
              ...s,
              item_type: e.target.value,
              track_id: e.target.value === 'track' ? s.track_id : '',
              playlist_id: e.target.value === 'playlist' ? s.playlist_id : '',
            }))}
          >
            <option value="track">track</option>
            <option value="playlist">playlist</option>
          </select>

          {form.item_type === 'track' ? (
            <AdminSongPicker
              value={form.track_id}
              onChange={(val) => setForm(s => ({ ...s, track_id: val }))}
            />
          ) : (
            <AdminPlaylistPicker
              value={form.playlist_id}
              onChange={(val) => setForm(s => ({ ...s, playlist_id: val }))}
            />
          )}

          {/* order */}
          <input
            className={[inputCx, 'basis-[140px] sm:basis-[160px] grow shrink-0'].join(' ')}
            placeholder="display_order"
            value={form.display_order}
            onChange={(e)=>setForm(s=>({...s, display_order: e.target.value }))}
          />

          {/* note */}
          <input
            className={[inputCx, 'basis-full'].join(' ')}
            placeholder="prescription note"
            value={form.prescription_note}
            onChange={(e)=>setForm(s=>({...s, prescription_note: e.target.value }))}
          />
        </div>

        <button className={btnGhost} onClick={add} disabled={adding}>
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="font-medium text-white">Items</div>
        {items?.map(it => (
          <ItemRow key={it.id} it={it} />
        ))}
        {(!items || items.length===0) && <div className="text-gray-400">No items.</div>}
      </div>
    </div>
  );
}

/* ============================== Status Chip ============================== */
function StatusChip({ s }) {
  const map = {
    draft: 'bg-slate-500/20 text-slate-200',
    sent: 'bg-cyan-500/20 text-cyan-200',
    updated: 'bg-violet-500/20 text-violet-200',
    withdrawn: 'bg-rose-500/20 text-rose-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] ${map[s] || 'bg-white/10 text-gray-200'}`}>
      {s}
    </span>
  );
}

/* ============================== Item Row (resolve names) ============================== */
function ItemRow({ it }) {
  const [note, setNote] = React.useState(it.prescription_note || '');
  const [order, setOrder] = React.useState(it.display_order || 1);

  const { data: song } = useGetAdminSongQuery(it.item_type === 'track' ? it.track_id : undefined, {
    skip: it.item_type !== 'track',
  });
  const { data: playlist } = useGetAdminPlaylistQuery(it.item_type === 'playlist' ? it.playlist_id : undefined, {
    skip: it.item_type !== 'playlist',
  });

  const label = it.item_type === 'track'
    ? (song?.name || song?.title || `Track #${it.track_id}`)
    : (playlist?.name || playlist?.title || `Playlist #${it.playlist_id}`);

  const image = it.item_type === 'track' ? (song?.image) : (playlist?.image);

  const [updateItem] = useAdminUpdateRecommendationItemMutation();
  const [deleteItem] = useAdminDeleteRecommendationItemMutation();

  return (
    <div className={`${surface} p-4 flex flex-col md:flex-row md:items-center gap-3`}>
      <div className="text-sm min-w-[280px]">
        <span className="inline-flex items-center gap-3 px-2.5 py-1.5 rounded-full bg-white/10">
          <Avatar src={image} alt="" />
          <span className="text-[11px] uppercase text-gray-300">{it.item_type}</span>
          <span className="text-gray-100">{label}</span>
        </span>
      </div>

      <input
        className={[inputCx, 'flex-1'].join(' ')}
        value={note}
        onChange={(e)=>setNote(e.target.value)}
        placeholder="Prescription note"
      />
      <input
        className={[inputCx, 'w-28'].join(' ')}
        value={order}
        onChange={(e)=>setOrder(e.target.value)}
        placeholder="Order"
      />

      <div className="flex gap-2">
        <button
          className={btnGhost}
          onClick={()=>updateItem({ itemId: it.id, patch: { prescription_note: note, display_order: Number(order) } })}
        >
          Save
        </button>
        <button
          className="px-4 py-2.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white transition"
          onClick={()=>deleteItem({ itemId: it.id })}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/* ============================== Searchable Selects ============================== */

function SearchSelect({
  label,
  placeholder = 'Search…',
  value,
  onChange,
  items,
  getId = (x) => x?.id,
  getLabel = (x) => x?.name || x?.title,
  getSub = (x) => x?.artistName || '',
  getImage = (x) => x?.image || x?.cover || '',
  className = '',
  emptyText = 'No results',
  minWidth = 260,
  onQueryChange,            // client-side filter setter
  errorInfo,                // backend error to show
  loading = false,          // show loading in trigger
  onLoadMore,               // pagination loader
  hasMore = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [highlight, setHighlight] = React.useState(0);
  const rootRef = React.useRef(null);

  const selected = React.useMemo(() => items?.find((it) => String(getId(it)) === String(value)), [items, value, getId]);

  const filtered = React.useMemo(() => {
    const s = (q || '').toLowerCase().trim();
    if (!s) return items || [];
    return (items || []).filter((it) => {
      const l = (getLabel(it) || '').toLowerCase();
      const sub = (getSub(it) || '').toLowerCase();
      return l.includes(s) || sub.includes(s);
    });
  }, [items, q, getLabel, getSub]);

  // Sync search upwards if parent wants it (client-only filter in this case)
  React.useEffect(() => { onQueryChange?.(q); }, [q, onQueryChange]);

  // click outside to close
  React.useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function choose(it) {
    onChange?.(String(getId(it)));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`} style={{ minWidth }}>
      {label && <div className="text-xs font-medium text-gray-300 mb-1">{label}</div>}

      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={`w-full ${inputCx} text-left flex items-center gap-3`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <Avatar src={getImage(selected)} alt="" />
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{getLabel(selected)}</div>
              {getSub(selected) ? <div className="text-[11px] text-gray-400 truncate">{getSub(selected)}</div> : null}
            </div>
          </>
        ) : (
          <span className="text-gray-400">{loading ? 'Loading…' : placeholder}</span>
        )}
        <svg className="ml-auto h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {errorInfo && <div className="mt-1 text-[11px] text-rose-300">{errorInfo}</div>}

      {/* popover */}
      {open && (
        <div role="listbox" className={`absolute z-20 mt-2 w-full ${surface} p-2 max-h-96 overflow-auto`}>
          {/* search input */}
          <div className="p-1">
            <input
              autoFocus
              className={`${inputCx} w-full`}
              placeholder={placeholder}
              value={q}
              onChange={(e) => { setQ(e.target.value); setHighlight(0); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0))); }
                if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
                if (e.key === 'Enter')     { e.preventDefault(); const it = filtered[highlight]; if (it) choose(it); }
                if (e.key === 'Escape')    { e.preventDefault(); setOpen(false); }
              }}
            />
          </div>

          {/* options */}
          <ul className="mt-1 space-y-1">
            {filtered.length === 0 && <li className="px-2 py-2 text-sm text-gray-400">{emptyText}</li>}
            {filtered.map((it, idx) => {
              const active = idx === highlight;
              const id = String(getId(it));
              const isSelected = String(value) === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => choose(it)}
                    className={[
                      'w-full px-2 py-2 rounded-lg flex items-center gap-3 text-left',
                      active ? 'bg-white/10' : 'hover:bg-white/10',
                    ].join(' ')}
                    aria-selected={isSelected}
                  >
                    <Avatar src={getImage(it)} alt="" />
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{getLabel(it)}</div>
                      {getSub(it) ? <div className="text-[11px] text-gray-400 truncate">{getSub(it)}</div> : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Load more */}
          {hasMore && (
            <div className="p-2">
              <button type="button" className={`${btnGhost} w-full justify-center`} onClick={onLoadMore}>
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Avatar({ src, alt }) {
  const url = src || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop';
  return <img src={url} alt={alt} className="h-9 w-9 rounded-md object-cover flex-shrink-0" loading="lazy" />;
}

/* ============================== Admin adapters (no server search; client filter + pagination) ============================== */

function AdminSongPicker({ value, onChange }) {
  // Server: page / pageSize only → we accumulate and client-filter
  const [page, setPage] = React.useState(1);
  const pageSize = 50;
  const { data, isLoading, isError, error } = useGetAdminSongsQuery({ page, pageSize }, {
    refetchOnFocus: false, refetchOnReconnect: false
  });

  const pageItems = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  const hasMore = (pageItems?.length ?? 0) >= pageSize;

  // accumulate pages
  const [accum, setAccum] = React.useState([]);
  React.useEffect(() => { if (page === 1) setAccum(pageItems); else setAccum((p) => [...p, ...pageItems]); }, [pageItems, page]);

  const errorInfo = isError ? `Songs error: ${String(error?.data?.error || error?.error || error?.status || 'Unknown')}` : undefined;

  // local filter via SearchSelect's onQueryChange (no-op for server)
  const [ignored, setIgnored] = React.useState(''); // SearchSelect requires handler; not used server-side

  return (
    <SearchSelect
      label="Track"
      placeholder={isLoading && page === 1 ? 'Loading songs…' : 'Search in loaded tracks'}
      value={value}
      onChange={onChange}
      items={accum}
      getId={(s) => s.id}
      getLabel={(s) => s.name || s.title}
      getSub={(s) => s.artistName}
      getImage={(s) => s.image}
      className="basis-[260px] sm:basis-[300px] grow shrink-0"
      emptyText={'No tracks'}
      onQueryChange={setIgnored}
      errorInfo={errorInfo}
      loading={isLoading && page === 1}
      onLoadMore={() => setPage((p) => p + 1)}
      hasMore={hasMore}
    />
  );
}

function AdminPlaylistPicker({ value, onChange }) {
  // Server: page / pageSize only → we accumulate and client-filter
  const [page, setPage] = React.useState(1);
  const pageSize = 20; // matches your transform
  const { data, isLoading, isError, error } = useListPlaylistsQuery({ page, pageSize }, {
    refetchOnFocus: false, refetchOnReconnect: false
  });

  // Your transform returns { data, total, page, pageSize }
  const pageItems = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  const hasMore = (pageItems?.length ?? 0) >= pageSize;

  // accumulate pages
  const [accum, setAccum] = React.useState([]);
  React.useEffect(() => { if (page === 1) setAccum(pageItems); else setAccum((p) => [...p, ...pageItems]); }, [pageItems, page]);

  const errorInfo = isError ? `Playlists error: ${String(error?.data?.error || error?.error || error?.status || 'Unknown')}` : undefined;

  const [ignored, setIgnored] = React.useState('');

  return (
    <SearchSelect
      label="Playlist"
      placeholder={isLoading && page === 1 ? 'Loading playlists…' : 'Search in loaded playlists'}
      value={value}
      onChange={onChange}
      items={accum}
      getId={(p) => p.id}
      getLabel={(p) => p.name || p.title}
      getSub={() => ''}
      getImage={(p) => p.image}
      className="basis-[260px] sm:basis-[300px] grow shrink-0"
      emptyText={'No playlists'}
      onQueryChange={setIgnored}
      errorInfo={errorInfo}
      loading={isLoading && page === 1}
      onLoadMore={() => setPage((p) => p + 1)}
      hasMore={hasMore}
    />
  );
}
