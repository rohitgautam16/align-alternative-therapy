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

  // 🔑 Always resolve entitlements from backend
  const userId = isAuth && user?.id ? user.id : null;

  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetSubscriptionSummaryQuery(userId, {
    skip: !userId,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });

  /* ================= USER / ADMIN COMPUTATION ================= */

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

  return (
    <SubscriptionContext.Provider
      value={{
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
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return React.useContext(SubscriptionContext);
}
