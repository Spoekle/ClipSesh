'use client';

import dynamic from 'next/dynamic';

const SingleClipView = dynamic(() => import('@/views/Clips/SingleClipView'), { ssr: false });

export default function SingleClipPage() {
  return <SingleClipView />;
}