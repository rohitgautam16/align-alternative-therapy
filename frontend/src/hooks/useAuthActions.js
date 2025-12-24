import {
  useLoginUserMutation,
  useLogoutUserMutation,
  useAdminLoginMutation,
  api,
} from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

export function useAuthActions() {
  const [loginUser] = useLoginUserMutation();
  const [logoutUser] = useLogoutUserMutation();
  const [adminLogin] = useAdminLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Login with email/password
   */
  async function loginAndFetch({ email, password }) {
    const { accessToken, user } = await loginUser({ email, password }).unwrap();

    // Drop stale auth-related queries (profile, subscription, etc.)
    dispatch(api.util.resetApiState());

    navigate('/dashboard', { replace: true });

    return { accessToken, user };
  }

  async function adminLoginAndFetch({ email, password }) {
    const { accessToken, user } = await adminLogin({ email, password }).unwrap();

    // hard guard – never trust frontend routing
    if (!user || user.user_roles !== 1) {
      throw new Error('Not authorized as admin');
    }

    // IMPORTANT:
    // hydrate profile so AdminRoute doesn't 401-loop
    dispatch(
      api.util.upsertQueryData('getProfile', undefined, user)
    );

    navigate('/admin/users', { replace: true });

    return { accessToken, user };
  }

  /**
   * Global logout (safe to call from anywhere)
   */
  async function logout({ redirectTo = '/login' } = {}) {
    try {
      // 1) Tell backend to invalidate refresh token
      await logoutUser().unwrap();
    } catch (err) {
      // Backend failure should NOT block logout
      console.warn('Logout API failed:', err);
    } finally {
      // 2) Clear access token cookie
      document.cookie = '_auth=; Path=/; Max-Age=0; SameSite=Lax';

      // 3) Clear all RTK Query cache
      dispatch(api.util.resetApiState());

      // 4) Redirect
      navigate(redirectTo, { replace: true });
    }
  }

  return {
    loginAndFetch,
    adminLoginAndFetch,
    logout,
  };
}
