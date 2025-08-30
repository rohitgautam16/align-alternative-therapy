// src/pages/admin/BasicPersonalize.jsx
import React from 'react';
import {
  useAdminPbSearchUsersQuery,
  useAdminPbSearchSongsQuery,
  useAdminPbSearchPlaylistsQuery,
  useAdminPbListForUserQuery,
  useAdminPbCreateMutation,
  useAdminPbGetOneQuery,
  useAdminPbAddItemMutation,
  useAdminPbUpdateItemMutation,
  useAdminPbDeleteItemMutation,
  useAdminPbUpdateStatusMutation,
  useAdminPbSendNowMutation,
} from '../../utils/api';

// ========= utilities =========
const cx = (...s) => s.filter(Boolean).join(' ');

// Colors pulled from your snippet
const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 disabled:opacity-50';
const BTN_PRIMARY = 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-400/60';
const BTN_GHOST = 'bg-gray-700 hover:bg-gray-600 text-gray-100 focus-visible:ring-blue-400/60';
const BTN_DANGER = 'bg-red-600 hover:bg-red-500 text-white focus-visible:ring-red-400/60';
const BTN_LINK = 'text-gray-300 hover:text-white transition-colors';
const INPUT =
  'w-full px-3 py-2 rounded bg-[#0b1220] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600';
const TEXTAREA = INPUT;
const CARD =
  'rounded-xl bg-[#0b0f19] ring-1 ring-white/10 text-white shadow-[0_10px_50px_-20px_rgba(0,0,0,0.6)]';
const CARD_DIV = 'p-5';
const CARD_HEADER = 'flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10';

// Tiny toast
function useToast() {
  const [msg, setMsg] = React.useState('');
  return {
    Toast: () =>
      msg ? (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="rounded bg-gray-700/90 px-4 py-2 ring-1 ring-white/10 text-white">
            <div className="text-sm">{msg}</div>
          </div>
        </div>
      ) : null,
    show: (m) => {
      setMsg(m);
      setTimeout(() => setMsg(''), 1600);
    },
  };
}

// Field
const Field = ({ label, hint, error, children }) => (
  <label className="flex flex-col gap-1">
    {label && <span className="text-[11px] text-gray-400">{label}</span>}
    {children}
    {hint && !error && <span className="text-[11px] text-gray-500">{hint}</span>}
    {error && <span className="text-[11px] text-red-300">{error}</span>}
  </label>
);

// Guarded search
function useGuardedSearchList(hook, query) {
  const q = (query || '').trim();
  const skip = q.length < 2;
  const res = hook({ q }, { skip });
  const list = Array.isArray(res.data?.data) ? res.data.data : [];
  return { ...res, list, skip, q };
}

// Modern popover combobox for users/songs/playlists
function PopoverPicker({
  placeholder,
  hook,
  onPick,
  formatItem,
  noIcon = false,
  minChars = 2,
  className,
}) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const { list, isFetching, skip, q: normalizedQ } = useGuardedSearchList(hook, q);

  const showPanel = normalizedQ.length >= minChars && !skip && open;

  return (
    <div className={cx('relative', className)}>
      <div className="flex items-center gap-2">
        {!noIcon && (
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
        <input
          className={cx(INPUT, 'flex-1')}
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // small delay so click can register
            setTimeout(() => setOpen(false), 120);
          }}
        />
      </div>

      <div
        className={cx(
          'absolute z-30 mt-2 w-full max-h-64 overflow-auto rounded-lg bg-[#0b1220] ring-1 ring-white/10 shadow-xl',
          showPanel ? 'block' : 'hidden'
        )}
      >
        {isFetching ? (
          <div className="p-3 text-sm text-gray-300">Searching…</div>
        ) : list.length === 0 ? (
          <div className="p-3 text-sm text-gray-300">No results</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {list.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(it);
                    setQ('');
                    setOpen(false); // ← hide after select
                  }}
                  className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition text-left"
                >
                  {formatItem(it)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Item picker (track/playlist) using popover
function ItemPicker({ type, onPick }) {
  const hook = type === 'track' ? useAdminPbSearchSongsQuery : useAdminPbSearchPlaylistsQuery;

  return (
    <PopoverPicker
      placeholder={type === 'track' ? 'Search tracks…' : 'Search playlists…'}
      hook={hook}
      onPick={onPick}
      formatItem={(it) => {
        const title = type === 'track' ? it.title || it.name || `Track #${it.id}` : it.title || `Playlist #${it.id}`;
        const sub = type === 'track' ? it.artist || '' : it.slug ? `/${it.slug}` : '';
        return (
          <>
            <div className="w-10 h-10 rounded bg-white/10 overflow-hidden flex-shrink-0">
              {it.image ? <img className="w-full h-full object-cover" alt="" src={it.image} /> : null}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{title}</div>
              {sub ? <div className="text-xs text-gray-400 truncate">{sub}</div> : null}
            </div>
            <div className="ml-auto text-xs text-gray-400">#{it.id}</div>
          </>
        );
      }}
    />
  );
}

// Items list
function ItemsList({ items = [], onSave, onDelete }) {
  if (!items.length) {
    return <div className="text-sm text-gray-300">No items yet.</div>;
  }
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <ItemRow key={it.id} it={it} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
}

function ItemRow({ it, onSave, onDelete }) {
  const [note, setNote] = React.useState(it.prescription_note || '');
  const [order, setOrder] = React.useState(it.display_order ?? '');

  const meta = it.item_type === 'track' ? it.track : it.playlist;
  const title = it.item_type === 'track'
    ? meta?.title || meta?.name || `Track #${it.track_id}`
    : meta?.title || `Playlist #${it.playlist_id}`;
  const sub = it.item_type === 'track' ? meta?.artist : meta?.slug ? `/${meta.slug}` : null;

  return (
    <div className="p-3 rounded-xl bg-white/5 ring-1 ring-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-1 rounded-full text-[11px] bg-gray-700 text-gray-100">{it.item_type}</span>
          <div className="font-medium truncate">{title}</div>
          {sub ? <div className="text-xs text-gray-400 truncate">• {sub}</div> : null}
        </div>
        <div className="sm:ml-auto text-xs text-gray-400">
          {it.item_type === 'track' ? `track_id:${it.track_id}` : `playlist_id:${it.playlist_id}`}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
        <input
          className={cx(INPUT, 'sm:col-span-8')}
          placeholder="Prescription note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <input
          className={cx(INPUT, 'sm:col-span-2 max-w-full sm:max-w-28')}
          placeholder="Order"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />
        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
          <button
            className={cx(BTN_BASE, BTN_GHOST)}
            onClick={() =>
              onSave(it.id, {
                prescription_note: note || null,
                display_order: order === '' ? null : Number(order),
              })
            }
          >
            Save
          </button>
          <button className={cx(BTN_BASE, BTN_DANGER)} onClick={() => onDelete(it.id)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BasicPersonalize() {
  const { Toast, show } = useToast();

  // user search
  const [userQuery, setUserQuery] = React.useState('');
  const { list: users, isFetching: usersLoading, skip: skipUsers, q: normalizedUserQ } =
    useGuardedSearchList(useAdminPbSearchUsersQuery, userQuery);
  const [user, setUser] = React.useState(null);

  // recs
  const { data: listRes, refetch: refetchList } = useAdminPbListForUserQuery(
    user ? { userId: user.id } : { skip: true },
    { skip: !user }
  );
  const userRecs = Array.isArray(listRes) ? listRes : [];

  // selection
  const [recId, setRecId] = React.useState(null);
  const { data: recData, isFetching: recLoading, refetch: refetchRec } = useAdminPbGetOneQuery(
    recId ?? '__skip__',
    { skip: !recId }
  );

  // mutations
  const [createRec, { isLoading: creating }] = useAdminPbCreateMutation();
  const [addItem, { isLoading: adding }] = useAdminPbAddItemMutation();
  const [updateItem] = useAdminPbUpdateItemMutation();
  const [deleteItem] = useAdminPbDeleteItemMutation();
  const [updateStatus, { isLoading: statusing }] = useAdminPbUpdateStatusMutation();
  const [sendNow, { isLoading: sending }] = useAdminPbSendNowMutation();

  // create draft inputs
  const [newTitle, setNewTitle] = React.useState('');
  const [newSummary, setNewSummary] = React.useState('');
  const [createErrors, setCreateErrors] = React.useState({ title: '', summary: '' });

  function canCreate() {
    return newTitle.trim() && newSummary.trim() && !!user;
  }
  function validateCreate() {
    const e = { title: '', summary: '' };
    if (!newTitle.trim()) e.title = 'Title is required';
    if (!newSummary.trim()) e.summary = 'Summary is required';
    setCreateErrors(e);
    return !e.title && !e.summary;
  }

  async function onCreateDraft() {
    if (!user) return;
    if (!validateCreate()) return;
    try {
      const res = await createRec({
        userId: user.id,
        title: newTitle.trim(),
        summary_note: newSummary.trim(),
      }).unwrap();
      setRecId(res.id);
      setNewTitle('');
      setNewSummary('');
      setCreateErrors({ title: '', summary: '' });
      await refetchList();
      show('Draft created');
    } catch (e) {
      alert(e?.data?.error || 'Failed to create');
    }
  }

  // add item
  const [newType, setNewType] = React.useState('track');
  const [pendingPick, setPendingPick] = React.useState(null);

  async function onConfirmAdd() {
    if (!recId || !newType || !pendingPick) return;
    try {
      const payload = {
        recId,
        item_type: newType,
        track_id: newType === 'track' ? pendingPick.id : undefined,
        playlist_id: newType === 'playlist' ? pendingPick.id : undefined,
      };
      await addItem(payload).unwrap();
      setPendingPick(null);
      await refetchRec();
      show('Item added');
    } catch (e) {
      alert(e?.data?.error || 'Add failed');
    }
  }

  async function onSaveItem(itemId, patch) {
    try {
      await updateItem({ itemId, patch }).unwrap();
      await refetchRec();
      show('Saved');
    } catch (e) {
      alert(e?.data?.error || 'Save failed');
    }
  }

  async function onDeleteItem(itemId) {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteItem(itemId).unwrap();
      await refetchRec();
      show('Deleted');
    } catch (e) {
      alert(e?.data?.error || 'Delete failed');
    }
  }

  async function onSend() {
    if (!recId) return;
    try {
      await sendNow(recId).unwrap();
      await refetchRec();
      await refetchList();
      show('Sent');
    } catch (e) {
      alert(e?.data?.error || 'Send failed');
    }
  }

  async function onSetStatus(status) {
    if (!recId) return;
    try {
      await updateStatus({ recId, status }).unwrap();
      await refetchRec();
      await refetchList();
      show('Status updated');
    } catch (e) {
      alert(e?.data?.error || 'Failed to update status');
    }
  }

  React.useEffect(() => {
    setRecId(null);
  }, [user?.id]);

  const detailTitle =
    recData?.recommendation?.title?.trim()
      ? recData.recommendation.title.trim()
      : recLoading
      ? 'Loading…'
      : '(Untitled)';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header bar (colors from your snippet) — optional */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button className={BTN_LINK} onClick={() => window.history.back()}>
          {/* Back icon substitute */}
          <span className="inline-flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-300">
              <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Back to Users</span>
            <span className="sm:hidden">Back</span>
          </span>
        </button>

        {/* <div className="flex items-center gap-2 w-full sm:w-auto">
          
          <button className={cx(BTN_BASE, BTN_GHOST)} onClick={() => {}}>
            <span>Edit</span>
          </button>
          <button className={cx(BTN_BASE, BTN_PRIMARY)} onClick={() => {}}>
            <span>Save</span>
          </button>
          <button className={cx(BTN_BASE, BTN_DANGER)} onClick={() => {}}>
            <span>Delete</span>
          </button>
        </div> */}
      </div>

      {/* 1) User search */}
      <section className={CARD}>
        <header className={CARD_HEADER}>
          <div>
            <h2 className="font-semibold text-[15px] tracking-tight">Find a user</h2>
            <p className="text-xs text-gray-400">Search by name or email to start a personalized recommendation.</p>
          </div>
          <div className="text-xs text-gray-400">{usersLoading ? 'Searching…' : 'Type ≥ 2 chars'}</div>
        </header>
        <div className={CARD_DIV}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <PopoverPicker
                placeholder="e.g. rohit@ or Rohit"
                hook={useAdminPbSearchUsersQuery}
                onPick={(u) => setUser(u)}
                noIcon
                formatItem={(u) => (
                  <>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.full_name || '(no name)'}</div>
                      <div className="text-xs text-gray-400 truncate">{u.email}</div>
                    </div>
                    <div className="ml-auto text-xs text-gray-400">#{u.id}</div>
                  </>
                )}
              />
              {normalizedUserQ.length < 2 && (
                <div className="text-xs text-gray-400 mt-2">Start typing to search…</div>
              )}
            </div>

            <div className="md:col-span-6">
              <div className="h-full rounded-lg border border-white/10 p-4 bg-white/[0.03]">
                {!user ? (
                  <div className="text-sm text-gray-300">No user selected.</div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-[11px] bg-gray-700 text-gray-100">Selected</span>
                    <div className="font-medium truncate">{user.full_name || '(no name)'}</div>
                    <div className="text-xs text-gray-400 truncate">{user.email}</div>
                    <button className={cx(BTN_BASE, BTN_GHOST, 'ml-auto')} onClick={() => setUser(null)}>
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2) Draft creator & list */}
      <section className={CARD}>
        <header className={CARD_HEADER}>
          <h2 className="font-semibold text-[15px] tracking-tight">Recommendations for this user</h2>
          <button
            className={cx(BTN_BASE, BTN_PRIMARY)}
            onClick={onCreateDraft}
            disabled={!canCreate() || creating || !user}
            title="Provide Title & Summary below to enable"
          >
            {creating ? 'Creating…' : 'Create Draft'}
          </button>
        </header>
        <div className={CARD_DIV}>
          {!user ? (
            <div className="rounded-lg bg-white/5 p-6 text-center text-sm text-gray-300">
              Pick a user to view or create recommendations.
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-white/[0.04] p-4 mb-4 ring-1 ring-white/10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <Field label="Title (required)" error={createErrors.title} hint="Shown to the user">
                      <input
                        className={INPUT}
                        placeholder="e.g., Sleep Starter Pack"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-8">
                    <Field label="Summary (required)" error={createErrors.summary}>
                      <input
                        className={INPUT}
                        placeholder="Short intro visible to the user"
                        value={newSummary}
                        onChange={(e) => setNewSummary(e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {userRecs.map((r) => {
                  const when = r.sent_at || r.updated_at || r.created_at;
                  const cardTitle = r.title?.trim() ? r.title : '(Untitled)';
                  const hasSummary = !!(r.summary_note && r.summary_note.trim());
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRecId(r.id)}
                      className={cx(
                        'p-3 rounded-xl bg-white/5 ring-1 ring-white/10 text-left hover:bg-white/10 transition',
                        recId === r.id && 'outline-2 outline-blue-500/60'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium truncate">{cardTitle}</div>
                        <span
                          className={cx(
                            'inline-flex items-center px-2 py-1 rounded-full text-[11px]',
                            r.status === 'draft' && 'bg-gray-700 text-gray-100',
                            r.status === 'sent' && 'bg-blue-600/30',
                            r.status === 'updated' && 'bg-purple-600/30',
                            r.status === 'withdrawn' && 'bg-red-600/30'
                          )}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{when ? new Date(when).toLocaleString() : ''}</div>
                      {hasSummary ? (
                        <div className="text-sm text-gray-300 mt-2 line-clamp-3">{r.summary_note}</div>
                      ) : (
                        <div className="text-xs text-gray-400 mt-2 italic">No summary</div>
                      )}
                    </button>
                  );
                })}
                {userRecs.length === 0 && (
                  <div className="rounded-lg bg-white/5 p-6 text-center text-sm text-gray-300">
                    No drafts yet. Enter Title & Summary above and click “Create Draft”.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* 3) Recommendation detail */}
      {recId && (
        <section className={CARD}>
          <header className={CARD_HEADER}>
            <h2 className="font-semibold text-[15px] tracking-tight truncate">{detailTitle}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <select
                className="px-3 py-2 rounded bg-[#0b1220] text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-auto"
                value={recData?.recommendation?.status || 'draft'}
                onChange={(e) => onSetStatus(e.target.value)}
                disabled={statusing}
              >
                {['draft', 'sent', 'updated', 'withdrawn'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button className={cx(BTN_BASE, BTN_PRIMARY, 'w-full sm:w-auto')} onClick={onSend} disabled={sending}>
                {sending ? 'Sending…' : 'Send to user'}
              </button>
            </div>
          </header>

          <div className={CARD_DIV}>
            {recLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
                <div className="h-24 w-full bg-white/10 rounded animate-pulse" />
              </div>
            ) : !recData ? (
              <div className="rounded-lg bg-white/5 p-6 text-center text-sm text-gray-300">Not found.</div>
            ) : (
              <>
                {recData.recommendation?.summary_note && (
                  <div className="mb-4 p-3 rounded-lg bg-white/5 text-sm text-gray-300 whitespace-pre-wrap">
                    {recData.recommendation.summary_note}
                  </div>
                )}

                {/* Add item */}
                <div className="rounded-lg bg-white/[0.04] p-4 mb-4 ring-1 ring-white/10">
                  <div className="font-medium mb-2">Add Item</div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-3">
                      <Field label="Type">
                        <select
                          className="px-3 py-2 rounded bg-[#0b1220] text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full"
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                        >
                          <option value="track">track</option>
                          <option value="playlist">playlist</option>
                        </select>
                      </Field>
                    </div>
                    <div className="sm:col-span-6">
                      <Field label={newType === 'track' ? 'Pick a track' : 'Pick a playlist'}>
                        <ItemPicker type={newType} onPick={(it) => setPendingPick(it)} />
                      </Field>
                    </div>
                    <div className="sm:col-span-3 flex items-end">
                      <button
                        className={cx(BTN_BASE, BTN_PRIMARY, 'w-full')}
                        onClick={onConfirmAdd}
                        disabled={!pendingPick || adding}
                      >
                        {adding ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  </div>
                  {pendingPick && (
                    <div className="mt-2 text-xs text-gray-400">
                      Selected: {(pendingPick.title || pendingPick.name)} #{pendingPick.id}
                    </div>
                  )}
                </div>

                <ItemsList
                  items={recData.items || []}
                  onSave={onSaveItem}
                  onDelete={onDeleteItem}
                />
              </>
            )}
          </div>
        </section>
      )}

      <Toast />
    </div>
  );
}
