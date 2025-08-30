// src/pages/ManageSubscription.jsx
import React from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useCreateBillingPortalSessionMutation } from '../utils/api';

const money = (minor, currency='INR') =>
  new Intl.NumberFormat('en-IN', { style:'currency', currency }).format((minor||0)/100);

function Section({ title, children, right }) {
  return (
    <section
      className="
        rounded-2xl border border-white/10 
        bg-white/5 backdrop-blur-md 
        p-5 shadow-lg transition
        hover:border-white/20 hover:bg-white/10
      "
    >
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
    active:   'bg-emerald-500/20 text-emerald-300',
    trialing: 'bg-sky-500/20 text-sky-300',
    past_due: 'bg-amber-500/20 text-amber-300',
    unpaid:   'bg-amber-500/20 text-amber-300',
    canceled: 'bg-rose-500/20 text-rose-300',
    paused:   'bg-sky-500/20 text-sky-300',
    none:     'bg-white/10 text-zinc-300',
  };
  const label = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past due',
    unpaid: 'Unpaid',
    canceled: 'Canceled',
    paused: 'Paused',
    none: '—',
  }[status] ?? status;

  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${map[status] || 'bg-white/10 text-zinc-300'}`}>
      {label}
    </span>
  );
}

function YesNo({ yes, label }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
      yes ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-zinc-300'
    }`}>
      {label}: {yes ? 'Yes' : 'No'}
    </span>
  );
}

export default function ManageSubscription() {
  const { summary: s, loading: isLoading, error, isEntitled, baseEntitled, addonEntitled } = useSubscription();
  const [createPortalSession, { isLoading: opening }] = useCreateBillingPortalSessionMutation();

  const { baseItem, addons } = React.useMemo(() => {
    const items = Array.isArray(s?.lineItems) ? s.lineItems : [];
    if (!items.length) return { baseItem: null, addons: [] };
    const sorted = [...items].sort((a,b) => (b.amount||0) - (a.amount||0));
    return { baseItem: sorted[0] || null, addons: sorted.slice(1) };
  }, [s?.lineItems]);

  async function openPortal() {
    try {
      const { url } = await createPortalSession().unwrap();
      if (!url) throw new Error('No portal URL returned');
      window.location.href = url;
    } catch (e) {
      alert(e?.data?.error || e?.message || 'Could not open the billing page');
    }
  }

  if (error) return <div className="mx-auto max-w-4xl p-6 text-red-400">We couldn’t load your subscription. Please try again.</div>;
  if (isLoading || !s) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-64 rounded bg-white/10"></div>
          <div className="h-24 w-full rounded bg-white/10"></div>
        </div>
      </div>
    );
  }

  const status = s.status ?? 'none';
  const currency = s.currency || 'INR';

  const friendlyPeriod = (() => {
    const hasPeriod = Boolean(s.currentPeriodEnd);
    if (!hasPeriod) return '—';
    const date = new Date(s.currentPeriodEnd).toLocaleDateString();
    if (['active','trialing','past_due'].includes(status)) {
      return s.cancelAtPeriodEnd ? `Ends on ${date}` : `Renews on ${date}`;
    }
    return '—';
  })();

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Your Subscription</h1>
          <p className="text-sm text-zinc-400">See your plan, add-ons, and renewal details in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={status} />
          <YesNo yes={isEntitled} label="Access now" />
        </div>
      </div>

      {/* 1) Plan card (friendly) */}
      <Section
        title="Your Plan"
        // right={
        //   <button
        //     onClick={openPortal}
        //     disabled={opening}
        //     className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-sm text-white disabled:opacity-50"
        //   >
        //     {opening ? 'Opening…' : 'Billing & Invoices'}
        //   </button>
        // }
      >
        <div className="grid gap-4 md:grid-cols-1">
          {/* Plan summary card */}
          <div className="rounded-xl ring-1 ring-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-medium">
                {baseItem?.product_name || 'Plan'}
              </div>
              <StatusPill status={status} />
            </div>

            <div className="mt-2 text-sm text-zinc-300">
              {baseItem
                ? `${money(baseItem.amount, currency)} / ${baseItem.interval || (s.plan === 'annual' ? 'year' : 'month')}`
                : 'No plan found'}
            </div>

            <div className="mt-3 text-sm text-zinc-200">
              {friendlyPeriod}
            </div>

            {/* Entitlement line in plain language */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <YesNo yes={baseEntitled} label="Base Plan" />
              <YesNo yes={addonEntitled} label="Add-on Personalized Plan" />
            </div>
          </div>

          {/* Simple explainer (customer-oriented) */}
          {/* <div className="rounded-xl ring-1 ring-white/10 bg-white/5 p-4">
            <div className="text-sm text-zinc-200">
              <p className="font-medium">What this means</p>
              <ul className="mt-2 list-disc pl-4 space-y-1 text-zinc-300">
                <li><span className="text-zinc-200 font-medium">Base access</span> lets you enjoy all the paid content in your plan.</li>
                <li><span className="text-zinc-200 font-medium">Add-on access</span> gives you personalized recommendations and extra guidance.</li>
                <li>You can change plans, update payments, or download invoices from the billing page.</li>
              </ul>
            </div>
          </div> */}
        </div>
      </Section>

      {/* 2) Add-ons as friendly cards */}
      <Section title="Your Add-ons">
        {Array.isArray(addons) && addons.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-1">
            {addons.map((a) => {
              const price = money(a.amount, currency);
              const cycle = a.interval === 'year' ? 'year' : (a.interval || 'month');
              return (
                <div key={a.id} className="rounded-xl ring-1 ring-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-medium">
                      {a.product_name || 'Add-on'}
                    </div>
                    <YesNo yes={addonEntitled} label="In use" />
                  </div>
                  <div className="mt-1 text-sm text-zinc-300">
                    {price} / {cycle}
                  </div>
                  <div className="mt-2 text-sm text-zinc-200">
                    {friendlyPeriod}
                  </div>
                  <div className="mt-3 text-xs text-zinc-400">
                    This add-on enhances your experience with extra value tailored to your needs.
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-white/20 p-4 text-sm text-zinc-300">
            You don’t have any add-ons yet.
          </div>
        )}
      </Section>

      {/* 3) All subscription items (kept for completeness) */}
      <Section title="All Items on Your Subscription">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-400">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {s.lineItems?.map((it) => {
                const isBase = it.id === baseItem?.id;
                return (
                  <tr key={it.id}>
                    <td className="py-2 pr-4">
                      <span className={`rounded px-2 py-0.5 text-xs ${isBase ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-zinc-300'}`}>
                        {isBase ? 'Plan' : 'Add-on'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{it.product_name || '—'}</td>
                    <td className="py-2 pr-4">{money(it.amount, currency)}</td>
                    <td className="py-2 pr-4">{it.interval === 'year' ? 'year' : (it.interval || 'month')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <p className="text-xs text-zinc-500">
        Need to change something? Open the billing page to update payment methods, download invoices, or switch plans.
      </p>
    </div>
  );
}
