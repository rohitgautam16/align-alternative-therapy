// src/hooks/useAuthActions.js
import { useLoginUserMutation } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import useSignIn from 'react-auth-kit/hooks/useSignIn';

export function useAuthActions() {
  const [loginUser] = useLoginUserMutation();
  const signIn       = useSignIn();
  const navigate     = useNavigate();

  /**
   * Attempt to log in with email/password.
   * @returns {Promise<{accessToken:string,refreshToken:string,user:object}>}
   *          Resolves to the payload on success; throws on failure.
   */
  async function loginAndFetch({ email, password }) {
    // 1) call RTK Query
    const { accessToken, refreshToken, user } = await loginUser({ email, password }).unwrap();

    // 2) persist via react‑auth‑kit
    const ok = signIn({
      auth:      { token: accessToken, type: 'Bearer' },
      refresh:    refreshToken || '',
      userState:  user
    });
    if (!ok) throw new Error('Sign‑in failed');

    // 3) redirect (optional, you can leave that to the caller)
    navigate('/dashboard', { replace: true });

    // 4) return the raw payload for anyone who called this fn
    return { accessToken, refreshToken, user };
  }

  return { loginAndFetch };
}
