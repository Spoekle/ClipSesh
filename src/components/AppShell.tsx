'use client';

import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import PoweredByGrabs from './PoweredByGrabs';
import NotificationContainer from './PopupAlerts/NotificationContainer';
import { User } from '../types/adminTypes';
import { useCurrentUser } from '../hooks/useUser';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  const handleCloseMobile = useCallback(() => {
    setIsSidebarOpenMobile(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpenMobile((prev) => !prev);
  }, []);

  const { data: userData, isLoading: userLoading, error: userError } = useCurrentUser();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        safeLocalStorage.setItem('token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (userError) {
      setUser(null);
      if (typeof window !== 'undefined') {
        safeLocalStorage.removeItem('token');
      }
    } else if (!userLoading) {
      setUser(null);
    }
  }, [userData, userError, userLoading]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f] text-[#f1f1f1] transition-colors selection:bg-[#f23030]/20 selection:text-[#f23030] relative z-0">
      <Navbar
        user={user}
        setUser={setUser}
        onToggleSidebar={toggleSidebar}
      />
      <Sidebar
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={handleCloseMobile}
        user={user}
      />
      <div className="flex flex-col grow w-full">
        <main className="grow w-full">
          {children}
        </main>
        <Footer />
        <PoweredByGrabs />
      </div>
      <NotificationContainer />
    </div>
  );
}