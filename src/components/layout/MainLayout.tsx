import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      
      {isAuthenticated && <Sidebar isOpen={sidebarOpen} onMenuItemClick={closeSidebar} />}
      
      <main className={cn(
        "flex-grow transition-all duration-300",
        isAuthenticated ? "md:ml-64" : ""
      )}>
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      
      <Toaster />
    </div>
  );
};

export default MainLayout;
