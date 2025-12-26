// src/components/common/Topbar.jsx
import React, { useState } from 'react';
import {useGetUserQuery } from '../../utils/api';
import { useDispatch } from 'react-redux';
import { useSidebar } from '../../context/SidebarContext';
import {
  Menu,
  LogOut,
  Search,
  Home,
  User,
  Star,
  CreditCard,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation, createSearchParams, Link } from 'react-router-dom';
import { useAuthActions } from '../../hooks/useAuthActions';
import { useSubscription } from '../../context/SubscriptionContext';

export default function Topbar() {
  const { data: user, isLoading } = useGetUserQuery();
  const { collapsed, toggleSidebar, toggleDrawer } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // const signOut = useSignOut();
  const { logout } = useAuthActions();

  // ✅ consume latest subscription context
  const { summary, baseEntitled, addonEntitled, isEntitled, loading, error } = useSubscription();
  const { isRecommendationOnly } = useSubscription();

  // Show "Manage subscription" if user has any entitlement or active subscription
  const showManage = Boolean(isEntitled);

  const handleLogout = () => {
    logout(); 
  };


  const handleSearchChange = (e) => {
    const q = e.target.value;
    const base = '/dashboard/search';
    const params = createSearchParams({ q }).toString();
    if (!location.pathname.startsWith(base)) {
      navigate({ pathname: base, search: params });
    } else {
      navigate({ pathname: location.pathname, search: params }, { replace: true });
    }
  };

  const userMenuItems = [
    { label: 'Profile', Icon: User, to: '/dashboard/profile' },
    showManage
      ? { label: 'My Subscription', Icon: CreditCard, to: '/dashboard/manage-subscription' }
      : { label: 'Try Premium', Icon: Star, to: '/pricing' },
    { label: 'Log Out', Icon: LogOut, action: handleLogout },
  ];

  return (
    <header className="fixed top-1 left-1 right-1 z-50 h-16 bg-black backdrop-blur-sm rounded-lg px-6 flex items-center justify-between text-white">
      {/* LEFT */}
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse" />
        ) : (
          <>
            {/* Mobile hamburger */}
            <button
              onClick={toggleDrawer}
              aria-label="Open menu"
              className="p-2 hover:bg-secondary rounded-full transition md:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="p-2 hover:bg-secondary rounded-full transition hidden md:inline-flex"
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

            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Home"
              className="hidden sm:inline-flex ml-1 p-2 hover:bg-secondary rounded-full transition"
            >
              <Home size={20} />
            </button>

          </>
        )}
      </div>

      {/* CENTER */}
      {!isRecommendationOnly && (
          <div className="flex-1 flex justify-center">
            {isLoading ? (
              <div className="w-1/3 h-10 bg-gray-600 rounded-full animate-pulse" />
            ) : (
              <div className="relative text-gray-300 focus-within:text-gray-100 w-2/3 sm:w-1/3 max-md:w-2/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 bg-white/20 rounded-full text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary/50"
                />
              </div>
            )}
          </div>
        )}

      {/* RIGHT */}
      <div className="flex items-center space-x-4 relative">
        {isLoading ? (
          <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse" />
        ) : (
          <>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="User menu"
                className="p-2 hover:bg-secondary rounded-full transition"
              >
                <User size={20} />
              </button>

              <div
                className={`absolute right-0 mt-2 w-48 bg-black/80 border border-white/20 rounded-lg shadow-lg transform transition-all duration-150 origin-top-right ${
                  showUserMenu ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
                }`}
              >
                {loading && (
                  <div className="px-4 py-2 text-xs text-gray-400">
                    Checking membership…
                  </div>
                )}
                {error && (
                  <div className="px-4 py-2 text-xs text-red-400">
                    Could not refresh membership
                  </div>
                )}
                {userMenuItems.map(({ label, Icon, to, action }) =>
                  to ? (
                    <Link
                      key={label}
                      to={to}
                      onClick={() => setShowUserMenu(false)}
                      className="w-full px-4 py-2 flex items-center gap-3 text-white rounded-lg hover:bg-secondary transition"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{label}</span>
                    </Link>
                  ) : (
                    <button
                      key={label}
                      onClick={() => {
                        setShowUserMenu(false);
                        action?.();
                      }}
                      className="w-full px-4 py-2 flex items-center gap-3 text-left text-white rounded-lg hover:bg-secondary transition"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{label}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
