// src/components/dashboard/DashboardLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { SidebarProvider } from '../../context/SidebarContext';
import { PlayerUIProvider, usePlayerUI } from '../../context/PlayerUIContext';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import MusicPlayer, { PLAYER_HEIGHT, HANDLE_HEIGHT } from '../music/MusicPlayer';

function InnerLayout() {
  const { currentTrack } = useSelector((s) => s.player);
  const { expanded } = usePlayerUI();

  const padBottom = currentTrack
    ? (expanded ? PLAYER_HEIGHT : HANDLE_HEIGHT)
    : 0;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Topbar />

      <div
        className="flex flex-1 overflow-hidden pt-[4.375rem] gap-1.5 m-1.5 transition-all duration-300 ease-in-out"
        style={{ paddingBottom: `${padBottom}px` }}
      >
        <Sidebar />
        <main className="flex-1 bg-black rounded-lg overflow-auto">
          <Outlet />
        </main>
      </div>

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
