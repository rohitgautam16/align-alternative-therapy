// src/context/SidebarContext.jsx
import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);
    const toggleSidebar = () => {
    console.log('Toggling sidebar, was:', collapsed);
    setCollapsed((c) => !c);
  };


  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}


export function useSidebar() {
  return useContext(SidebarContext);
}
