// src/components/admin/AdminTopbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu,
  LogOut,
  X,
  Home,
  Shield,
  ChevronDown,
  Clock,
} from 'lucide-react';

import { useSidebar } from '../../context/SidebarContext';
import { useGetProfileQuery } from '../../utils/api';
import { useAuthActions } from '../../hooks/useAuthActions';

export default function AdminTopbar() {
  const navigate = useNavigate();
  const { collapsed, toggleSidebar, toggleDrawer } = useSidebar();
  const { logout } = useAuthActions();

  const { data: user } = useGetProfileQuery(); // ✅ server-authoritative
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout({ redirectTo: '/admin-login' });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName =
    user?.full_name?.split(' ')[0] || 'Admin';

  const roleLabel =
    user?.user_roles === 1 ? 'Super Admin' : 'Admin';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black backdrop-blur-xl border-b border-gray-700/50 m-2 rounded-xl text-white flex items-center justify-between px-4 sm:px-6 z-50 shadow-lg">

      {/* LEFT */}
      <div className="flex items-center gap-3">
        {/* Mobile */}
        <motion.button
          onClick={toggleDrawer}
          className="p-2 hover:bg-gray-700/50 rounded-lg md:hidden"
        >
          <Menu size={20} />
        </motion.button>

        {/* Desktop */}
        <motion.button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-700/50 rounded-lg hidden md:inline-flex"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={collapsed ? 'open' : 'close'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {collapsed ? <Menu size={20} /> : <X size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <button
          onClick={() => navigate('/admin')}
          className="p-2 hover:bg-gray-700/50 rounded-lg"
        >
          <Home size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <Shield className="text-blue-400" size={20} />
          <span className="font-semibold">Align Admin Panel</span>
        </div>

        <div className="hidden lg:block ml-6 text-sm text-gray-300">
          {getGreeting()},{' '}
          <span className="text-white font-medium">
            {displayName}
          </span> 👋
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-700/30 rounded-lg">
          <Clock size={16} className="text-gray-400" />
          <span className="text-sm text-gray-300">
            {currentTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="flex items-center gap-2 p-2 hover:bg-gray-700/50 rounded-lg"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
              {(user?.full_name || user?.email || 'A')[0].toUpperCase()}
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-gray-400">{roleLabel}</p>
            </div>

            <ChevronDown
              size={16}
              className={`transition-transform ${showMenu ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-56 bg-black/70 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl"
              >
                <div className="px-4 py-3 border-b border-gray-700/50">
                  <p className="font-medium">{user?.full_name}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                  <p className="text-xs text-blue-400 mt-1">
                    {roleLabel}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-red-600/20 hover:text-red-400"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
