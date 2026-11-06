'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { queryClient, queryKeys } from '@/lib/react-query';
import { NotificationProvider } from '@/context/AlertContext';
import { setAuthToken, removeAuthToken } from '@/utils/storage';
import { useAuthToken } from '@/hooks/useAuthToken';
import { authenticateSocket } from '@/hooks/useSocket';
import Navbar from './Navbar';
import Footer from './Footer';
import NotificationContainer from './PopupAlerts';
import { User } from '../types/adminTypes';
import { useCurrentUser } from '../hooks/useUser';
import { TooltipProvider } from '@/components/ui/tooltip';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const token = useAuthToken();

  const { data: userData, isLoading: userLoading, error: userError } = useCurrentUser();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const urlToken = url.searchParams.get('token');
      if (urlToken) {
        setAuthToken(urlToken);
        authenticateSocket(urlToken);
        url.searchParams.delete('token');
        const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
        queryClient.refetchQueries({ queryKey: queryKeys.user.current });
      }
    }
  }, [queryClient]);

  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (userError) {
      setUser(null);
      if (typeof window !== 'undefined') {
        removeAuthToken();
      }
    } else if (!userLoading && !token) {
      setUser(null);
    }
  }, [userData, userError, userLoading, token]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-cc-red/20 selection:text-cc-red relative z-0">
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
        <TooltipProvider>
          <Suspense fallback={null}>
            <AppShellContent>{children}</AppShellContent>
          </Suspense>
        </TooltipProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}