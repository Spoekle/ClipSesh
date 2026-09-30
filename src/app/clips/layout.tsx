import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Clips • ClipSesh',
  description: 'Discover, rate, and discuss the best Beat Saber clips from across the community.',
  openGraph: {
    title: 'Community Clips • ClipSesh',
    description: 'Discover, rate, and discuss the best Beat Saber clips from across the community.',
  },
};

export default function ClipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
