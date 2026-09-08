'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ArchiveView = dynamic(() => import('@/views/Archive/ArchiveView'), { ssr: false });

export default function ArchivePage() {
  return (
    <Suspense fallback={null}>
      <ArchiveView />
    </Suspense>
  );
}
