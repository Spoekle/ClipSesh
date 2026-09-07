'use client';

import dynamic from 'next/dynamic';

const ClipViewer = dynamic(() => import('@/views/Clips/Index'), { ssr: false });

export default function ClipsPage() {
  return <ClipViewer />;
}