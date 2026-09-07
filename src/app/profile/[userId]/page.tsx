'use client';

import dynamic from 'next/dynamic';

const ProfilePage = dynamic(() => import('@/views/Profile/Index'), { ssr: false });

export default function UserProfilePage() {
  return <ProfilePage />;
}