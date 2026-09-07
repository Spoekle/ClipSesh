'use client';

import dynamic from 'next/dynamic';

const PrivacyStatement = dynamic(() => import('@/views/PrivacyStatement'), { ssr: false });

export default function PrivacyStatementPage() {
  return <PrivacyStatement />;
}