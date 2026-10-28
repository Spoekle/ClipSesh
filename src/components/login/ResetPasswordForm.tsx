'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { requestPasswordReset } from '@/services/userService';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResetPasswordFormProps {
  onBackToLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error' | ''; message: string }>({
    type: '',
    message: '',
  });
  const [awaitingReset, setAwaitingReset] = useState(false);

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setResetMessage({ type: 'error', message: 'Please enter your email address.' });
      return;
    }

    try {
      setAwaitingReset(true);
      setResetMessage({ type: '', message: '' });

      await requestPasswordReset(email);

      setResetMessage({
        type: 'success',
        message: `Password reset instructions sent to ${email}. Please check your inbox.`,
      });
    } catch (err: unknown) {
      const errorObj = err as { status?: number; response?: { status?: number } };
      const status = errorObj?.status || errorObj?.response?.status;
      if (status === 404) {
        setResetMessage({ type: 'error', message: 'Email not found. Please try again.' });
      } else {
        setResetMessage({
          type: 'error',
          message: 'Failed to reset password. Please try again later.',
        });
      }
    } finally {
      setAwaitingReset(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1 }}
    >
      <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
      <p className="mb-6 text-muted-foreground text-sm">
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      {resetMessage.type && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm ${
            resetMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-primary/10 border border-primary/30 text-primary'
          }`}
        >
          {resetMessage.message}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="reset-email"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Email Address
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Mail className="size-4" />
            </div>
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setResetMessage({ type: '', message: '' });
              }}
              className="pl-10 h-10 bg-secondary/40 border-border text-foreground"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          pill
          fullWidth
          onClick={handlePasswordReset}
          disabled={awaitingReset || !email.trim()}
          isLoading={awaitingReset}
        >
          {awaitingReset ? 'Processing...' : 'Reset Password'}
        </Button>
      </div>

      <div className="mt-6 text-center text-xs">
        <button
          onClick={onBackToLogin}
          className="text-primary hover:underline cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    </motion.div>
  );
};

export default ResetPasswordForm;
