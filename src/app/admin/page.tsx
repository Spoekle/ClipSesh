'use client';

import dynamic from 'next/dynamic';
import RequireAuth from '@/components/RequireAuth';

const AdminDash = dynamic(() => import('@/views/Admin/Index'), { ssr: false });

export default function AdminPage() {
  return (
    <RequireAuth isAdminRequired={true}>
      <AdminDash />
    </RequireAuth>
  );
}