// src/components/common/Topbar.jsx
import React, { useState } from 'react'
import { useGetUserQuery, useLogoutUserMutation } from '../../utils/api'
import { useSidebar } from '../../context/SidebarContext'
import {
  Menu,
  LogOut,
  Search,
  Home,
  Bell,
  User,
  UserCog,
  Star,
  Settings
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, useLocation, createSearchParams, Link } from 'react-router-dom'

import useSignOut from 'react-auth-kit/hooks/useSignOut';

export default function Topbar() {
  const { data: user, isLoading } = useGetUserQuery()
  const { collapsed, toggleSidebar } = useSidebar()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const signOut = useSignOut()
  const [logoutUser] = useLogoutUserMutation()

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap()
    } catch (e) {
      console.error('Server‐side logout failed', e)
    } finally {
      signOut()                      
      navigate('/login', { replace: true })
    }
  }

  const handleSearchChange = (e) => {
    const q = e.target.value
    const base = '/dashboard/search'
    const params = createSearchParams({ q }).toString()

    if (!location.pathname.startsWith(base)) {
      navigate({ pathname: base, search: params })
    } else {
      navigate(
        { pathname: location.pathname, search: params },
        { replace: true }
      )
    }
  }

  const userMenuItems = [
    { label: 'Account', Icon: UserCog },
    { label: 'Profile', Icon: User },
    { label: 'Try Premium', Icon: Star },
    { label: 'Settings', Icon: Settings },
    { label: 'Log Out', Icon: LogOut },
  ]

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
            className="p-2 hover:bg-red-800 rounded-full transition"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={collapsed ? 'open' : 'close'}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {collapsed ? <Menu size={20} /> : <LogOut size={20} className="rotate-180" />}
              </motion.div>
            </AnimatePresence>
          </button>
        )}

        <button
          onClick={() => navigate('/')}
          aria-label="Home"
          className="p-2 hover:bg-red-800 rounded-full transition"
        >
          <Home size={20} />
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
              className="p-2 hover:bg-red-800 rounded-full transition"
            >
              <Bell size={20} />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                aria-label="User menu"
                className="p-2 hover:bg-red-800 rounded-full transition"
              >
                <User size={20} />
              </button>

              <div
              className={`
                absolute right-0 mt-2 w-44 bg-black/80 border border-white rounded-lg shadow-lg
                transform transition-all duration-150 origin-top-right
                ${showUserMenu
                  ? 'scale-100 opacity-100'
                  : 'scale-25 opacity-0 pointer-events-none'}
              `}
            >
              {userMenuItems.map(({ label, Icon }) => {
                const commonClasses = "w-full px-4 py-2 flex items-center gap-3 text-white cursor-pointer rounded-lg hover:bg-red-700 transition";
                
                if (label === 'Try Premium') {
                  return (
                    <Link
                      key={label}
                      to="/pricing"
                      onClick={() => setShowUserMenu(false)}
                      className={commonClasses}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{label}</span>
                    </Link>
                  );
                }

                if (label === 'Profile') {
                  return (
                    <Link
                      key={label}
                      to="/dashboard/profile"
                      onClick={() => setShowUserMenu(false)}
                      className={commonClasses}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{label}</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={label}
                    onClick={() => {
                      setShowUserMenu(false);
                      if (label === 'Log Out') handleLogout();
                    }}
                    className={commonClasses}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{label}</span>
                  </button>
                );
              })}
            </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
