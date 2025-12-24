// src/hooks/useCanAccessContent.js
import { useSubscription } from '../context/SubscriptionContext';

export default function useCanAccessContent() {
  const { summary } = useSubscription();
  const tier = summary?.user_tier;
  const permissions = tier?.permissions || {};

  const canAccessContent = (item) => {
    if (!item) return false;
    if (item.is_free) return true;
    if (item.paid === 1 && !permissions.can_access_paid_playlists) return false;
    return true;
  };
  
  const canAccessCTA = () => {
    return tier?.id > 1; // 2 or 3
  };

  return { canAccessContent, canAccessCTA, permissions, tier };
}
