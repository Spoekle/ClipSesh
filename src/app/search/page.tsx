'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ClipSearch = dynamic(() => import('@/views/Search/ClipSearch'), { ssr: false });

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <ClipSearch />
    </Suspense>
  );
}