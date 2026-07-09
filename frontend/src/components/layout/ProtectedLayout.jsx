// src/components/layout/ProtectedLayout.jsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ErrorBoundary from '../ErrorBoundary';

export default function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const isChat = location.pathname.startsWith('/chat');

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Sidebar - fixed on mobile, static on desktop */}
      <Sidebar collapsed={!sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} />

        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${isChat ? 'p-0' : 'px-3 pb-3 md:px-5 md:pb-5 lg:px-6 lg:pb-6'}`}>
          <div className={`${isChat ? 'h-full w-full' : 'pt-3 md:pt-5 max-w-[1500px] mx-auto w-full animate-fade-in min-h-full'}`}>
            <ErrorBoundary>
              <div className={isChat ? 'h-full w-full' : 'page-shell min-h-[calc(100vh-120px)] p-4 md:p-6 lg:p-7'}>
                <Outlet />
              </div>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
