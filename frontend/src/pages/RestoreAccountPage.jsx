// src/pages/RestoreAccountPage.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRestoreAccountMutation } from '../utils/api';
import { motion } from 'framer-motion';

export default function RestoreAccountPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [restoreAccount, { isLoading, isSuccess, error }] = useRestoreAccountMutation();

  // we expect `location.state.userId` to be set
  const userId = location.state?.userId;

  useEffect(() => {
    if (!userId) {
      // if someone lands here directly, send them home
      navigate('/login', { replace: true });
    }
  }, [userId, navigate]);

  const handleRestore = async () => {
    try {
      await restoreAccount().unwrap();
      // after restore, send them to login so they can sign in again
      navigate('/login', { replace: true });
    } catch {
      // leave error in UI
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        className="max-w-md w-full bg-white/10 backdrop-blur-xl p-8 rounded-lg text-center"
      >
        <h1 className="text-2xl font-bold mb-4">Account Deleted</h1>
        <p className="mb-6">
          We noticed your account has been scheduled for deletion.
          You can restore it now, but only within 30 days.
        </p>
        {error && (
          <p className="text-red-400 mb-4">
            {error.data?.error || 'Restore failed'}
          </p>
        )}
        <button
          onClick={handleRestore}
          disabled={isLoading || isSuccess}
          className="w-full py-3 rounded-full bg-green-600 hover:bg-green-500 transition"
        >
          {isLoading ? 'Restoring…' : isSuccess ? 'Restored! Please log in' : 'Restore my account'}
        </button>
      </motion.div>
    </div>
  );
}
