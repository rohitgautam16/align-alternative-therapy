// src/context/MenuContext.jsx
import React, { createContext, useContext, useState } from 'react';

const MenuContext = createContext();

/**
 * Wrap your app in this provider so any component can toggle or read the menu state.
 */
export function MenuProvider({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(o => !o);

  return (
    <MenuContext.Provider value={{ isMenuOpen, setIsMenuOpen, toggleMenu }}>
      {children}
    </MenuContext.Provider>
  );
}


export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return ctx; 
}
