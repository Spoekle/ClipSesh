import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ClipSesh',
  description: 'Discover, rate, and discuss the best Beat Saber clips from across the community.',
  icons: {
    icon: '/media/favicon-16x16.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-cc-ground text-cc-text antialiased selection:bg-cc-red/20 selection:text-cc-red">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
