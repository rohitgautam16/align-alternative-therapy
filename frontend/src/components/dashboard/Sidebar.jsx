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
  User,
  Newspaper,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { MdLibraryMusic, MdFavorite, MdQueueMusic } from 'react-icons/md';
import { useGetCategoriesQuery } from '../../utils/api';
import { useSidebar } from '../../context/SidebarContext';
import { useSubscription } from '../../context/SubscriptionContext';

export default function Sidebar({ className = '' }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useGetCategoriesQuery();
  const categories = Array.isArray(data) ? data : data?.categories || [];
  const { collapsed, toggleSidebar } = useSidebar();

  const [isExploreOpen, setIsExploreOpen] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isBlogsOpen, setIsBlogsOpen] = useState(false);
  const { isRecommendationOnly } = useSubscription();

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
        flex flex-col rounded-lg overflow-y-auto bg-black text-white h-full
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
              isActive ? 'bg-secondary' : 'hover:bg-secondary/70'
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
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-secondary transition"
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
            className="overflow-hidden ml-6"
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
                    `block px-4 py-2 rounded-lg text-gray-300 hover:bg-secondary/70 hover:text-white ${
                      isActive ? 'bg-secondary text-white' : ''
                    }`
                  }
                >
                  {cat.title}
                </NavLink>
              ))}
          </motion.div>
        </div>

       {!isRecommendationOnly && (
        <div>
          <button
            onClick={() =>
              handleExpand(() => setIsLibraryOpen((o) => !o))
            }
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-secondary/70 transition"
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
              to="/dashboard/user-activity/recent-plays"
              onClick={() => handleExpand(() => {})}
              className="block px-4 py-2 text-gray-300 rounded-lg hover:bg-secondary/70 hover:text-white"
            >
              <MdQueueMusic className="inline-block mr-2" />{' '}
              {!collapsed && 'Recently Played'}
            </NavLink>
            {/* <NavLink
              to="/dashboard/favorite-songs"
              onClick={() => handleExpand(() => {})}
              className="block px-4 py-2 text-gray-300 rounded-lg hover:bg-red-700 hover:text-white"
            >
              <MdFavorite className="inline-block mr-2" />{' '}
              {!collapsed && 'Favorite Songs'}
            </NavLink> */}
            <NavLink
              to="/dashboard/user-playlists"
              onClick={() => handleExpand(() => {})}
              className="block px-4 py-2 text-gray-300 rounded-lg hover:bg-secondary/70 hover:text-white"
            >
              <MdLibraryMusic className="inline-block mr-2" />{' '}
              {!collapsed && 'My Playlists'}
            </NavLink>
          </motion.div>
        </div>
       )}
      
      <div>
      </div>


    {/* RESOURCES DROPDOWN */}
    <div>
      <button
        onClick={() =>
          handleExpand(() => setIsBlogsOpen((o) => !o))
        }
        className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-secondary/70 transition"
      >
        <span className="flex items-center gap-2 text-lg">
          <BookOpen size={20} />
          {!collapsed && 'Resources'}
        </span>

        {!collapsed &&
          (isBlogsOpen ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          ))}
      </button>

      <motion.div
        initial="closed"
        animate={isBlogsOpen ? 'open' : 'closed'}
        variants={dropdownVariants}
        transition={{ duration: 0.3 }}
        className="overflow-hidden ml-6 mt-2"
      >
        <NavLink
          to="/dashboard/blog"
          onClick={() => handleExpand(() => {})}
          className="flex items-center gap-2 px-4 py-2 text-gray-300 rounded-lg hover:bg-secondary/70 hover:text-white"
        >
          <Newspaper size={18} />
          {!collapsed && 'Blogs'}
        </NavLink>

        <NavLink
          to="/dashboard/faqs"
          onClick={() => handleExpand(() => {})}
          className="flex items-center gap-2 px-4 py-2 text-gray-300 rounded-lg hover:bg-secondary/70 hover:text-white"
        >
          <HelpCircle size={18} />
          {!collapsed && 'FAQs'}
        </NavLink>
      </motion.div>
    </div>



      </div>

     
      <div className="shrink-0 border-t border-gray-700 p-2 space-y-2">
        <button
         onClick={() => handleExpand(() => navigate('/dashboard/profile'))}
         className={`
           flex items-center gap-2 py-2 rounded-lg hover:bg-secondary/70 transition w-full text-lg
           ${collapsed ? 'justify-center px-0' : 'px-4'}
         `}
       >
         <User size={20} />
         {!collapsed && 'Profile'}
       </button>
       
      </div>
    </aside>
  );
}
