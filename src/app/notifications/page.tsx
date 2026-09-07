'use client';

import dynamic from 'next/dynamic';
import RequireAuth from '@/components/RequireAuth';

const NotificationsPage = dynamic(() => import('@/views/NotificationsPage'), { ssr: false });

export default function NotificationsRoute() {
  return (
    <RequireAuth>
      <NotificationsPage />
    </RequireAuth>
  );
}