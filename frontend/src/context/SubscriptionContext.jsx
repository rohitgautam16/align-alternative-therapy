import React from 'react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { useGetSubscriptionSummaryQuery } from '../utils/api';

const SubscriptionContext = React.createContext({
  isEntitled: false,
  baseEntitled: false,
  userTier: null, 
  summary: null,
  loading: true,
  error: null,
});

export function SubscriptionProvider({ children }) {
  const authUser = useAuthUser();
  const userId = authUser?.id ?? 'anon';

  const { data, isLoading, isError, error } = useGetSubscriptionSummaryQuery(userId, {
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });

  const serverIsEntitled   = typeof data?.isEntitled === 'boolean'   ? data.isEntitled   : undefined;
  const serverBaseEntitled = typeof data?.baseEntitled === 'boolean' ? data.baseEntitled : undefined;

  const fallbackIsEntitled = Boolean(
    data?.hasSubscription && ['active', 'trialing', 'past_due'].includes(data?.status)
  );

  const isEntitled   = serverIsEntitled   ?? fallbackIsEntitled;
  const baseEntitled = serverBaseEntitled ?? fallbackIsEntitled;

  const userTier = data?.user_tier ?? null;
  const profileType = data?.profile_type ?? null;

  const isRecommendationOnly = userTier === 2 || profileType === 'recommendations_only';
  const canAccessFullCatalog = !isRecommendationOnly;

  const value = React.useMemo(
    () => ({
      isEntitled,
      baseEntitled,
      userTier,
      isRecommendationOnly,
      canAccessFullCatalog,   
      summary: data ?? null,
      loading: isLoading,
      error: isError ? (error?.data?.error || error?.error || 'Failed to load') : null,
    }),
    [isEntitled, baseEntitled, userTier, isRecommendationOnly, canAccessFullCatalog, data, isLoading, isError, error]
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
