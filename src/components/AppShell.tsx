'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { NotificationProvider } from '@/context/AlertContext';
import { safeLocalStorage } from '@/utils/storage';
import Navbar from './Navbar';
import Footer from './Footer';
import NotificationContainer from './PopupAlerts';
import { User } from '../types/adminTypes';
import { useCurrentUser } from '../hooks/useUser';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

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
    <div className="flex flex-col min-h-screen bg-[#0f0f0f] text-[#f1f1f1] selection:bg-cc-red/20 selection:text-cc-red relative z-0">
      <Navbar
        user={user}
        setUser={setUser}
      />
      <div className="flex flex-col grow w-full">
        <main className="grow w-full">
          {children}
        </main>
        <Footer />
      </div>
      <NotificationContainer />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Suspense fallback={null}>
          <AppShellContent>{children}</AppShellContent>
        </Suspense>
      </NotificationProvider>
    </QueryClientProvider>
  );
}