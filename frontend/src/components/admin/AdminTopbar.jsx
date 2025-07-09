// src/components/admin/AdminTopbar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, createSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, LogOut, Settings, Bell, User } from 'lucide-react';
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
  const auth = useAuthUser();              // <-- get user info
  const user = auth;                     // e.g. { id, email, full_name, user_roles }
  const [logoutUser] = useLogoutUserMutation();

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

  const handleSearchChange = (e) => {
    const q = e.target.value;
    const base = '/admin/search';
    const params = createSearchParams({ q }).toString();
    const target = { pathname: base, search: params };

    if (!location.pathname.startsWith(base)) {
      navigate(target);
    } else {
      navigate(target, { replace: true });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black m-2 rounded-lg text-white flex items-center justify-between px-6 z-20 shadow-md">
      {/* LEFT: Sidebar toggle & Home & Greeting */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="p-2 hover:bg-gray-700 rounded-full transition"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={collapsed ? 'open' : 'close'}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {collapsed ? <Menu size={20} /> : <Menu size={20} />}
            </motion.div>
          </AnimatePresence>
        </button>

        <button
          onClick={() => navigate('/admin')}
          aria-label="Admin Dashboard Home"
          className="p-2 hover:bg-gray-700 rounded-full transition"
        >
          <User size={20} />
        </button>

        {/* Modern welcome note */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="ml-4 text-lg font-medium text-gray-200"
        >
          Hi, {user?.full_name || 'Admin'} 👋
          {/* <p className='text-[0.8rem] font-extralight text-gray-200'>Welcome to Align Alternative Therapy Admin Panel</p> */}
        </motion.div>
      </div>

      {/* RIGHT: Notifications & User Menu */}
      <div className="flex items-center space-x-4 relative">
        <button
          aria-label="Notifications"
          className="p-2 hover:bg-gray-700 rounded-full transition"
        >
          <Bell size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Admin menu"
            className="p-2 hover:bg-gray-700 rounded-full transition"
          >
            <User size={20} />
          </button>

          <div
            className={`
              absolute right-0 mt-2 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-lg
              transform transition-all duration-150 origin-top-right
              ${showMenu ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'}
            `}
          >
            <Link
              to="/admin/settings"
              onClick={() => setShowMenu(false)}
              className="w-full px-4 py-2 flex items-center gap-3 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Settings</span>
            </Link>
            <button
              onClick={() => {
                setShowMenu(false);
                handleLogout();
              }}
              className="w-full px-4 py-2 flex items-center gap-3 text-white rounded-lg hover:bg-red-700 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
