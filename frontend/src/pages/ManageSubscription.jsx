// src/pages/ManageSubscription.jsx
import React from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useCreateBillingPortalSessionMutation } from '../utils/api';
import DevicesSection from '../pages/DevicesSection';

const money = (minor, currency='INR') =>
  new Intl.NumberFormat('en-IN', { style:'currency', currency }).format((minor||0)/100);

function Section({ title, children, right }) {
  return (
    <section className="
      rounded-2xl border border-white/10 
      bg-white/5 backdrop-blur-md 
      p-5 shadow-lg transition
      hover:border-white/20 hover:bg-white/10
    ">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ status }) {
  const map = {
    active: 'bg-emerald-500/20 text-emerald-300',
    trialing: 'bg-sky-500/20 text-sky-300',
    past_due: 'bg-amber-500/20 text-amber-300',
    unpaid: 'bg-amber-500/20 text-amber-300',
    canceled: 'bg-rose-500/20 text-rose-300',
    paused: 'bg-sky-500/20 text-sky-300',
    granted: 'bg-violet-500/20 text-violet-300',
    none: 'bg-white/10 text-zinc-300',
  };
  const label = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past due',
    unpaid: 'Unpaid',
    canceled: 'Canceled',
    paused: 'Paused',
    granted: 'Admin Granted',
    none: '—',
  }[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
        map[status] || 'bg-white/10 text-zinc-300'
      }`}
    >
      {label}
    </span>
  );
}

export default function ManageSubscription() {
  const { summary: s, loading: isLoading, error, userTier } = useSubscription();
  const [createPortalSession, { isLoading: opening }] =
    useCreateBillingPortalSessionMutation();

  async function openPortal() {
    try {
      const { url } = await createPortalSession().unwrap();
      if (!url) throw new Error('No portal URL returned');
      window.location.href = url;
    } catch (e) {
      alert(e?.data?.error || e?.message || 'Could not open billing portal');
    }
  }

  if (error)
    return (
      <div className="mx-auto max-w-4xl p-6 text-red-400">
        Couldn’t load your subscription. Please try again.
      </div>
    );

  if (isLoading || !s)
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-64 rounded bg-white/10"></div>
          <div className="h-24 w-full rounded bg-white/10"></div>
        </div>
      </div>
    );

  const currency = s.currency || 'INR';
  const allSubs = Array.isArray(s.lineItems) && s.lineItems.length
    ? s.lineItems
    : [];

  const hasAdminGrant = userTier === 'admin_granted' || s.status === 'granted';

  const showSubs = hasAdminGrant
    ? [
        {
          id: 'admin-grant',
          product_name: 'Admin Granted Access',
          amount: 0,
          interval: 'lifetime',
          status: 'granted',
        },
        ...allSubs,
      ]
    : allSubs;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Your Subscription</h1>
          <p className="text-sm text-zinc-400">
            View your plan, renewal date, and access status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={s.status || (hasAdminGrant ? 'granted' : 'none')} />
        </div>
      </div>

      {/* Subscription Details */}
      <Section
        title="Your Plans"
        // right={
        //   s.status !== 'granted' && (
        //     <button
        //       onClick={openPortal}
        //       disabled={opening}
        //       className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-sm text-white disabled:opacity-50"
        //     >
        //       {opening ? 'Opening…' : 'Billing & Invoices'}
        //     </button>
        //   )
        // }
      >
        {showSubs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1">
            {showSubs.map((it) => {
              const price =
                it.amount > 0
                  ? money(it.amount, currency)
                  : '₹0 / lifetime';
              const cycle =
                it.interval === 'year'
                  ? 'year'
                  : it.interval === 'lifetime'
                  ? 'lifetime'
                  : 'month';
              const status = it.status || s.status || 'none';

              return (
                <div
                  key={it.id}
                  className="rounded-xl ring-1 flex flex-col min-h-42 justify-center ring-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium">
                      {it.product_name || 'Subscription'}
                    </div>
                    <StatusPill status={status} />
                  </div>

                  <div className="mt-2 text-sm text-zinc-300">
                    {price} / {cycle}
                  </div>

                  {status !== 'granted' && s.currentPeriodEnd && (
                    <div className="mt-3 text-sm text-zinc-200">
                      {s.cancelAtPeriodEnd
                        ? `Ends on ${new Date(
                            s.currentPeriodEnd
                          ).toLocaleDateString()}`
                        : `Renews on ${new Date(
                            s.currentPeriodEnd
                          ).toLocaleDateString()}`}
                    </div>
                  )}

                  {status === 'granted' && (
                    <div className="mt-3 text-sm text-violet-300 italic">
                      This access was granted by an admin — no payment required.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-white/20 p-4 text-sm text-zinc-300">
            You currently don’t have any active subscriptions.
          </div>
        )}
      </Section>

      {/* Info Footer */}
      {/* <p className="text-xs text-zinc-500">
        Need to update your plan or payment method? Use the billing portal.
      </p> */}

      <Section
        title="Active Devices"
        right={
          <span className="text-xs text-zinc-400">
            Security & access control
          </span>
        }
      >
        <DevicesSection />
      </Section>

    </div>
  );
}
