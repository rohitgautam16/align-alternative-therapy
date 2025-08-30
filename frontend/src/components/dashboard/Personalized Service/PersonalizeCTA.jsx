// src/components/dashboard/Personalized Service/PersonalizeCTA.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import {
  useCreatePersonalizeBasicRequestMutation,
  useGetSubscriptionSummaryQuery
} from '../../../utils/api';

const btnGlass =
  'inline-flex items-center justify-center cursor-pointer gap-2 px-5 py-2.5 rounded-lg ' +
  'bg-white/10 backdrop-blur-sm text-white ring-1 ring-white/15 ' +
  'hover:bg-white/15 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60';

const inputCx =
  'w-full px-3 py-2.5 rounded-lg bg-white/10 text-gray-100 placeholder:text-gray-300 ' +
  'backdrop-blur-sm ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-600';
const labelCx = 'text-xs text-gray-200';
const errText = 'text-xs text-rose-300 mt-1';

function StatusBanner({ type = 'success', message = '', onClose }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div
      className={`
        relative w-full rounded-xl px-4 py-3
        ring-1 backdrop-blur
        transition-all duration-300
        ${isSuccess
          ? 'bg-emerald-500/12 ring-emerald-400/25 text-emerald-100'
          : 'bg-rose-500/12 ring-rose-400/25 text-rose-100'}
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {isSuccess ? '✅' : '⚠️'}
        </div>
        <div className="text-sm leading-relaxed">{message}</div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto -m-1 p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 hover:bg-white/10"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ===== Modal with reliable open/close + glassmorphism ===== */
function Modal({ open, onClose, title, children }) {
  const [visible, setVisible] = React.useState(open);
  const [show, setShow] = React.useState(open);

  React.useEffect(() => {
    if (open) {
      setVisible(true);
      const t = setTimeout(() => setShow(true), 30);
      return () => clearTimeout(t);
    } else {
      setShow(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Dialog wrapper */}
      <div
        className={`
          relative w-full max-w-xl rounded-2xl overflow-hidden
          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          will-change-transform will-change-opacity
          ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
        `}
        role="dialog" aria-modal="true" aria-label={title}
      >
        {/* Subtle glass/shine layers */}
        <div className="absolute inset-0 backdrop-blur-2xl bg-transparent" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
          <div className="absolute -top-24 left-10 h-56 w-72 rotate-12 rounded-full bg-white/12 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-2xl">
          <div className="h-full w-full rounded-2xl bg-black/10" />
        </div>

        {/* CONTENT */}
        <div className="relative text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400/70 shadow-[0_0_12px_2px_rgba(34,211,238,0.5)]" />
              <span className="text-md font-medium text-gray-100">{title}</span>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center cursor-pointer rounded-lg bg-white/10 hover:bg-white/15 ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 max-h-[70vh] overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function PersonalizeCTA() {
  const navigate = useNavigate();
  const user = useAuthUser();
  const userId = user?.id ?? 'anon';

  // Authoritative subscription summary (server), with cookie fallback & refetch hook preserved
  const { data: subSummary, refetch } = useGetSubscriptionSummaryQuery(userId, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 0,
  });

  // Prefer server entitlement when present; fallback to your previous logic
  const hasAddonFromSummary = subSummary?.hasAddon;
  const hasAddonFromCookie = Number(user?.has_addon) === 1;

  const status = subSummary?.status;
  const entitledStatuses = new Set(['active', 'trialing', 'past_due']);

  // NEW: prefer server-computed addonEntitled when available
  const hasPersonalizeAddon =
    typeof subSummary?.addonEntitled === 'boolean'
      ? subSummary.addonEntitled
      : (entitledStatuses.has(status) &&
         (typeof hasAddonFromSummary === 'boolean' ? hasAddonFromSummary : hasAddonFromCookie));

  // CTA state
  const [openForm, setOpenForm] = React.useState(false);
  const [openLearn, setOpenLearn] = React.useState(false);
  const [okMsg, setOkMsg] = React.useState('');
  const [errMsg, setErrMsg] = React.useState('');

  const [form, setForm] = React.useState({ name: '', email: '', mobile: '', notes: '', hp_field: '' });
  const [errors, setErrors] = React.useState({});

  const [createReq, { isLoading: submitting }] = useCreatePersonalizeBasicRequestMutation();

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    if (!form.notes.trim()) e.notes = 'Notes are required';
    if (form.hp_field?.trim()) e.hp_field = 'Bot detected';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setOkMsg('');
    setErrMsg('');
    if (!validate()) return;
    try {
      await createReq({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        notes: form.notes.trim(),
      }).unwrap();
      setOkMsg('Thanks! Our team will contact you shortly.');
      setForm({ name: '', email: '', mobile: '', notes: '', hp_field: '' });
      const okTimer = setTimeout(() => setOkMsg(''), 2500);
      setTimeout(() => setOpenForm(false), 1000);
      return () => clearTimeout(okTimer);
    } catch (err) {
      setErrMsg(err?.data?.error || err?.error || 'Failed to submit');
    }
  }

  // Optional: refresh sub after returning from Stripe (if you set a flag)
  React.useEffect(() => {
    const flag = sessionStorage.getItem('shouldRefetchSub');
    if (flag) {
      sessionStorage.removeItem('shouldRefetchSub');
      refetch();
    }
  }, [refetch]);

  const heroImg = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1600&q=80';
  const onBuyAddon = () => navigate('/pricing');

  return (
    <>
      <section className="relative rounded-3xl overflow-hidden ring-1 ring-white/10 py-20 m-6">
        {/* Background image + overlays */}
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black/65" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />
          </div>
          {/* Soft vignette */}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
        </div>

        {/* Content */}
        <div className="relative p-6 sm:p-10 max-w-3xl">
          <div className="space-y-3">
            <h3 className="text-2xl sm:text-4xl font-semibold text-white">
              Get a Personalized Music Plan
            </h3>
            <p className="text-sm sm:text-base text-gray-200">
              Talk to a specialist. We’ll understand your needs and craft a focused set of playlists &amp; tracks.
            </p>

            {/* Actions */}
            <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              {hasPersonalizeAddon ? (
                <button className={btnGlass} onClick={() => setOpenForm(true)}>
                  Request Personalization
                </button>
              ) : (
                <button className={btnGlass} onClick={onBuyAddon}>
                  Buy Add-On Personalized Plan
                </button>
              )}

              <button className={btnGlass} onClick={() => setOpenLearn(true)}>
                Learn more
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Form Modal */}
      <Modal open={openForm} onClose={() => setOpenForm(false)} title="Request Personalized Support">
        <form onSubmit={submit} className="space-y-5" aria-describedby="form-help">
          <StatusBanner
            type="success"
            message={okMsg}
            onClose={() => setOkMsg('')}
          />
          <StatusBanner
            type="error"
            message={errMsg}
            onClose={() => setErrMsg('')}
          />

          {/* Honeypot */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.hp_field}
            onChange={(e) => setForm((s) => ({ ...s, hp_field: e.target.value }))}
            className="hidden"
            aria-hidden="true"
          />

          {/* Name */}
          <div className="space-y-1.5">
            <label className={labelCx} htmlFor="pb-name">Your name *</label>
            <div className="relative">
              <input
                id="pb-name"
                className={`${inputCx} ring-white/15 focus:ring-cyan-500/70`}
                placeholder=""
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                aria-invalid={Boolean(errors.name)}
              />
              <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/5" />
            </div>
            {errors.name && <div className={errText}>{errors.name}</div>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className={labelCx} htmlFor="pb-email">Email *</label>
            <div className="relative">
              <input
                id="pb-email"
                className={`${inputCx} ring-white/15 focus:ring-cyan-500/70`}
                placeholder=""
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                aria-invalid={Boolean(errors.email)}
              />
              <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/5" />
            </div>
            {errors.email && <div className={errText}>{errors.email}</div>}
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <label className={labelCx} htmlFor="pb-mobile">Mobile *</label>
            <div className="relative">
              <input
                id="pb-mobile"
                className={`${inputCx} ring-white/15 focus:ring-cyan-500/70`}
                placeholder=""
                value={form.mobile}
                onChange={(e) => setForm((s) => ({ ...s, mobile: e.target.value }))}
                aria-invalid={Boolean(errors.mobile)}
              />
              <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/5" />
            </div>
            {errors.mobile && <div className={errText}>{errors.mobile}</div>}
            <p id="form-help" className="text-[11px] text-gray-300/80">
              We’ll only use this to contact you about your personalized plan.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className={labelCx} htmlFor="pb-notes">Notes *</label>
            <div className="relative">
              <textarea
                id="pb-notes"
                className={`${inputCx} ring-white/15 focus:ring-cyan-500/70`}
                rows={4}
                placeholder="Share a bit about your goals (focus, stress relief, sleep, etc.)"
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                aria-invalid={Boolean(errors.notes)}
              />
              <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/5" />
              <div className="absolute bottom-2 right-3 text-[11px] text-gray-300/70">
                {form.notes.length}/500
              </div>
            </div>
            {errors.notes && <div className={errText}>{errors.notes}</div>}
          </div>

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
            <button type="button" className={btnGlass} onClick={() => setOpenForm(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className={`${btnGlass} disabled:opacity-60 disabled:cursor-not-allowed`}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Learn More Modal */}
      <Modal open={openLearn} onClose={() => setOpenLearn(false)} title="Learn More">
        <div className="space-y-3">
          <h4 className="text-lg font-semibold">Why Personalized Plans?</h4>
          <p className="text-sm text-gray-200">
            Our specialists analyze your preferences and recommend tracks and playlists tailored for your goals—whether
            it’s focus, relaxation, or better sleep. Ask questions, iterate, and refine quickly to get exactly what you need.
          </p>
        </div>
      </Modal>
    </>
  );
}
