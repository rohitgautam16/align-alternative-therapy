// src/components/admin/AdminDashboardLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import AdminTopbar from './AdminTopbar';
import AdminSidebar from './AdminSidebar';
import useScrollToTop from '../../hooks/useScrollToTop';

function InnerAdminLayout() {
  useScrollToTop(); 
  const { drawerOpen, toggleDrawer } = useSidebar();

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <AdminTopbar />

      {/* main row */}
      <div className="flex flex-1 overflow-hidden pt-[4.375rem] gap-1.5 m-1.5 transition-all duration-300 ease-in-out scroll-smooth">
        {/* desktop/tablet: inline sidebar (lets sidebar control its own width when collapsed) */}
        <div className="hidden md:flex md:flex-shrink-0 md:w-auto">
          <div className="h-full overflow-y-auto">
            <AdminSidebar />
          </div>
        </div>

        {/* content */}
        <main className="flex-1 min-w-0 bg-black rounded-lg overflow-y-auto overflow-x-hidden scroll-smooth p-4">
          <Outlet />
        </main>
      </div>

      {/* mobile drawer (overlays content, below topbar) */}
      <div
        className={[
          'fixed left-0 top-[4.375rem] z-40 md:hidden',
          'transition-transform duration-300',
          'overflow-hidden', 
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ height: 'calc(100dvh - 4.375rem)' }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!drawerOpen}
      >
        <div className="h-full overflow-y-auto pt-1 pb-[env(safe-area-inset-bottom,0px)]">
          <AdminSidebar />
        </div>
      </div>

      {/* mobile backdrop (match drawer vertical span) */}
      {drawerOpen && (
        <button
          className="fixed left-0 right-0 top-[4.375rem] z-30 bg-black/50 md:hidden"
          style={{ height: 'calc(100dvh - 4.375rem)' }}
          aria-label="Close sidebar"
          onClick={toggleDrawer}
        />
      )}
    </div>
  );
}

export default function AdminDashboardLayout() {
  return (
    <SidebarProvider>
      <InnerAdminLayout />
    </SidebarProvider>
  );
}
