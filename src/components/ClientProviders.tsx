'use client';

import React, { Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { NotificationProvider } from '@/context/AlertContext';
import AppShell from '@/components/AppShell';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Suspense fallback={null}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </NotificationProvider>
    </QueryClientProvider>
  );
}