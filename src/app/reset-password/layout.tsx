import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your ClipSesh account password securely.',
  openGraph: {
    title: 'Reset Password • ClipSesh',
    description: 'Reset your ClipSesh account password securely.',
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
