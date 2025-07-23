// src/components/admin/AdminTopbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, createSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Menu, 
  LogOut, 
  Settings, 
  Bell, 
  User, 
  X,
  Home,
  Shield,
  ChevronDown,
  Clock
} from 'lucide-react';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { useLogoutUserMutation } from '../../utils/api';
import { useSidebar } from '../../context/SidebarContext';

export default function AdminTopbar() {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();
  const signOut = useSignOut();
  const auth = useAuthUser();
  const user = auth;
  const [logoutUser] = useLogoutUserMutation();
  const menuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current time
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch (e) {
      console.error('Server‑side logout failed', e);
    } finally {
      signOut();
      navigate('/admin-login', { replace: true });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black backdrop-blur-xl border-b border-gray-700/50 m-2 rounded-xl text-white flex items-center justify-between px-4 sm:px-6 z-20 shadow-lg">
      {/* LEFT: Navigation & Branding */}
      <div className="flex items-center space-x-3">
        {/* Sidebar Toggle with animated hamburger */}
        <motion.button
          onClick={toggleSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle sidebar"
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={collapsed ? 'collapsed' : 'expanded'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {collapsed ? <Menu size={20} /> : <X size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Home Button */}
        <motion.button
          onClick={() => navigate('/admin')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Admin Dashboard Home"
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
        >
          <Home size={20} />
        </motion.button>

        {/* Brand/Title */}
        <div className="hidden sm:flex items-center gap-1">
          <Shield className="text-blue-400" size={20} />
          <span className="font-semibold text-md">Align Admin Panel</span>
        </div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:block ml-6"
        >
          <p className="text-sm text-gray-300">
            {getGreeting()}, <span className="font-medium text-white">{user?.full_name?.split(' ')[0] || 'Admin'}</span> 👋
          </p>
        </motion.div>
      </div>

      {/* RIGHT: Actions & User */}
      <div className="flex items-center space-x-2">
        {/* Time Display (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-700/30 rounded-lg">
          <Clock size={16} className="text-gray-400" />
          <span className="text-sm text-gray-300">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Notifications"
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200 relative"
        >
          {/* <Bell size={20} /> */}
          {/* Notification dot */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
        </motion.button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <motion.button
            onClick={() => setShowMenu(!showMenu)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="User menu"
            className="flex items-center gap-2 p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-gray-400">
                {user?.user_roles === 1 ? 'Super Admin' : 'Admin'}
              </p>
            </div>
            <ChevronDown 
              size={16} 
              className={`transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} 
            />
          </motion.button>

          {/* User Dropdown */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-56 bg-black/70 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden"
              >
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-700/50">
                  <p className="font-medium text-white">{user?.full_name || 'Admin User'}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                  <p className="text-xs text-blue-400 mt-1">
                    {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Admin'}!
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  {/* Settings - Commented out for now */}
                  {/* 
                  <Link
                    to="/admin/settings"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                  */}
                  
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
