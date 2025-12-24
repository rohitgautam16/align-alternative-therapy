import React from 'react';
import { useAuthStatus } from '../hooks/useAuthStatus';
import { useGetSubscriptionSummaryQuery } from '../utils/api';

const SubscriptionContext = React.createContext({
  isEntitled: false,
  baseEntitled: false,
  userTier: null,
  summary: null,
  loading: true,
  error: null,
  isRecommendationOnly: false,
  canAccessFullCatalog: true,
});

export function SubscriptionProvider({ children }) {
  const { isAuth, user } = useAuthStatus();

  const isAdmin = user?.user_roles === 1;

  // 🔒 Only NON-admin users get subscription queries
  const userId =
    isAuth && user?.id && !isAdmin
      ? user.id
      : null;

  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetSubscriptionSummaryQuery(userId, {
    skip: !userId, // ✅ admin-safe
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });

  // ---------- ADMIN DEFAULTS ----------
  const adminValue = {
    isEntitled: false,
    baseEntitled: false,
    userTier: null,
    isRecommendationOnly: false,
    canAccessFullCatalog: true,
    summary: null,
    loading: false,
    error: null,
  };

  // ---------- USER COMPUTATION ----------
  const serverIsEntitled =
    typeof data?.isEntitled === 'boolean'
      ? data.isEntitled
      : undefined;

  const serverBaseEntitled =
    typeof data?.baseEntitled === 'boolean'
      ? data.baseEntitled
      : undefined;

  const fallbackIsEntitled = Boolean(
    data?.hasSubscription &&
      ['active', 'trialing', 'past_due'].includes(data?.status)
  );

  const isEntitled = serverIsEntitled ?? fallbackIsEntitled;
  const baseEntitled = serverBaseEntitled ?? fallbackIsEntitled;

  const userTier = data?.user_tier ?? null;
  const profileType = data?.profile_type ?? null;

  const isRecommendationOnly =
    userTier === 2 || profileType === 'recommendations_only';

  const canAccessFullCatalog = !isRecommendationOnly;

  const userValue = {
    isEntitled,
    baseEntitled,
    userTier,
    isRecommendationOnly,
    canAccessFullCatalog,
    summary: data ?? null,
    loading: isLoading,
    error: isError
      ? error?.data?.error || error?.error || 'Failed to load'
      : null,
  };

  const value = isAdmin ? adminValue : userValue;

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return React.useContext(SubscriptionContext);
}
