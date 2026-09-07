'use client';

import dynamic from 'next/dynamic';
import RequireAuth from '@/components/RequireAuth';

const ProfilePage = dynamic(() => import('@/views/Profile/Index'), { ssr: false });

export default function MyProfilePage() {
  return (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  );
}