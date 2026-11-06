import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seasonal Archive • ClipSesh',
  description: 'Explore historical Beat Saber community highlight reels, seasonal compilations, and archived clips.',
  openGraph: {
    title: 'Seasonal Archive • ClipSesh',
    description: 'Explore historical Beat Saber community highlight reels, seasonal compilations, and archived clips.',
  },
};

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
