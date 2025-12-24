// src/hooks/useAuthStatus.js
import { useGetProfileQuery } from '../utils/api';

export function useAuthStatus() {
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useGetProfileQuery(undefined, {
    refetchOnReconnect: true,
    refetchOnFocus: false,
  });

  if (isLoading) {
    return { isAuth: null, user: null };
  }

  if (isError && error?.status === 401) {
    return { isAuth: false, user: null };
  }

  if (user) {
    return { isAuth: true, user };
  }

  return { isAuth: false, user: null };
}
