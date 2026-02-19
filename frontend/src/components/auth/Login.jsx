// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoginUserMutation, useRegisterUserMutation } from '../../utils/api';
import Logo from '../../assets/images/logo-with-text-removebg-preview.png';
import { useAuthActions } from '../../hooks/useAuthActions';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, staggerChildren: 0.15 }
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
  },
};

const formVariants = {
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

export default function Login() {
  const navigate = useNavigate();
  const { loginAndFetch } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [registerUser, { isLoading: registering }] = useRegisterUserMutation();

  // form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── handle sign in
  const handleLogin = async e => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return setError('Please fill in both fields');
    setIsLoading(true);
    try {
      const { accessToken, refreshToken, user } = await loginAndFetch({
        email,
        password
      });
      console.log('Logged in payload:', { accessToken, refreshToken, user });
    } catch (err) {
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
    if (!fullName || !email || !password)
      return setError('Please fill in all fields');
    try {
      await registerUser({ fullName, email, password }).unwrap();
      setIsSignup(false);
      setPassword('');
    } catch (err) {
      setError(err.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-black">
      {/* ── LEFT COLUMN: Brand & Image */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center rounded-r-4xl bg-no-repeat"
          style={{
            backgroundImage: `url('https://cdn.align-alternativetherapy.com/static-pages-media/pexels-shvetsa-4557398.jpg')`,
          }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-bl from-black/40 via-transparent to-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          {/* Top: Tagline */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <p className="text-md font-medium tracking-[0.3em] uppercase">
              Mind • Body • Soul
            </p>
          </motion.div>

          {/* Bottom: Logo & Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-8xl font-bold tracking-tight">ALIGN</h1>
            <div className="max-w-md space-y-2">
              <p className="text-base leading-relaxed opacity-90">
                "Sometimes the most productive thing you can do is relax"
              </p>
              <p className="text-sm opacity-70">— Mark Black</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── RIGHT COLUMN: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-black">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md space-y-8"
        >
          {/* Logo for mobile */}
          <motion.div variants={itemVariants} className="lg:hidden text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
              <img src={Logo} alt="Align Logo" className="h-14 mx-auto mb-6" />
            </div>
            <p className="text-xs text-white/60 tracking-[0.2em] uppercase mb-8">
              ALIGN Alternative Therapy
            </p>
          </motion.div>

          {/* Logo for desktop */}
          <motion.div variants={itemVariants} className="hidden lg:block text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
                <img src={Logo} alt="Align Logo" className="h-14 mx-auto mb-6" />
            </div>
            <p className="text-xs text-white/60 tracking-[0.2em] uppercase">
              ALIGN Alternative Therapy
            </p>
          </motion.div>

          {/* Form Header */}
          <motion.div variants={itemVariants} className="text-center space-y-2">
            <h2 className="text-3xl font-semibold text-white">
              {isSignup ? 'Create Account' : 'Welcome to ALIGN'}
            </h2>
            <p className="text-sm text-white/60">
              {isSignup
                ? 'Fill in your info to get started'
                : 'Enter your credentials to continue'}
            </p>
          </motion.div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {isSignup ? (
              // ── SIGN UP FORM
              <motion.form
                key="signup"
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleSignup}
                className="space-y-6"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3.5 rounded-md bg-white/5 text-white border border-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3.5 rounded-md bg-white/5 text-white border border-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3.5 rounded-md bg-white/5 text-white border border-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {showPassword ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        )}
                      </svg>
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={registering}
                  className="w-full py-3.5 rounded-md cursor-pointer text-whiteblack font-semibold bg-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                >
                  {registering ? 'Creating Account...' : 'Sign Up'}
                </motion.button>

                <motion.p
                  variants={itemVariants}
                  className="text-center text-sm text-white/60"
                >
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignup(false)}
                    className="text-secondary hover:text-amber-400 cursor-pointer font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </motion.p>
              </motion.form>
            ) : (
              // ── LOGIN FORM
              <motion.form
                key="login"
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3.5 rounded-md bg-white/5 text-white border border-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3.5 rounded-md bg-white/5 text-white border border-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {showPassword ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        )}
                      </svg>
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-end"
                >
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-white/60 hover:text-secondary cursor-pointer transition-colors"
                  >
                    Forgot Password ?
                  </button>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-md bg-secondary text-black font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                >
                  {isLoading ? 'Signing in...' : 'Log In'}
                </motion.button>

                <motion.p
                  variants={itemVariants}
                  className="text-center text-sm text-white/60"
                >
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignup(true)}
                    className="text-secondary hover:text-amber-400 font-medium cursor-pointer transition-colors"
                  >
                    Sign up
                  </button>
                </motion.p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}