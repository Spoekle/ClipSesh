'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LoginForm from './login/LoginForm';
import ResetPasswordForm from './login/ResetPasswordForm';

interface LoginModalProps {
  setIsLoginModalOpen: (isOpen: boolean) => void;
  isLoginModalOpen: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  setIsLoginModalOpen,
  isLoginModalOpen,
}) => {
  const [view, setView] = useState<'auth' | 'reset'>('auth');

  const handleClose = () => {
    setIsLoginModalOpen(false);
    setView('auth');
  };

  return (
    <Dialog
      open={isLoginModalOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-md w-full p-8 border border-border bg-card shadow-2xl rounded-2xl">
        {view === 'auth' ? (
          <LoginForm
            onSuccess={handleClose}
            onForgotPassword={() => setView('reset')}
          />
        ) : (
          <ResetPasswordForm onBackToLogin={() => setView('auth')} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
