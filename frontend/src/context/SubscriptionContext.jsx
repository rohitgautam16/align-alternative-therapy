// src/context/SubscriptionContext.jsx
import React from 'react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { useGetSubscriptionSummaryQuery } from '../utils/api';

/**
 * Context shape:
 * {
 *   isEntitled: boolean,        // active/trialing(/past_due) overall entitlement
 *   baseEntitled: boolean,      // can access base (paid) content
 *   addonEntitled: boolean,     // can access Personalized add-on features
 *   summary: object|null,       // full summary payload
 *   loading: boolean,
 *   error: string|null,
 * }
 */
const SubscriptionContext = React.createContext({
  isEntitled: false,
  baseEntitled: false,
  addonEntitled: false,
  summary: null,
  loading: true,
  error: null,
});

export function SubscriptionProvider({ children }) {
  const authUser = useAuthUser();
  const userId = authUser?.id ?? 'anon'; // used only to key RTK cache per-user

  // IMPORTANT: pass userId so RTK caches per user, even if the URL doesn't change
  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetSubscriptionSummaryQuery(userId, {
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });

  // Prefer backend-computed flags; fall back to legacy logic if absent
  const serverIsEntitled   = typeof data?.isEntitled === 'boolean'   ? data.isEntitled   : undefined;
  const serverBaseEntitled = typeof data?.baseEntitled === 'boolean' ? data.baseEntitled : undefined;
  const serverAddonEntitled= typeof data?.addonEntitled === 'boolean'? data.addonEntitled: undefined;

  const fallbackIsEntitled = Boolean(
    data?.hasSubscription && ['active', 'trialing', 'past_due'].includes(data?.status)
  );

  const isEntitled   = serverIsEntitled   ?? fallbackIsEntitled;
  const baseEntitled = serverBaseEntitled ?? fallbackIsEntitled;            // conservative fallback
  const addonEntitled= serverAddonEntitled?? (fallbackIsEntitled && !!data?.hasAddon);

  const value = React.useMemo(
    () => ({
      isEntitled,
      baseEntitled,
      addonEntitled,
      summary: data ?? null,
      loading: isLoading,
      error: isError ? (error?.data?.error || error?.error || 'Failed to load') : null,
    }),
    [isEntitled, baseEntitled, addonEntitled, data, isLoading, isError, error]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return React.useContext(SubscriptionContext);
}
