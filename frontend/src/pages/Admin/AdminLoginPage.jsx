import React, { useState } from 'react';
import { useAdminLoginMutation } from '../../utils/api';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Loader2,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLoginPage() {
  // Existing state (kept exactly the same)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signIn = useSignIn();
  const navigate = useNavigate();
  const [adminLogin, { isLoading, error }] = useAdminLoginMutation();
  const [formError, setError] = useState(null);

  // Enhanced UI state
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form submission (kept exactly the same logic)
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

      setIsSuccess(true);
      setTimeout(() => navigate('/admin'), 1000);
    } catch (err) {
      console.error('Admin login failed:', err);
      setError('Login failed: ' + err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-md mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8"
        >
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-3 sm:mb-4"
            >
              <Shield className="text-white" size={20} />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Align Admin Access</h1>
            <p className="text-gray-400 text-xs sm:text-sm">Secure login to admin panel</p>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-600/20 border border-green-600/30 rounded-lg flex items-center gap-2 sm:gap-3"
              >
                <CheckCircle className="text-green-400 flex-shrink-0" size={18} />
                <div>
                  <p className="text-green-300 font-medium text-xs sm:text-sm">Login Successful!</p>
                  <p className="text-green-400/80 text-xs">Redirecting to admin panel...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 ${
                    focusedField === 'email' ? 'text-blue-400' : 'text-gray-500'
                  }`} />
                </div>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading || isSuccess}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-blue-400' : 'text-gray-500'
                  }`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading || isSuccess}
                  className="w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading || isSuccess}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Messages */}
            <AnimatePresence>
              {(formError || (error && !formError)) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 sm:p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-start gap-2 sm:gap-3"
                >
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={14} />
                  <div>
                    <p className="text-red-300 text-xs sm:text-sm font-medium">Authentication Failed</p>
                    <p className="text-red-400/80 text-xs mt-0.5 sm:mt-1">
                      {formError || error?.data?.error || 'Invalid credentials. Please try again.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || isSuccess}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 rounded-lg sm:rounded-xl text-white font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Authenticating...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle size={18} />
                  <span>Login Successful</span>
                </>
              ) : (
                <>
                  <Shield size={18} />
                  <span>Access Admin Panel</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
              <HardDrive size={12} />
              <span>Secure Admin Authentication</span>
            </div>
          </div>
        </motion.div>

        {/* Additional Security Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 sm:mt-6 text-center"
        >
          <p className="text-gray-500 text-xs">
            This is a secure admin area. All login attempts are monitored.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
