// src/context/SidebarContext.jsx
import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  // existing desktop/tablet collapse
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(c => !c);

  // NEW: mobile drawer open/close (independent of collapsed)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer   = () => setDrawerOpen(true);
  const closeDrawer  = () => setDrawerOpen(false);
  const toggleDrawer = () => setDrawerOpen(v => !v);

  return (
    <SidebarContext.Provider value={{
      collapsed, toggleSidebar,
      drawerOpen, openDrawer, closeDrawer, toggleDrawer
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
