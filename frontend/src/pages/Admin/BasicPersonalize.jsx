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
  // Payment hooks
  useCreatePbPaymentLinkMutation,
  useGetPbPaymentStatusQuery,
  // Delete/Restore hooks
  useDeletePbRecommendationMutation,
  useRestorePbRecommendationMutation,
  useAdminPbListDeletedForUserQuery,
  useHardDeletePbRecommendationMutation,
} from '../../utils/api';
import { useLocation } from 'react-router-dom';

// ========= utilities =========
const cx = (...s) => s.filter(Boolean).join(' ');

// Colors pulled from your snippet
const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 disabled:opacity-50';
const BTN_PRIMARY = 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-400/60';
const BTN_GHOST = 'bg-gray-700 hover:bg-gray-600 text-gray-100 focus-visible:ring-blue-400/60';
const BTN_DANGER = 'bg-red-600 hover:bg-red-500 text-white focus-visible:ring-red-400/60';
const BTN_SUCCESS = 'bg-green-600 hover:bg-green-500 text-white focus-visible:ring-green-400/60';
const BTN_LINK = 'text-gray-300 hover:text-white transition-colors';
const BTN_WARNING = 'bg-orange-600 hover:bg-orange-500 text-white focus-visible:ring-orange-400/60';
const INPUT =
  'w-full px-3 py-2 rounded bg-[#0b1220] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600';
const TEXTAREA = INPUT;
const CARD =
  'rounded-xl bg-[#0b0f19] ring-1 ring-white/10 text-white shadow-[0_10px_50px_-20px_rgba(0,0,0,0.6)]';
const CARD_DIV = 'p-5';
const CARD_HEADER = 'flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-white/10';

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

// Delete Confirmation Modal
function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#0b0f19] rounded-lg p-6 ring-1 ring-white/10 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-3">Delete Recommendation</h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete "{title}"? This will also delete all items in this recommendation.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            className={cx(BTN_BASE, BTN_GHOST)}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={cx(BTN_BASE, BTN_DANGER)}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hard Delete Confirmation Modal
function HardDeleteConfirmModal({ isOpen, onClose, onConfirm, title, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[51] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#0b0f19] rounded-lg p-6 ring-1 ring-white/10 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-3 text-red-400">Permanent Delete</h3>
        <p className="text-gray-300 mb-4">
          Are you sure you want to <strong>permanently delete</strong> "{title}"?
        </p>
        <div className="bg-red-900/20 border border-red-600/30 rounded p-3 mb-6">
          <p className="text-red-300 text-sm">
            ⚠️ This action cannot be undone. The recommendation and all its items will be permanently removed from the database.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            className={cx(BTN_BASE, BTN_GHOST)}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={cx(BTN_BASE, BTN_DANGER)}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting Forever...' : 'Delete Forever'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Updated Deleted Recommendations Modal with hard delete
function DeletedRecommendationsModal({ isOpen, onClose, userId, onRestore, onHardDelete }) {
  const { data: deletedRecs = [], refetch } = useAdminPbListDeletedForUserQuery(
    userId || '__skip__',
    { skip: !userId || !isOpen }
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#0b0f19] rounded-lg ring-1 ring-white/10 max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold">Deleted Recommendations</h3>
          <p className="text-xs text-gray-400 mt-1">
            {deletedRecs.length} deleted recommendation{deletedRecs.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5">
          {deletedRecs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              No deleted recommendations found
            </div>
          ) : (
            <div className="space-y-4">
              {deletedRecs.map((rec) => (
                <div key={rec.id} className="p-4 rounded-lg bg-white/5 ring-1 ring-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-base mb-1">
                        {rec.title?.trim() || '(Untitled)'}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        Deleted: {rec.deleted_at ? new Date(rec.deleted_at).toLocaleString() : 'Unknown'}
                      </div>
                      {rec.summary_note && (
                        <div className="text-sm text-gray-300 line-clamp-2">
                          {rec.summary_note}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>ID: #{rec.id}</span>
                        {rec.payment_status && rec.payment_status !== 'free' && (
                          <span className="px-2 py-1 rounded bg-yellow-600/20 text-yellow-300">
                            {rec.payment_status} • {rec.currency || 'USD'} {rec.price_cents ? (rec.price_cents / 100) : '0'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        className={cx(BTN_BASE, BTN_SUCCESS, 'text-xs')}
                        onClick={() => onRestore(rec.id, rec.title)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                          <path d="M3 3v5h5"/>
                        </svg>
                        Restore
                      </button>
                      <button
                        className={cx(BTN_BASE, BTN_WARNING, 'text-xs')}
                        onClick={() => onHardDelete(rec.id, rec.title)}
                        title="Permanently delete - cannot be undone"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          <path d="M10 11v6M14 11v6"/>
                        </svg>
                        Delete Forever
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-5 border-t border-white/10">
          <button
            className={cx(BTN_BASE, BTN_GHOST, 'w-full')}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Payment status badge component - now handles dynamic currency and free status
function PaymentStatusBadge({ status, price, currency }) {
  if (!status) return null;
  
  if (status === 'free') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] bg-green-600/30 text-green-200">
        Free
      </span>
    );
  }
  
  const badgeClasses = {
    pending: 'bg-yellow-600/30 text-yellow-200',
    paid: 'bg-green-600/30 text-green-200',
  };

  const displayPrice = price ? `${currency || 'USD'} ${price}` : '';
  const label = status === 'paid' ? `Paid ${displayPrice}` : `Pending ${displayPrice}`;

  return (
    <span className={cx('inline-flex items-center px-2 py-1 rounded-full text-[11px]', badgeClasses[status] || 'bg-gray-600/30')}>
      {label}
    </span>
  );
}

// 🆕 UPDATED: Payment link creation component with "Make Free" option
function PaymentLinkCreator({ recommendationId, currentPaymentData, onSuccess }) {
  const [price, setPrice] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [createLink, { isLoading, error }] = useCreatePbPaymentLinkMutation();

  const handleCreate = async (isFree = false) => {
    if (!isFree && !price.trim()) return;
    
    try {
      const result = await createLink({
        recommendationId,
        price: isFree ? 0 : parseFloat(price),
        isFree: isFree,
      }).unwrap();
      
      console.log('Payment link created - backend response:', result);
      
      // Transform backend response to match expected format
      const transformedData = {
        paymentLinkUrl: result.paymentLink,
        price: result.amount,
        currency: result.currency,
        status: result.status  // Will be 'free' or 'pending'
      };
      
      // Parent will handle storing this
      onSuccess(transformedData);
      setPrice('');
    } catch (err) {
      console.error('Payment link creation failed:', err);
    }
  };

  const handleCopyLink = () => {
    if (currentPaymentData?.paymentLinkUrl) {
      navigator.clipboard.writeText(currentPaymentData.paymentLinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayCurrency = currentPaymentData?.currency || 'CAD';

  // If marked as free
  if (currentPaymentData?.status === 'free') {
    return (
      <div className="rounded-xl bg-gradient-to-r from-green-600/10 to-emerald-500/10 border border-green-600/30 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.56.93 6.18 2.45"/>
              </svg>
            </div>
            <div>
              <span className="text-base font-medium text-green-200">Free Recommendation</span>
              <div className="text-sm text-gray-300">
                No payment required
              </div>
            </div>
          </div>
          <PaymentStatusBadge 
            status="free"
            price={0}
            currency={currentPaymentData.currency}
          />
        </div>
      </div>
    );
  }

  // If payment link exists (paid or pending)
  if (currentPaymentData?.paymentLinkUrl) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-green-600/10 to-green-500/10 border border-green-600/30 p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.56.93 6.18 2.45"/>
              </svg>
            </div>
            <div>
              <span className="text-base font-medium text-green-200">Payment Link Generated</span>
              <div className="text-sm text-gray-300">
                Amount: {currentPaymentData.currency || 'USD'} {currentPaymentData.price}
              </div>
            </div>
          </div>
          {currentPaymentData.status && (
            <PaymentStatusBadge 
              status={currentPaymentData.status} 
              price={currentPaymentData.price}
              currency={currentPaymentData.currency}
            />
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <input
              className={cx(INPUT, 'text-xs font-mono bg-green-950/30 border border-green-600/20')}
              readOnly
              value={currentPaymentData.paymentLinkUrl}
              onClick={(e) => e.target.select()}
            />
          </div>
          <button
            className={cx(BTN_BASE, BTN_SUCCESS, 'transition-all duration-200')}
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Create payment link form with "Make Free" option
  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
            <rect width="20" height="14" x="2" y="5" rx="2"/>
            <line x1="2" x2="22" y1="10" y2="10"/>
          </svg>
        </div>
        <div>
          <div className="text-base font-medium">Payment Setup</div>
          <div className="text-sm text-gray-400">Create a payment link or mark as free</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Price Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-7">
            <Field 
              label={`Price (${displayCurrency})`} 
              hint={`Leave empty to mark as free`}
            >
              <input
                className={cx(INPUT, 'bg-blue-950/30 border border-blue-600/20')}
                type="number"
                step="0.01"
                min="0"
                placeholder={`e.g., ${displayCurrency === 'USD' ? '29.99' : '299.00'} or leave empty for free`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
          </div>
          <div className="sm:col-span-5 flex items-center">
            <button
              className={cx(BTN_BASE, BTN_PRIMARY, 'w-full h-[42px]')}
              onClick={() => handleCreate(false)}
              disabled={isLoading || !price.trim()}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  Generate Payment Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0b0f19] px-2 text-gray-400">Or</span>
          </div>
        </div>

        {/* Make Free Button */}
        <button
          className={cx(BTN_BASE, BTN_SUCCESS, 'w-full')}
          onClick={() => handleCreate(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Mark as Free Recommendation
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-600/30">
          <div className="text-sm text-red-300">
            {error?.data?.error || 'Failed to process request'}
          </div>
        </div>
      )}
    </div>
  );
}

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
                    setOpen(false);
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

// UPDATED: Drawer Component with batch adding and prescription notes
function AddItemDrawer({ isOpen, onClose, onAddBatch, recId, isAdding }) {
  const [newType, setNewType] = React.useState('track');
  const [pendingItems, setPendingItems] = React.useState([]);

  const hook = newType === 'track' ? useAdminPbSearchSongsQuery : useAdminPbSearchPlaylistsQuery;

  React.useEffect(() => {
    if (!isOpen) {
      setPendingItems([]);
    }
  }, [isOpen]);

  const handleAddToPending = (pick) => {
    // Check if already added
    const exists = pendingItems.some(item => item.data.id === pick.id && item.type === newType);
    if (exists) return;

    setPendingItems(prev => [...prev, {
      type: newType,
      data: pick,
      prescriptionNote: '',
      displayOrder: ''
    }]);
  };

  const handleRemoveFromPending = (index) => {
    setPendingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePrescriptionNote = (index, note) => {
    setPendingItems(prev => prev.map((item, i) => 
      i === index ? { ...item, prescriptionNote: note } : item
    ));
  };

  const handleUpdateDisplayOrder = (index, order) => {
    setPendingItems(prev => prev.map((item, i) => 
      i === index ? { ...item, displayOrder: order } : item
    ));
  };

  const handleAddAll = async () => {
    if (pendingItems.length === 0) return;
    await onAddBatch(pendingItems);
    setPendingItems([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-[#0b0f19] z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className='w-full space-y-2'>
            <h3 className="text-lg font-semibold">Add Songs/Playlists</h3>
            <p className="text-xs text-gray-400 mt-1">
              {pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''} ready to add
            </p>
            <Field label="Item Type">
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={cx(
                    'px-4 py-3 rounded-lg border-2 transition text-sm font-medium',
                    newType === 'track'
                      ? 'border-blue-600 bg-blue-600/20 text-blue-300'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  )}
                  onClick={() => setNewType('track')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-1">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8"/>
                  </svg>
                  Track
                </button>
                <button
                  className={cx(
                    'px-4 py-3 rounded-lg border-2 transition text-sm font-medium',
                    newType === 'playlist'
                      ? 'border-blue-600 bg-blue-600/20 text-blue-300'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  )}
                  onClick={() => setNewType('playlist')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-1">
                    <line x1="8" x2="21" y1="6" y2="6"/>
                    <line x1="8" x2="21" y1="12" y2="12"/>
                    <line x1="8" x2="21" y1="18" y2="18"/>
                    <line x1="3" x2="3.01" y1="6" y2="6"/>
                    <line x1="3" x2="3.01" y1="12" y2="12"/>
                    <line x1="3" x2="3.01" y1="18" y2="18"/>
                  </svg>
                  Playlist
                </button>
              </div>
            </Field>

            {/* Search */}
            <Field label={newType === 'track' ? 'Search Tracks' : 'Search Playlists'}>
              <PopoverPicker
                placeholder={newType === 'track' ? 'Search tracks by title or artist...' : 'Search playlists by title...'}
                hook={hook}
                onPick={handleAddToPending}
                formatItem={(it) => {
                  const title = newType === 'track' ? it.title || it.name || `Track #${it.id}` : it.title || `Playlist #${it.id}`;
                  const sub = newType === 'track' ? it.artist || '' : it.slug ? `/${it.slug}` : '';
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
            </Field>
          </div>
          <button
            onClick={onClose}
            className="p-2 absolute top-2 right-2 hover:bg-white/10 rounded-lg transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Pending Items List */}
          {pendingItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Items to Add ({pendingItems.length})</div>
                <button
                  onClick={() => setPendingItems([])}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear All
                </button>
              </div>
              
              {pendingItems.map((item, index) => {
                const title = item.type === 'track' 
                  ? item.data.title || item.data.name 
                  : item.data.title;
                const sub = item.type === 'track' 
                  ? item.data.artist 
                  : item.data.slug ? `/${item.data.slug}` : '';

                return (
                  <div key={index} className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
                    {/* Item Header with Image */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-white/10 overflow-hidden flex-shrink-0">
                        {item.data.image && (
                          <img className="w-full h-full object-cover" alt="" src={item.data.image} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-gray-700 text-gray-100">
                            {item.type}
                          </span>
                          <div className="font-medium truncate text-sm">{title}</div>
                        </div>
                        {sub && <div className="text-xs text-gray-400 truncate">{sub}</div>}
                      </div>
                      <button
                        onClick={() => handleRemoveFromPending(index)}
                        className="p-1 hover:bg-red-600/20 rounded text-red-400"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>

                    {/* Prescription Note and Order */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-9">
                        <input
                          className={cx(INPUT, 'text-xs')}
                          placeholder="Prescription note (optional)"
                          value={item.prescriptionNote}
                          onChange={(e) => handleUpdatePrescriptionNote(index, e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          className={cx(INPUT, 'text-xs')}
                          placeholder="Order"
                          type="number"
                          value={item.displayOrder}
                          onChange={(e) => handleUpdateDisplayOrder(index, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 flex gap-3">
          <button
            className={cx(BTN_BASE, BTN_GHOST, 'flex-1')}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={cx(BTN_BASE, BTN_PRIMARY, 'flex-1')}
            onClick={handleAddAll}
            disabled={pendingItems.length === 0 || isAdding}
          >
            {isAdding ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Adding {pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add {pendingItems.length} Item{pendingItems.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// UPDATED: Items list with images
function ItemsList({ items = [], onSave, onDelete }) {
  if (!items.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
        <p className="text-sm">No items added yet</p>
        <p className="text-xs mt-1">Click "Add Songs/Playlists" button to get started</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <ItemRow key={it.id} it={it} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
}

// UPDATED: ItemRow with image display
function ItemRow({ it, onSave, onDelete }) {
  const [note, setNote] = React.useState(it.prescription_note || '');
  const [order, setOrder] = React.useState(it.display_order ?? '');

  const meta = it.item_type === 'track' ? it.track : it.playlist;
  const title = it.item_type === 'track'
    ? meta?.title || meta?.name || `Track #${it.track_id}`
    : meta?.title || `Playlist #${it.playlist_id}`;
  const sub = it.item_type === 'track' ? meta?.artist : meta?.slug ? `/${meta.slug}` : null;
  const image = meta?.image || null;

  return (
    <div className="p-3 rounded-xl bg-white/5 ring-1 ring-white/10">
      <div className="flex items-center gap-3 mb-3">
        {/* Image */}
        <div className="w-12 h-12 rounded bg-white/10 overflow-hidden flex-shrink-0">
          {image ? (
            <img className="w-full h-full object-cover" alt="" src={image} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {it.item_type === 'track' ? (
                  <>
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8"/>
                  </>
                ) : (
                  <>
                    <line x1="8" x2="21" y1="6" y2="6"/>
                    <line x1="8" x2="21" y1="12" y2="12"/>
                    <line x1="8" x2="21" y1="18" y2="18"/>
                  </>
                )}
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-[11px] bg-gray-700 text-gray-100">{it.item_type}</span>
            <div className="font-medium truncate">{title}</div>
          </div>
          {sub && <div className="text-xs text-gray-400 truncate mt-1">{sub}</div>}
        </div>

        {/* ID */}
        <div className="text-xs text-gray-400">
          #{it.item_type === 'track' ? it.track_id : it.playlist_id}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
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
  const location = useLocation();
  const { Toast, show } = useToast();

  const preSelectedUser = location.state?.selectedUser;

  // user search
  const [userQuery, setUserQuery] = React.useState('');
  const { list: users, isFetching: usersLoading, skip: skipUsers, q: normalizedUserQ } =
    useGuardedSearchList(useAdminPbSearchUsersQuery, userQuery);
  const [user, setUser] = React.useState(preSelectedUser || null);

  // Delete/Restore states
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showHardDeleteModal, setShowHardDeleteModal] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = React.useState(null);
  const [showDeletedModal, setShowDeletedModal] = React.useState(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const [paymentLinksCache, setPaymentLinksCache] = React.useState({});

  React.useEffect(() => {
    if (preSelectedUser) {
      window.history.replaceState({}, '');
    }
  }, [preSelectedUser]);

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

  const { data: paymentStatus, refetch: refetchPayment } = useGetPbPaymentStatusQuery(
    recId || '__skip__',
    { skip: !recId }
  );

  const currentPaymentData = paymentLinksCache[recId] || paymentStatus;

  // mutations
  const [createRec, { isLoading: creating }] = useAdminPbCreateMutation();
  const [addItem, { isLoading: adding }] = useAdminPbAddItemMutation();
  const [updateItem] = useAdminPbUpdateItemMutation();
  const [deleteItem] = useAdminPbDeleteItemMutation();
  const [updateStatus, { isLoading: statusing }] = useAdminPbUpdateStatusMutation();
  const [sendNow, { isLoading: sending }] = useAdminPbSendNowMutation();
  
  // Delete/Restore mutations
  const [deleteRec, { isLoading: deleting }] = useDeletePbRecommendationMutation();
  const [restoreRec, { isLoading: restoring }] = useRestorePbRecommendationMutation();
  const [hardDeleteRec, { isLoading: hardDeleting }] = useHardDeletePbRecommendationMutation();

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

  // UPDATED: Batch add items from drawer
  async function onAddBatchFromDrawer(itemsToAdd) {
    if (!recId || itemsToAdd.length === 0) return;
    
    try {
      // Add items one by one (you could create a batch endpoint on backend for better performance)
      for (const item of itemsToAdd) {
        const payload = {
          recId,
          item_type: item.type,
          track_id: item.type === 'track' ? item.data.id : undefined,
          playlist_id: item.type === 'playlist' ? item.data.id : undefined,
          prescription_note: item.prescriptionNote || null,
          display_order: item.displayOrder ? Number(item.displayOrder) : null,
        };
        await addItem(payload).unwrap();
      }
      
      await refetchRec();
      show(`Added ${itemsToAdd.length} item${itemsToAdd.length !== 1 ? 's' : ''}`);
      setDrawerOpen(false);
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

  // Delete recommendation handlers
  function onDeleteRecommendation(rec) {
    setDeleteTarget(rec);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRec({ id: deleteTarget.id, cascade: true }).unwrap();
      setShowDeleteModal(false);
      setDeleteTarget(null);
      if (recId === deleteTarget.id) {
        setRecId(null);
      }
      await refetchList();
      show('Recommendation deleted');
    } catch (e) {
      alert(e?.data?.error || 'Failed to delete recommendation');
    }
  }

  // Hard delete handlers
  function onHardDeleteRecommendation(recIdParam, recTitle) {
    setHardDeleteTarget({ id: recIdParam, title: recTitle });
    setShowHardDeleteModal(true);
  }

  async function confirmHardDelete() {
    if (!hardDeleteTarget) return;
    try {
      await hardDeleteRec(hardDeleteTarget.id).unwrap();
      setShowHardDeleteModal(false);
      setHardDeleteTarget(null);
      show('Recommendation permanently deleted');
    } catch (e) {
      alert(e?.data?.error || 'Failed to permanently delete recommendation');
    }
  }

  // Restore recommendation handler
  async function onRestoreRecommendation(recIdParam, recTitle) {
    try {
      await restoreRec({ id: recIdParam, cascade: true }).unwrap();
      await refetchList();
      show(`Restored: ${recTitle || 'Recommendation'}`);
    } catch (e) {
      alert(e?.data?.error || 'Failed to restore recommendation');
    }
  }

  // 🔥 UPDATED: Payment link success handler - stores in cache
  async function onPaymentLinkSuccess(result) {
    console.log('Payment link created, storing in cache:', result);
    
    const message = result.status === 'free' 
      ? 'Recommendation marked as free' 
      : `Payment link created: ${result.currency} ${result.price}`;
    
    show(message);
    
    // Store in cache by recommendation ID
    setPaymentLinksCache(prev => ({
      ...prev,
      [recId]: result
    }));
    
    // Also refetch in background
    await Promise.all([refetchPayment(), refetchRec()]);
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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button className={BTN_LINK} onClick={() => window.history.back()}>
          <span className="inline-flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-300">
              <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Back to Users</span>
            <span className="sm:hidden">Back</span>
          </span>
        </button>
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
                
                {/* Create Draft Button */}
                <div className="mt-3 flex justify-end">
                  <button
                    className={cx(BTN_BASE, BTN_PRIMARY)}
                    onClick={onCreateDraft}
                    disabled={!canCreate() || creating || !user}
                    title="Provide Title & Summary above to enable"
                  >
                    {creating ? 'Creating…' : 'Create Draft'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {userRecs.map((r) => {
                  const when = r.sent_at || r.updated_at || r.created_at;
                  const cardTitle = r.title?.trim() ? r.title : '(Untitled)';
                  const hasSummary = !!(r.summary_note && r.summary_note.trim());
                  
                  const hasPayment = r.payment_status && r.payment_status !== 'free';
                  const paymentPrice = r.price_cents ? r.price_cents / 100 : 0;
                  const paymentCurrency = r.currency || 'USD';

                  return (
                    <div
                      key={r.id}
                      className={cx(
                        'p-3 rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition relative',
                        recId === r.id && 'outline-2 outline-blue-500/60'
                      )}
                    >
                      <button
                        className="absolute top-2 right-2 p-1 hover:bg-red-600/20 rounded text-red-400 hover:text-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRecommendation(r);
                        }}
                        title="Delete recommendation"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </button>

                      <button
                        onClick={() => setRecId(r.id)}
                        className="w-full text-left pr-6"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="font-medium truncate">{cardTitle}</div>
                          <div className="flex items-center gap-2">
                            {(hasPayment || r.payment_status === 'free') && (
                              <PaymentStatusBadge 
                                status={r.payment_status} 
                                price={paymentPrice}
                                currency={paymentCurrency}
                              />
                            )}
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
                        </div>
                        <div className="text-xs text-gray-400 mb-1">{when ? new Date(when).toLocaleString() : ''}</div>
                        {hasSummary ? (
                          <div className="text-sm text-gray-300 line-clamp-3">{r.summary_note}</div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">No summary</div>
                        )}
                      </button>
                    </div>
                  );
                })}
                {userRecs.length === 0 && (
                  <div className="rounded-lg bg-white/5 p-6 text-center text-sm text-gray-300">
                    No drafts yet. Enter Title & Summary above and click "Create Draft".
                  </div>
                )}
              </div>

              {user && (
                <div className="flex justify-end mt-4">
                  <button
                    className={cx(BTN_BASE, BTN_GHOST, 'text-xs')}
                    onClick={() => setShowDeletedModal(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                    View Deleted
                  </button>
                </div>
              )}
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
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  className={cx(BTN_BASE, BTN_PRIMARY, 'flex-1 sm:flex-none')} 
                  onClick={onSend} 
                  disabled={sending}
                >
                  {sending ? 'Sending…' : 'Send to user'}
                </button>
                <button 
                  className={cx(BTN_BASE, BTN_DANGER, 'flex-1 sm:flex-none')} 
                  onClick={() => onDeleteRecommendation(recData?.recommendation)}
                  disabled={deleting}
                  title="Delete this recommendation"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
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
                  <div className="mb-6 p-4 rounded-lg bg-white/5 text-sm text-gray-300 whitespace-pre-wrap">
                    {recData.recommendation.summary_note}
                  </div>
                )}

                {/* Payment Link Section - 🔥 UPDATED: Uses cached data */}
                <div className="mb-6">
                  <PaymentLinkCreator
                    key={recId}
                    recommendationId={recId}
                    currentPaymentData={currentPaymentData}
                    onSuccess={onPaymentLinkSuccess}
                  />
                </div>

                {/* Add Item Button - Opens Drawer */}
                <div className="mb-6 flex gap-2 flex-col md:flex-row md:justify-between justify-left items-left md:items-center">
                  <h3 className="font-medium text-sm">Items in this Recommendation</h3>
                  <button
                    className={cx(BTN_BASE, BTN_PRIMARY)}
                    onClick={() => setDrawerOpen(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Add Songs/Playlists
                  </button>
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

      {/* Drawer for Adding Items */}
      <AddItemDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAddBatch={onAddBatchFromDrawer}
        recId={recId}
        isAdding={adding}
      />

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title={deleteTarget?.title || '(Untitled)'}
        isLoading={deleting}
      />

      <HardDeleteConfirmModal
        isOpen={showHardDeleteModal}
        onClose={() => {
          setShowHardDeleteModal(false);
          setHardDeleteTarget(null);
        }}
        onConfirm={confirmHardDelete}
        title={hardDeleteTarget?.title || '(Untitled)'}
        isLoading={hardDeleting}
      />

      <DeletedRecommendationsModal
        isOpen={showDeletedModal}
        onClose={() => setShowDeletedModal(false)}
        userId={user?.id}
        onRestore={onRestoreRecommendation}
        onHardDelete={onHardDeleteRecommendation}
      />

      <Toast />
    </div>
  );
}
