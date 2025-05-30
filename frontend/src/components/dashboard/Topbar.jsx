// src/components/common/Topbar.jsx
import React, { useState } from 'react';
import { useGetUserQuery } from '../../utils/api';
import { useSidebar } from '../../context/SidebarContext';
import { Menu, LogOut, Search, Home, Bell, User, UserCog, Star, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation, createSearchParams } from 'react-router-dom';

export default function Topbar() {
  const { data: user, isLoading } = useGetUserQuery();
  const { collapsed, toggleSidebar } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const userMenuItems = [
    { label: 'Account', Icon: UserCog },
    { label: 'Profile', Icon: User },
    { label: 'Try Premium', Icon: Star },
    { label: 'Settings', Icon: Settings },
    { label: 'Log Out', Icon: LogOut },
  ];

  const handleSearchChange = (e) => {
    const q = e.target.value;
    
    if (!location.pathname.startsWith('/dashboard/search')) {
      navigate({
        pathname: '/dashboard/search',
        search: createSearchParams({ q }).toString(),
      });
    } else {
      
      navigate({
        pathname: location.pathname,
        search: createSearchParams({ q }).toString(),
      }, { replace: true });
    }
  };

  return (
    <header className="fixed top-1 left-1 right-1 z-40 h-16 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-6 flex items-center justify-between text-white">
      {/* LEFT */}
      <div className="flex items-center space-x-4">
        {isLoading ? (
          <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse" />
        ) : (
          <button
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="p-5 hover:bg-red-800 rounded-full cursor-pointer transition overflow-hidden h-6 w-6 relative"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={collapsed ? 'menu' : 'logout'}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center"
              >
                {collapsed ? (
                  <Menu className="w-6 h-6" />
                ) : (
                  <LogOut className="w-6 h-6 rotate-180" />
                )}
              </motion.div>
            </AnimatePresence>
          </button>
        )}

        <button
          onClick={() => navigate('/')}
          aria-label="Home"
          className="p-2 hover:bg-red-800 rounded-full cursor-pointer transition"
        >
          <Home className="w-6 h-6" />
        </button>
      </div>

      {/* CENTER */}
      <div className="flex-1 flex justify-center">
        {isLoading ? (
          <div className="w-1/3 h-10 bg-gray-600 rounded-full animate-pulse" />
        ) : (
          <div className="relative text-gray-300 focus-within:text-gray-100 w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-white/20 rounded-full text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-red-800"
            />
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center space-x-4 relative">
        {isLoading ? (
          <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse" />
        ) : (
          <>
            <button
              aria-label="Notifications"
              className="p-2 hover:bg-red-800 rounded-full cursor-pointer transition"
            >
              <Bell className="w-6 h-6" />
            </button>

            {/* User */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="User menu"
                className="p-2 hover:bg-red-800 rounded-full cursor-pointer transition"
              >
                <User className="w-6 h-6" />
              </button>

              {/* Dropdown */}
              <div
                className={`
                  absolute right-0 mt-2 w-44 bg-black/80 border border-white bg-opacity-90 rounded-lg shadow-lg
                  transform transition-all duration-150 origin-top-right
                  ${showUserMenu
                    ? 'scale-100 opacity-100'
                    : 'scale-25 opacity-0 pointer-events-none'}
                `}
              >
                {userMenuItems.map(({ label, Icon }) => (
                  <button
                    key={label}
                    onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-2 flex items-center gap-3 text-white cursor-pointer rounded-lg hover:bg-red-700 transition"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
