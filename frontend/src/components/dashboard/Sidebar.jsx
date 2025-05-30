// src/components/dashboard/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Home,
  Settings,
  LogOut,
} from 'lucide-react';
import { MdLibraryMusic, MdFavorite, MdQueueMusic } from 'react-icons/md';
import { useGetCategoriesQuery } from '../../utils/api';
import { useSidebar } from '../../context/SidebarContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useGetCategoriesQuery();
  const categories = Array.isArray(data) ? data : data?.categories || [];
  const { collapsed, toggleSidebar } = useSidebar();

  const [isExploreOpen, setIsExploreOpen] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  useEffect(() => {
    // console.log('Categories raw data:', categories);
  }, [categories]);

  const dropdownVariants = {
    closed: { height: 0, opacity: 0 },
    open: { height: 'auto', opacity: 1 },
  };

  
  const handleExpand = (fn) => {
    if (collapsed) toggleSidebar();
    fn();
  };

  React.useEffect(() => {
   if (collapsed) {
     setIsExploreOpen(false);
     setIsLibraryOpen(false);
   }
 }, [collapsed]);

  return (
    <aside
      className={`
        flex flex-col rounded-lg overflow-y-auto bg-black text-white
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Scrollable area */}
      <div className="flex-grow overflow-y-auto px-2 py-4 space-y-2">
        
        <NavLink
          to="/dashboard"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg text-lg ${
              isActive ? 'bg-red-700' : 'hover:bg-red-700'
            }`
          }
        >
          <Home size={20} />
          {!collapsed && 'Home'}
        </NavLink>

       
        <div>
          <button
            onClick={() =>
              handleExpand(() => setIsExploreOpen((o) => !o))
            }
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <span className="flex items-center gap-2 text-lg">
              <MdLibraryMusic size={20} />
              {!collapsed && 'Explore'}
            </span>
            {!collapsed &&
              (isExploreOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              ))}
          </button>

          <motion.div
            initial="closed"
            animate={isExploreOpen ? 'open' : 'closed'}
            variants={dropdownVariants}
            transition={{ duration: 0.3 }}
            className="overflow-hidden ml-6 mt-2"
          >
            {isLoading && (
              <p className="px-4 py-2 text-gray-400 text-sm">
                Loading...
              </p>
            )}
            {isError && (
              <p className="px-4 py-2 text-red-500 text-sm">
                Error: {error?.toString() || 'Failed to load'}
              </p>
            )}
            {!isLoading &&
              !isError &&
              categories.map((cat) => (
                <NavLink
                  key={cat.id}
                  to={`/dashboard/category/${cat.slug}`}
                  onClick={() => handleExpand(() => {})}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg text-gray-300 hover:bg-red-700 hover:text-white ${
                      isActive ? 'bg-red-700 text-white' : ''
                    }`
                  }
                >
                  {cat.title}
                </NavLink>
              ))}
          </motion.div>
        </div>

       
        <div>
          <button
            onClick={() =>
              handleExpand(() => setIsLibraryOpen((o) => !o))
            }
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <span className="flex items-center gap-2 text-lg">
              <MdFavorite size={20} />
              {!collapsed && 'Library'}
            </span>
            {!collapsed &&
              (isLibraryOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              ))}
          </button>

          <motion.div
            initial="closed"
            animate={isLibraryOpen ? 'open' : 'closed'}
            variants={dropdownVariants}
            transition={{ duration: 0.3 }}
            className="overflow-hidden ml-6 mt-2"
          >
            <NavLink
              to="/dashboard/recently-played"
              onClick={() => handleExpand(() => {})}
              className="block px-4 py-2 text-gray-300 rounded-lg hover:bg-red-700 hover:text-white"
            >
              <MdQueueMusic className="inline-block mr-2" />{' '}
              {!collapsed && 'Recently Played'}
            </NavLink>
            <NavLink
              to="/dashboard/favorite-songs"
              onClick={() => handleExpand(() => {})}
              className="block px-4 py-2 text-gray-300 rounded-lg hover:bg-red-700 hover:text-white"
            >
              <MdFavorite className="inline-block mr-2" />{' '}
              {!collapsed && 'Favorite Songs'}
            </NavLink>
            <NavLink
              to="/dashboard/my-playlists"
              onClick={() => handleExpand(() => {})}
              className="block px-4 py-2 text-gray-300 rounded-lg hover:bg-red-700 hover:text-white"
            >
              <MdLibraryMusic className="inline-block mr-2" />{' '}
              {!collapsed && 'My Playlists'}
            </NavLink>
          </motion.div>
        </div>
      </div>

     
      <div className="shrink-0 border-t border-gray-700 p-2 space-y-2">
        <button
         onClick={() => handleExpand(() => navigate('/dashboard/settings'))}
         className={`
           flex items-center gap-2 py-2 rounded-lg hover:bg-red-700 transition w-full text-lg
           ${collapsed ? 'justify-center px-0' : 'px-4'}
         `}
       >
         <Settings size={20} />
         {!collapsed && 'Settings'}
       </button>
        <button
         onClick={() =>
           handleExpand(() => {
             navigate('/logout');
           })
         }
         className={`
           flex items-center gap-2 py-2 rounded-lg hover:bg-red-700 transition w-full text-lg
           ${collapsed ? 'justify-center px-0' : 'px-4'}
         `}
       >
         <LogOut size={20} />
         {!collapsed && 'Logout'}
       </button>
      </div>
    </aside>
  );
}
