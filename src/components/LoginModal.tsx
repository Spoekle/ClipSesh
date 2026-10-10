'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import LoginForm from './login/LoginForm';
import ResetPasswordForm from './login/ResetPasswordForm';

interface LoginModalProps {
  setIsLoginModalOpen: (isOpen: boolean) => void;
  isLoginModalOpen: boolean;
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

const LoginModal: React.FC<LoginModalProps> = ({ setIsLoginModalOpen, isLoginModalOpen }) => {
  const [view, setView] = useState<'auth' | 'reset'>('auth');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLoginModalOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [setIsLoginModalOpen]);

  const handleClose = () => {
    setIsLoginModalOpen(false);
    setView('auth');
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <motion.div
          className="login-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-200"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="modal-content relative bg-cc-card rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-border"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-cc-ground cursor-pointer"
              aria-label="Close"
            >
              <FaTimes size={16} />
            </button>

            <div className="p-8">
              {view === 'auth' ? (
                <LoginForm
                  onSuccess={handleClose}
                  onForgotPassword={() => setView('reset')}
                />
              ) : (
                <ResetPasswordForm onBackToLogin={() => setView('auth')} />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
