// src/components/admin/AdminSidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Users, Grid, FileText, Settings } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

const dropdownVariants = {
  closed: { height: 0, opacity: 0 },
  open:   { height: 'auto', opacity: 1 },
};

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { collapsed, toggleSidebar } = useSidebar();

  // Example dropdowns: “Management” section expands to show sub‑links
  const [isMgmtOpen, setMgmtOpen] = useState(true);

  // Collapse dropdowns if sidebar collapses
  useEffect(() => {
    if (collapsed) setMgmtOpen(false);
  }, [collapsed]);

  const handleExpand = (fn) => {
    if (collapsed) toggleSidebar();
    fn();
  };

  return (
    <aside
      className={`
        flex flex-col rounded-lg overflow-y-auto bg-black text-white
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      <div className="flex-grow overflow-y-auto px-2 py-4 space-y-2">
        {/* Dashboard Home */}
        {/* <NavLink
          to="/admin/dashboard"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg text-lg ${
              isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`
          }
        >
          <Grid size={20} />
          {!collapsed && 'Dashboard'}
        </NavLink> */}

        {/* Management Dropdown */}
        <div>
          <button
            onClick={() => handleExpand(() => setMgmtOpen(o => !o))}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <span className="flex  gap-2 text-md">
              <Users size={20} />
              {!collapsed && 'User Management'}
            </span>
            {!collapsed && (isMgmtOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
          </button>

          <motion.div
            initial="closed"
            animate={isMgmtOpen ? 'open' : 'closed'}
            variants={dropdownVariants}
            transition={{ duration: 0.3 }}
            className="overflow-hidden ml-6 mt-2"
          >
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg text-gray-300 hover:bg-blue-700 hover:text-white ${
                  isActive ? 'bg-blue-700 text-white' : ''
                }`
              }
            >
              All Users
            </NavLink>
            <NavLink
              to="/admin/admins"
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg text-gray-300 hover:bg-blue-700 hover:text-white ${
                  isActive ? 'bg-blue-700 text-white' : ''
                }`
              }
            >
              Admins
            </NavLink>
          </motion.div>
        </div>

        {/* Other Admin Sections */}
        <NavLink
          to="/admin/categories"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg text-lg ${
              isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`
          }
        >
          <FileText size={20} />
          {!collapsed && 'Categories'}
        </NavLink>
        <NavLink
          to="/admin/playlists"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg text-lg ${
              isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`
          }
        >
          <FileText size={20} />
          {!collapsed && 'Playlists'}
        </NavLink>
        <NavLink
          to="/admin/songs"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg text-lg ${
              isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`
          }
        >
          <FileText size={20} />
          {!collapsed && 'Songs'}
        </NavLink>
        <NavLink
          to="/admin/upload"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg text-lg ${
              isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`
          }
        >
          <FileText size={20} />
          {!collapsed && 'Upload to R2'}
        </NavLink>
      </div>

      {/* Footer / Settings */}
      <div className="shrink-0 border-t border-gray-700 p-2 space-y-2">
        <button
          onClick={() => {
            if (collapsed) toggleSidebar();
            navigate('/admin/settings');
          }}
          className={`
            flex items-center gap-2 py-2 rounded-lg hover:bg-blue-700 transition w-full text-lg
            ${collapsed ? 'justify-center px-0' : 'px-4'}
          `}
        >
          <Settings size={20} />
          {!collapsed && 'Settings'}
        </button>
      </div>
    </aside>
  );
}
