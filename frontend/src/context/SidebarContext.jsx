// src/context/SidebarContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const SidebarContext = createContext();

const isMobile = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 767.98px)').matches;

export function SidebarProvider({ children }) {
  // collapse (desktop/tablet control)
  const [collapsed, setCollapsed] = useState(() => (isMobile() ? false : false)); // always expanded by default; tweak if you want desktop=true

  // keep it expanded whenever we’re on mobile (also on resize)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767.98px)');
    const handle = (e) => {
      if (e.matches) setCollapsed(false); // entering mobile → expand
    };
    // run once on mount
    if (mql.matches) setCollapsed(false);
    mql.addEventListener('change', handle);
    return () => mql.removeEventListener('change', handle);
  }, []);

  const toggleSidebar = () => setCollapsed((c) => !c);

  // mobile drawer (independent)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = () => {
    setCollapsed(false);       // ensure full sidebar in drawer
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);
  const toggleDrawer = () => {
    setDrawerOpen((v) => {
      const next = !v;
      if (next) setCollapsed(false); // opening → expand
      return next;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        collapsed, toggleSidebar,
        drawerOpen, openDrawer, closeDrawer, toggleDrawer,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
