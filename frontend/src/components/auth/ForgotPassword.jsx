// src/components/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForgotPasswordMutation } from '../../utils/api';
import Logo from '../../assets/images/logo-with-text-removebg-preview.png';
import Header from '../common/Header';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    try {
      await forgotPassword(email.trim()).unwrap();
      setInfo('If that email exists, a reset link has been sent.');
    } catch (err) {
      setError(
        err?.data?.error ||
          err?.data?.message ||
          err?.error ||
          'Something went wrong.'
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

        <h2 className="text-xl font-bold text-white mb-2">
          Forgot your password ?
        </h2>
        <p className="text-sm text-white/70 mb-4">
          Enter your email and we’ll send you a link to reset your password.
        </p>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        {info && <p className="text-sm text-emerald-300 mb-3">{info}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-full bg-black/25 text-white border border-white/10 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-secondary text-white font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Sending link…' : 'Send reset link'}
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
