'use client';

import dynamic from 'next/dynamic';
import RequireAuth from '@/components/RequireAuth';

const UserReportsPage = dynamic(() => import('@/views/UserReportsPage'), { ssr: false });

export default function MyReportsPage() {
  return (
    <RequireAuth>
      <UserReportsPage />
    </RequireAuth>
  );
}