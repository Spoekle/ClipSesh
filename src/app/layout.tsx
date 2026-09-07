import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ClipSesh',
  description: 'Discover, rate, and discuss the best Beat Saber clips from across the community.',
  icons: {
    icon: '/favicon-16x16.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0e1315] text-[#e6e6e6] antialiased selection:bg-[#f23030]/20 selection:text-[#f23030]">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
