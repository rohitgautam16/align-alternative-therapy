import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminPbListSubmissionsQuery, useAdminPbUpdateSubmissionStatusMutation } from '../../utils/api';
import { Search, ArrowLeft } from 'lucide-react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const INPUT =
  'w-full px-3 py-2 rounded bg-[#0b1220] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600';
const CARD =
  'rounded-xl bg-[#0b0f19] ring-1 ring-white/10 text-white shadow-[0_10px_50px_-20px_rgba(0,0,0,0.6)]';
const CARD_DIV = 'p-5';
const BTN_BASE =
  'inline-flex items-center gap-2 rounded px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 disabled:opacity-50';
const BTN_PRIMARY = 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-400/60';
const BTN_GHOST = 'bg-gray-700 hover:bg-gray-600 text-gray-100 focus-visible:ring-blue-400/60';

export default function BasicPersonalizeSubmissions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editingId, setEditingId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const tableWrapperRef = useRef(null);

  const onTableMouseDown = (e) => {
    const container = tableWrapperRef.current;
    if (!container) return;
    setIsDragging(true);
    setDragStartX(e.pageX - container.offsetLeft);
    setScrollStart(container.scrollLeft);
  };

  const onTableMouseMove = (e) => {
    const container = tableWrapperRef.current;
    if (!isDragging || !container) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const distance = x - dragStartX;
    container.scrollLeft = scrollStart - distance;
  };

  const onTableMouseUp = () => setIsDragging(false);

  const onTableTouchStart = (e) => {
    const container = tableWrapperRef.current;
    if (!container || !e.touches?.[0]) return;
    setIsDragging(true);
    setDragStartX(e.touches[0].pageX - container.offsetLeft);
    setScrollStart(container.scrollLeft);
  };

  const onTableTouchMove = (e) => {
    const container = tableWrapperRef.current;
    if (!isDragging || !container || !e.touches?.[0]) return;
    const x = e.touches[0].pageX - container.offsetLeft;
    const distance = x - dragStartX;
    container.scrollLeft = scrollStart - distance;
  };

  const onTableTouchEnd = () => setIsDragging(false);

  const [updateStatus, { isLoading: isUpdating }] = useAdminPbUpdateSubmissionStatusMutation();

  const { data, isLoading, error, refetch } = useAdminPbListSubmissionsQuery({
    page,
    pageSize,
    status: statusFilter || undefined,
    q: search || undefined,
  });

  const submissions = Array.isArray(data?.data) ? data.data : [];
  const total = Number(data?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.trim().toLowerCase();
    return submissions.filter((item) => {
      return (
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.email || '').toLowerCase().includes(q) ||
        String(item.mobile || '').toLowerCase().includes(q) ||
        String(item.status || '').toLowerCase().includes(q)
      );
    });
  }, [search, submissions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <button
        onClick={() => navigate('/admin/personalize-users')}
        className={cx(BTN_BASE, BTN_GHOST)}
      >
        <ArrowLeft size={16} /> Back to User Recommendations
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Personalize Basic Submissions</h1>
          <p className="text-gray-400">Track submitter emails, status, and delivery issues.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className={cx(INPUT, 'pl-9')}
              placeholder="Search by name, email, mobile, status..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className={cx(INPUT, 'w-full sm:w-56')}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 p-4 text-red-300">
          Error loading submissions: {error?.message || 'Unknown error'}
          <button className={cx(BTN_BASE, BTN_GHOST, 'ml-3')} onClick={refetch}>
            Retry
          </button>
        </div>
      )}

      <div
        ref={tableWrapperRef}
        className={cx(
          CARD,
          'overflow-x-auto max-w-full touch-pan-x',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        onMouseDown={onTableMouseDown}
        onMouseMove={onTableMouseMove}
        onMouseUp={onTableMouseUp}
        onMouseLeave={onTableMouseUp}
        onTouchStart={onTableTouchStart}
        onTouchMove={onTableTouchMove}
        onTouchEnd={onTableTouchEnd}
      >
        <div className={CARD_DIV}>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase">
                <th className="px-2 py-2 min-w-12">#</th>
                <th className="px-2 py-2 min-w-35">Name</th>
                <th className="px-2 py-2 min-w-55">Email</th>
                <th className="px-2 py-2 min-w-32.5">Mobile</th>
                <th className="px-2 py-2 min-w-62.5">Notes</th>
                <th className="px-2 py-2 min-w-30">Status</th>
                <th className="px-2 py-2 min-w-30">Admin Email</th>
                <th className="px-2 py-2 min-w-30">User Email</th>
                <th className="px-2 py-2 min-w-55">Email Error</th>
                <th className="px-2 py-2 min-w-40">Email Sent</th>
                <th className="px-2 py-2 min-w-40">Created At</th>
                <th className="px-2 py-2 min-w-52.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-2 py-8 text-center text-gray-300">
                    Loading...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-2 py-8 text-center text-gray-300">
                    No submissions found.
                  </td>
                </tr>
              ) : (
                submissions.map((item, index) => (
                  <tr key={item.id || `${item.email}-${index}`} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-2 py-2 text-gray-300">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-2 py-2 min-w-35">{item.name || '-'}</td>
                    <td className="px-2 py-2 min-w-55 break-all">{item.email || '-'}</td>
                    <td className="px-2 py-2 min-w-32.5">{item.mobile || '-'}</td>
                    <td className="px-2 py-2 min-w-62.5 max-w-75 overflow-hidden text-ellipsis whitespace-nowrap" title={item.notes || ''}>
                      {item.notes || '-'}
                    </td>
                    <td className="px-2 py-2 min-w-30">
                      <span className={cx(
                        'inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium',
                        item.status === 'new' ? 'bg-blue-500/20 text-blue-200' :
                        item.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-200' :
                        item.status === 'converted' ? 'bg-green-500/20 text-green-200' :
                        item.status === 'rejected' ? 'bg-red-500/20 text-red-200' :
                        'bg-gray-500/20 text-gray-200'
                      )}>{item.status || 'new'}</span>
                    </td>
                    <td className="px-2 py-2 min-w-30">{item.admin_email_status || '-'}</td>
                    <td className="px-2 py-2 min-w-30">{item.user_email_status || '-'}</td>
                    <td className="px-2 py-2 min-w-55 max-w-70 overflow-hidden text-ellipsis whitespace-nowrap" title={item.email_error || ''}>
                      {item.email_error ? item.email_error.substring(0, 80) : '-'}
                    </td>
                    <td className="px-2 py-2 min-w-40">{item.email_sent_at ? new Date(item.email_sent_at).toLocaleString() : '-'}</td>
                    <td className="px-2 py-2 min-w-40">{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td>
                    <td className="px-2 py-2 min-w-52.5">
                      <div className="flex flex-wrap gap-2">
                        <select
                          className={cx(INPUT, 'w-full')}
                          value={editingId === item.id ? selectedStatus : item.status || 'new'}
                          onChange={(e) => {
                            setEditingId(item.id);
                            setSelectedStatus(e.target.value);
                          }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          className={cx(BTN_BASE, BTN_PRIMARY, 'w-full')}
                          disabled={isUpdating || (editingId !== item.id)}
                          onClick={async () => {
                            if (!editingId || editingId !== item.id) return;

                            try {
                              await updateStatus({ id: item.id, status: selectedStatus }).unwrap();
                              setEditingId(null);
                              setSelectedStatus('');
                              refetch();
                            } catch (err) {
                              console.error('Status update failed', err);
                            }
                          }}
                        >
                          {isUpdating && editingId === item.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className={cx(BTN_BASE, BTN_GHOST, 'w-full')}
                          onClick={() => {
                            navigate('/admin/personalize-basic', {
                              state: {
                                selectedUser: {
                                  full_name: item.name,
                                  email: item.email,
                                  mobile: item.mobile,
                                },
                              },
                            });
                          }}
                        >
                          Prescribe
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-400">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className={cx(BTN_BASE, BTN_GHOST, page <= 1 && 'opacity-50 cursor-not-allowed')}
              >
                Previous
              </button>
              <span className="text-sm text-gray-300">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className={cx(BTN_BASE, BTN_GHOST, page >= totalPages && 'opacity-50 cursor-not-allowed')}
              >
                Next
              </button>
              <select
                className={cx(INPUT, 'w-20')}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 30, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
