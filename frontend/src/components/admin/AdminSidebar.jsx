// src/components/admin/AdminSidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Grid, 
  FileText, 
  Settings,
  Music,
  FolderOpen,
  Shield,
  Upload,
  Database,
  BarChart3,
  UserCheck,
  UserCog,
  Layers,
  Wand2
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

const dropdownVariants = {
  closed: { height: 0, opacity: 0 },
  open:   { height: 'auto', opacity: 1 },
};

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { collapsed, toggleSidebar } = useSidebar();

  // Dropdown states
  const [isMgmtOpen, setMgmtOpen] = useState(true);
  const [isContentOpen, setContentOpen] = useState(true);

  // Collapse dropdowns if sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setMgmtOpen(false);
      setContentOpen(false);
    }
  }, [collapsed]);

  const handleExpand = (fn) => {
    if (collapsed) toggleSidebar();
    fn();
  };

  const menuSections = [
    {
      title: 'User Management',
      icon: Users,
      isOpen: isMgmtOpen,
      setOpen: setMgmtOpen,
      items: [
        { to: '/admin/users', label: 'All Users', icon: UserCheck },
        { to: '/admin/admins', label: 'Admins', icon: Shield },
      ]
    },
    {
      title: 'Content Management',
      icon: Layers,
      isOpen: isContentOpen,
      setOpen: setContentOpen,
      items: [
        { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
        { to: '/admin/playlists', label: 'Playlists', icon: Grid },
        { to: '/admin/songs', label: 'Songs', icon: Music },
        { to: '/admin/hero-banner', label: 'Hero Banner', icon: FileText },
      ]
    }
  ];

  const singleItems = [
    // { to: '/admin/upload', label: 'File Manager', icon: Database },
  ];

  return (
    <aside
      className={`
        flex flex-col rounded-lg overflow-hidden h-full bg-black backdrop-blur-sm border border-gray-700/50 text-white
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserCog size={20} className="text-blue-400" />
            Admin Panel
          </h2>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {/* Dashboard Overview */}
        <NavLink
          to="/admin"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isActive 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          <BarChart3 size={20} className="flex-shrink-0" />
          {!collapsed && (
            <span className="font-medium">Dashboard</span>
          )}
        </NavLink>

        {/* <NavLink
          to="/admin/personalize"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isActive 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          <BarChart3 size={20} className="flex-shrink-0" />
          {!collapsed && (
            <span className="font-medium">Personalized Plan</span>
          )}
        </NavLink> */}

        <NavLink
          to="/admin/personalize-basic"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isActive 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          <Wand2 className="text-white" size={22} />
          {!collapsed && (
            <span className="font-medium">Personalized Plan Basic</span>
          )}
        </NavLink>

        <NavLink
          to="/admin/personalize-users"
          onClick={() => handleExpand(() => {})}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isActive 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          <UserCheck className="text-white" size={22} />
          {!collapsed && (
            <span className="font-medium">Personalized Plan Users</span>
          )}
        </NavLink>

        {/* Dropdown Sections */}
        {menuSections.map((section) => (
          <div key={section.title}>
            <button
              onClick={() => handleExpand(() => section.setOpen(o => !o))}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-700/50 transition-all duration-200 group ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <span className="flex items-center gap-3 text-gray-300 group-hover:text-white">
                <section.icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="font-medium">{section.title}</span>}
              </span>
              {!collapsed && (
                <motion.div
                  animate={{ rotate: section.isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} className="text-gray-400" />
                </motion.div>
              )}
            </button>

            <motion.div
              initial="closed"
              animate={section.isOpen && !collapsed ? 'open' : 'closed'}
              variants={dropdownVariants}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="ml-6 mt-1 space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                          : 'text-gray-400 hover:bg-gray-700/30 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </div>
        ))}

        {/* Single Items */}
        <div className="pt-2 border-t border-gray-700/30">
          {singleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => handleExpand(() => {})}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Footer */}
      {/* <div className="shrink-0 border-t border-gray-700/50 p-3">
        <button
          onClick={() => {
            if (collapsed) toggleSidebar();
            navigate('/profile');
          }}
          className={`
            flex items-center gap-3 py-2.5 rounded-lg hover:bg-gray-700/50 transition-all duration-200 w-full text-gray-300 hover:text-white group
            ${collapsed ? 'justify-center px-0' : 'px-3'}
          `}
        >
          <Settings size={20} className="flex-shrink-0" />
          {!collapsed && <span className="font-medium">Settings</span>}
        </button>
      </div> */}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.8);
        }
      `}</style>
    </aside>
  );
}
