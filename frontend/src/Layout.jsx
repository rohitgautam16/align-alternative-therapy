// src/Layout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMenu } from './context/MenuContext';

import Header from './components/common/Header';
import FullScreenMenu from './components/common/FullScreenMenu/FullScreenMenu';
import MusicPlayer from './components/music/MusicPlayer';

export default function Layout() {
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const isAuth = useSelector((s) => s.auth.isAuthenticated);
  const { pathname } = useLocation();
  const showPlayer = isAuth && pathname.startsWith('/dashboard');

  return (
    <div className="flex flex-col min-h-screen">
      {/* <Header onMenuClick={() => setIsMenuOpen(o => !o)} /> */}

      
      {isMenuOpen && (
        <FullScreenMenu
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      )}

      <main className=" flex-1 overflow-auto">
        <Outlet />
      </main>

      {showPlayer && (
        <footer className="border-t border-gray-700">
          
        </footer>
      )}
    </div>
  );
}
