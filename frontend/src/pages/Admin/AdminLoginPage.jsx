import React, { useState } from 'react';
import { useAdminLoginMutation } from '../../utils/api';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { useNavigate } from 'react-router-dom';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signIn = useSignIn();
  const navigate = useNavigate();
  const [adminLogin, { isLoading, error }] = useAdminLoginMutation();
  const [formError, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const { accessToken, user } = await adminLogin({ email, password }).unwrap();

      const success = signIn({
        auth: {
          token: accessToken,
          type: 'Bearer',
        },
        refresh: null,
        userState: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_roles: user.user_roles,
        }
      });

      if (!success) {
        throw new Error('Sign-in failed');
      }

      navigate('/admin');
    } catch (err) {
      console.error('Admin login failed:', err);
      setError('Login failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">Admin Panel Login</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-500 text-center">{formError}</p>
          )}
          {error && !formError && (
            <p className="text-sm text-red-500 text-center">
              {error?.data?.error || 'Login failed'}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 transition rounded-md text-white font-medium disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
