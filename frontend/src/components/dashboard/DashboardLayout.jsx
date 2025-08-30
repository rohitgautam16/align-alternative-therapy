// src/layout/DashboardLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { PlayerUIProvider, usePlayerUI } from '../../context/PlayerUIContext';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import MusicPlayer, { PLAYER_HEIGHT, HANDLE_HEIGHT } from '../music/MusicPlayer';

function InnerLayout() {
  const { currentTrack } = useSelector(s => s.player);
  const { expanded } = usePlayerUI();
  const { drawerOpen, toggleDrawer } = useSidebar(); 

  const padBottom = currentTrack ? (expanded ? PLAYER_HEIGHT : HANDLE_HEIGHT) : 0;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Topbar />

      {/* main row (desktop/tablet layout preserved) */}
      <div
        className="flex flex-1 overflow-hidden pt-[4.375rem] gap-1.5 m-1.5 transition-all duration-300 ease-in-out scroll-smooth"
        style={{ paddingBottom: `${padBottom}px` }}
      >
        {/* Desktop/Tablet inline sidebar */}
        <div className="hidden md:flex md:flex-shrink-0 md:w-auto">
          <div className="h-full overflow-y-auto">
            <Sidebar /> 
          </div>
        </div>

        {/* Outlet */}
        <main className="flex-1 bg-black rounded-lg overflow-y-auto scroll-smooth">
          <Outlet />
        </main>
      </div>

      {/* MOBILE drawer: overlays Outlet, below Topbar */}
        <div
          className={[
            'fixed left-0 top-[4.375rem] z-40 md:hidden',
            'bg-gray-900 shadow-xl transition-transform duration-300',
            'overflow-hidden',                          
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
          style={{
            height: 'calc(100dvh - 4.375rem)',
          }}
          role="dialog"
          aria-modal="true"
          aria-hidden={!drawerOpen}
        >
          {/* Full-height scroller; add safe-area padding */}
          <div className="h-full overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
            <Sidebar />
          </div>
        </div>

        {/* MOBILE backdrop: match the drawer's vertical span */}
        {drawerOpen && (
          <button
            className="fixed left-0 right-0 top-[4.375rem] z-30 bg-black/50 md:hidden"
            style={{ height: 'calc(100dvh - 4.375rem)' }}
            aria-label="Close sidebar"
            onClick={toggleDrawer}
          />
        )}


      <MusicPlayer />
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <PlayerUIProvider>
        <InnerLayout />
      </PlayerUIProvider>
    </SidebarProvider>
  );
}
