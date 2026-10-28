'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import PageLayout from '@/components/layouts/PageLayout';
import { useNotification } from '@/context/AlertContext';
import { confirmPasswordReset } from '@/services/userService';
import PasswordStrengthBar from './components/PasswordStrengthBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  const { showSuccess, showError } = useNotification();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      showError('Invalid or missing token');
      router.push('/clips');
    }
  }, [token, router, showError]);

  const checkPasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength += 1;
    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) strength += 1;
    if (pwd.match(/[0-9]/)) strength += 1;
    if (pwd.match(/[^a-zA-Z0-9]/)) strength += 1;
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength < 2) {
      setError('Password is too weak. Include uppercase, lowercase, numbers, or special characters.');
      return;
    }

    setLoading(true);
    try {
      if (!token) throw new Error('Invalid token');
      const response = await confirmPasswordReset(token, password);
      setMessage(response.message || 'Password reset successful');
      setError('');
      showSuccess('Password reset successful! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMsg = errorObj?.response?.data?.error || errorObj?.message || 'An error occurred';
      setError(errorMsg);
      showError(errorMsg);
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Reset Password"
      subtitle="Enter your new password to regain access to your ClipSesh account"
      metaDescription="Reset your password to regain access to your ClipSesh account"
    >
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-cc-card rounded-xl border border-border p-6 sm:p-8 shadow-xl text-white"
        >
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-[10px] flex items-center text-sm"
            >
              <CheckCircle className="size-5 mr-2 shrink-0 text-emerald-400" />
              <span>{message}</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-primary/10 border border-primary/30 text-primary rounded-[10px] flex items-center text-sm"
            >
              <AlertTriangle className="size-5 mr-2 shrink-0 text-primary" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col">
              <label className="mb-2 font-medium text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                <Lock className="mr-2 size-3.5 text-primary" /> New Password
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="bg-cc-ground border-border pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/60"
                  placeholder="Enter a strong password"
                />
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 size-4"
                />
              </div>

              {password && <PasswordStrengthBar strength={passwordStrength} />}
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-medium text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                <Lock className="mr-2 size-3.5 text-primary" /> Confirm Password
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-cc-ground border-border pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/60"
                  placeholder="Confirm your password"
                />
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 size-4"
                />
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5 text-xs text-primary flex items-center"
                >
                  <AlertTriangle className="mr-1 size-3.5" /> Passwords do not match
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full py-3 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPassword />
    </React.Suspense>
  );
}