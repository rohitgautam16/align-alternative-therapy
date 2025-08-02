// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoginUserMutation, useRegisterUserMutation } from '../../utils/api';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import Logo from '../../assets/images/logo-with-text-removebg-preview.png';
import { useAuthActions } from '../../hooks/useAuthActions';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};
const formVariants = {
  enter:  { x: '-100%', opacity: 0, scale: 0.8 },
  center: { x:    '0%', opacity: 1, scale: 1   },
  exit:   { x:  '100%', opacity: 0, scale: 0.8 },
};

export default function Login() {
  const signIn = useSignIn();
  const navigate = useNavigate();

  // RTK Query mutations
  const { loginAndFetch } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  // const [loginUser,    { isLoading: loggingIn   }] = useLoginUserMutation();
  const [registerUser, { isLoading: registering }] = useRegisterUserMutation();

  // form state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error,    setError]    = useState(null);
  const [isSignup, setIsSignup] = useState(false);

  // ── handle sign in
  const handleLogin = async e => {
  e.preventDefault();
  setError(null);
  if (!email || !password) return setError('Please fill in both fields');

  setIsLoading(true);
  try {
    const { accessToken, refreshToken, user } =
    await loginAndFetch({ email, password });

  // now you have the same payload here again if you need it:
  console.log('Logged in payload:', { accessToken, refreshToken, user });

  } catch (err) {
    // If backend tells us “ACCOUNT_DELETED”, bail out to the restore page
    if (err.originalStatus === 403 || err.data?.code === 'ACCOUNT_DELETED') {
      navigate('/restore', {
        replace: true,
        state: { userId: err.data?.userId || null }
      });
      return;
    }

    setError(err.data?.message || err.error || err.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};

  // ── handle sign up
  const handleSignup = async e => {
    e.preventDefault();
    setError(null);
    if (!fullName || !email || !password) return setError('Please fill in all fields');

    try {
      await registerUser({ fullName, email, password }).unwrap();
      setIsSignup(false);
      setPassword('');
    } catch (err) {
      setError(err.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-black flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-[70vw] grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* ── LEFT COLUMN */}
        <div className="p-5 px-10 flex flex-col justify-center">
          <motion.div variants={itemVariants} className="mb-5 flex items-center gap-3">
            <img src={Logo} alt="Logo" className="h-20" />
          </motion.div>

          <motion.div variants={itemVariants} className="mb-5">
            <h2 className="text-2xl font-bold text-white mb-1">
              {isSignup ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-white/70 text-sm">
              {isSignup
                ? 'Fill in your info to sign up'
                : 'Enter your credentials to continue'}
            </p>
          </motion.div>

          <AnimatePresence initial={false} exitBeforeEnter>
            {isSignup ? (
              // ── SIGN UP FORM
              <motion.form
                key="signup"
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5 }}
                className="space-y-4"
                onSubmit={handleSignup}
              >
                {error && <p className="text-secondary">{error}</p>}

                <div>
                  <label className="block text-white/80 mb-2">Full Name</label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-full bg-black/25 text-white border border-white/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Email</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-full bg-black/25 text-white border border-white/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-full bg-black/25 text-white border border-white/10 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full py-3 rounded-full bg-secondary text-white cursor-pointer font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {registering ? 'Signing up…' : 'Sign up'}
                </button>

                <p className="text-center text-white/70">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="underline hover:text-secondary"
                    onClick={() => setIsSignup(false)}
                  >
                    Sign in
                  </button>
                </p>
              </motion.form>
            ) : (
              // ── LOGIN FORM
              <motion.form
                key="login"
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5 }}
                className="space-y-4"
                onSubmit={handleLogin}
              >
                {error && <p className="text-secondary">{error}</p>}

                <div>
                  <label className="block text-white/80 mb-2">Email</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-full bg-black/25 text-white border border-white/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-full bg-black/25 text-white border border-white/10 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  // disabled={loggingIn}
                  disabled={isLoading}
                  className="w-full py-3 rounded-full bg-secondary cursor-pointer text-white font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {/* {loggingIn ? 'Signing in…' : 'Sign in'} */}
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </button>

                <p className="text-center text-white/70">
                  Don’t have an account?{' '}
                  <button
                    type="button"
                    className="underline hover:text-secondary"
                    onClick={() => setIsSignup(true)}
                  >
                    Sign up
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT COLUMN: illustration */}
        <motion.div
          variants={itemVariants}
          className="hidden lg:block relative bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://cdn.align-alternativetherapy.com/static-pages-media/pexels-shvetsa-4557398.jpg)'
          }}
        >
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center px-8">
              <div className="text-5xl font-medium text-white tracking-wider">ALIGN</div>
              <div className="text-white/80 text-xl mt-2">Mind • Body • Soul</div>
              <blockquote className="text-white/90 text-base mb-4">
                “Sometimes the most productive thing you can do is relax”
              </blockquote>
              <p className="text-white/70 font-semibold">— Mark Black</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
