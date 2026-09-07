'use client';

import dynamic from 'next/dynamic';

const ResetPassword = dynamic(() => import('@/views/ResetPassword'), { ssr: false });

export default function ResetPasswordPage() {
  return <ResetPassword />;
}