// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import Logo from '../../assets/icons/Logo.png';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free'); // 'free' or 'premium'
  const [error, setError] = useState(null);

  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  const handleLogin = (e) => {
    e.preventDefault();
    
    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
      // Create dummy user object
      const user = {
        id: selectedPlan === 'free' ? 1 : 2,
        name: selectedPlan === 'free' ? 'Free User' : 'Premium User',
        email,
        subscriptionTier: selectedPlan, // 'free' or 'premium'
      };
      dispatch(loginSuccess(user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }

    // FUTURE: replace above with real backend call
    // axios.post('/api/login', { email, password }).then(...).catch(...)
  };

  return (
    <div className="h-[100vh] pt-16 w-full bg-black flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-[70vw] h-auto rounded-[24px] overflow-hidden backdrop-blur-xl bg-white/10 grid grid-cols-1 lg:grid-cols-2"
      >
        {/* Left side – Login Form */}
        <div className="p-5 px-10 flex flex-col justify-center">
          <motion.div variants={itemVariants} className="mb-2 flex items-center gap-3">
            <img src={Logo} alt="Logo" className="h-20 w-auto" />
            <span className="text-white/80 text-2xl">Align</span>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-5">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-white/70">Select a user type and enter credentials</p>
          </motion.div>

          {error && <p className="text-red-400 mb-2">{error}</p>}

          <motion.form
            variants={itemVariants}
            className="space-y-4"
            onSubmit={handleLogin}
          >
          
            <div className="flex items-center space-x-4">
              <label className="text-white">
                <input
                  type="radio"
                  name="plan"
                  value="free"
                  checked={selectedPlan === 'free'}
                  onChange={() => setSelectedPlan('free')}
                  className="mr-2"
                />
                Free User
              </label>
              <label className="text-white">
                <input
                  type="radio"
                  name="plan"
                  value="premium"
                  checked={selectedPlan === 'premium'}
                  onChange={() => setSelectedPlan('premium')}
                  className="mr-2"
                />
                Premium User
              </label>
            </div>

           
            <div>
              <label className="block text-white/80 mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your e-mail address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-black/25 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:border-white/30"
                required
              />
            </div>

            
            <div>
              <label className="block text-white/80 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-black/25 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:border-white/30"
                required
              />
            </div>

           
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
          </motion.form>
        </div>

        
        <motion.div
          variants={itemVariants}
          className="p-8 relative bg-cover bg-no-repeat bg-center hidden lg:block"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1581372526706-30d69c143996?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
          }}
        >
          <div className="absolute top-1/2 -translate-y-1/2">
            <motion.h3 variants={itemVariants} className="text-4xl font-bold text-white mb-6">
              What's your
              <br />
              Music Taste.
            </motion.h3>
            <motion.blockquote variants={itemVariants} className="mb-6">
              <p className="text-white/90 text-base mb-4">
                "Sometimes the most productive thing you can do is relax"
              </p>
              <footer>
                <p className="text-white font-semibold">Mark Black</p>
                <p className="text-white/70">Author</p>
              </footer>
            </motion.blockquote>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
