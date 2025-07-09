import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '../../context/SidebarContext';
import AdminTopbar from './AdminTopbar';
import AdminSidebar from './AdminSidebar';

function AdminDashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <AdminTopbar />

        <div className="flex flex-1 overflow-hidden pt-[4.375rem] gap-1.5 m-1.5 transition-all duration-300 ease-in-out scroll-smooth">
          <AdminSidebar />
          <main className="flex-1 bg-black rounded-lg overflow-auto scroll-smooth p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AdminDashboardLayout;
