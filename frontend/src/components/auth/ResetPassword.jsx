// src/components/auth/ResetPassword.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useResetPasswordMutation } from '../../utils/api';
import Logo from '../../assets/images/logo-with-text-removebg-preview.png';
import Header from '../common/Header';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!token.trim()) {
      setError('Reset token is missing.');
      return;
    }
    if (!password || !confirm) {
      setError('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await resetPassword({ token: token.trim(), newPassword: password }).unwrap();
      setInfo('Password reset successful. You can now log in with your new password.');
      setPassword('');
      setConfirm('');
      // Optionally redirect after a short delay
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(
        err?.data?.error ||
          err?.data?.message ||
          err?.error ||
          'Failed to reset password.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/10 p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex items-center gap-3 mb-4">
          <img src={Logo} alt="Logo" className="h-12" />
          <div className="text-white font-semibold">Align Alternative Therapy</div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Reset your password</h2>
        <p className="text-sm text-white/70 mb-4">
          Choose a new password for your account.
        </p>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        {info && <p className="text-sm text-emerald-300 mb-3">{info}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token (shows if it didn't come from URL or for debug) */}
          {!initialToken && (
            <div>
              <label className="block text-white/80 mb-2">Reset token</label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the token from your email link"
                className="w-full px-4 py-3 rounded-full bg-black/25 text-white border border-white/10 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-white/80 mb-2">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-full bg-black/25 text-white border border-white/10 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-full bg-black/25 text-white border border-white/10 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-secondary text-white font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-4 text-sm text-white/70 cursor-pointer underline hover:text-secondary"
        >
          Back to login
        </button>
      </motion.div>
    </div>
  );
}
