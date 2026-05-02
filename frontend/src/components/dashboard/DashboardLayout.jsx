// src/layout/DashboardLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { PlayerUIProvider, usePlayerUI } from '../../context/PlayerUIContext';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
// import MusicPlayer, { PLAYER_HEIGHT, HANDLE_HEIGHT } from '../music/MusicPlayer';
import PlayerShell from '../music/PlayerShell';
import { usePlayerBarPadding } from '../music/usePlayerBarPadding';
import useScrollToTop from '../../hooks/useScrollToTop';
import DashboardFooter from './DashboardFooter';
import DashboardHomeRail from './DashboardHomeRail';

function InnerLayout() {
  useScrollToTop();
  const location = useLocation();
  const { currentTrack } = useSelector(s => s.player);
  const { expanded } = usePlayerUI();
  const { drawerOpen, toggleDrawer, rightRailOpen, closeRightRail } = useSidebar();
  const isDashboardHome =
    location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  //const padBottom = currentTrack ? (expanded ? PLAYER_HEIGHT : HANDLE_HEIGHT) : 0;
  const padBottom = usePlayerBarPadding();

  React.useEffect(() => {
    if (!isDashboardHome) {
      closeRightRail();
    }
  }, [closeRightRail, isDashboardHome]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Topbar />

      <div
        className="flex flex-1 overflow-hidden pt-[4.375rem] gap-1.5 m-1.5 transition-all duration-300 ease-in-out scroll-smooth"
        //style={{ paddingBottom: `${padBottom}px` }}
        style={{ paddingBottom: padBottom }}
      >

        <div className="hidden md:flex md:flex-shrink-0 md:w-auto">
          <div className="h-full overflow-y-auto">
            <Sidebar /> 
          </div>
        </div>

        <main className="flex flex-1 min-w-0 gap-1.5 overflow-hidden">
          <div className="min-w-0 flex-1 bg-black space-between rounded-lg overflow-y-auto scroll-smooth">
            <Outlet />
            <DashboardFooter />
          </div>

          {isDashboardHome && (
            <div
              className={[
                'hidden lg:block shrink-0 overflow-hidden transition-all duration-300 ease-in-out',
                rightRailOpen ? 'w-[20rem] opacity-100' : 'w-0 opacity-0 pointer-events-none',
              ].join(' ')}
              aria-hidden={!rightRailOpen}
            >
              <DashboardHomeRail />
            </div>
          )}
        </main>
      </div>


        <div
          className={[
            'fixed left-0 top-[4.375rem] z-40 md:hidden',
            'transition-transform duration-300',
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

          <div className="h-full overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
            <Sidebar />
          </div>
        </div>


        {drawerOpen && (
          <button
            className="fixed left-0 right-0 top-[4.375rem] z-30 bg-black/50 md:hidden"
            style={{ height: 'calc(100dvh - 4.375rem)' }}
            aria-label="Close sidebar"
            onClick={toggleDrawer}
          />
        )}

         <PlayerShell />
      {/* <MusicPlayer /> */}
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
