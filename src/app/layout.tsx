import type { Metadata, Viewport } from 'next';
import { Rubik, Geist } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clipsesh.spoekle.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'ClipSesh • Beat Saber Highlights & Community Clips',
    template: '%s • ClipSesh',
  },
  description: 'Discover, rate, and discuss the best Beat Saber clips from across the community.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0e1315',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", rubik.variable, "font-sans", geist.variable)}>
      <body className="min-h-screen bg-cc-ground text-cc-text antialiased selection:bg-cc-red/20 selection:text-cc-red font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
