import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  
  // Adicionando verificação para o email também, para garantir que lucenajj@gmail.com seja sempre admin
  const isAdmin = user?.role === 'admin' || user?.email === 'lucenajj@gmail.com';

  // Debug para entender o problema
  useEffect(() => {
    console.log('MainLayout - User:', user);
    console.log('MainLayout - Role original:', user?.role);
    console.log('MainLayout - Email:', user?.email);
    console.log('MainLayout - isAdmin:', isAdmin);
  }, [user, isAdmin]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      
      {isAuthenticated && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onMenuItemClick={closeSidebar} 
          isAdmin={isAdmin}
        />
      )}
      
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
