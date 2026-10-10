'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaLock, FaArrowLeft } from 'react-icons/fa';
import { useLoginUser, useRegisterUser } from '@/hooks/useUser';
import { setAuthToken, safeLocalStorage } from '@/utils/storage';
import { authenticateSocket } from '@/hooks/useSocket';
import { OfflineWarning } from '../common/OfflineBanner';
import CCAuthButton from './CCAuthButton';
import { Button } from '@/components/common/Button';

interface LoginFormProps {
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword }) => {
  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();

  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const [formMode, setFormMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (formMode === 'register') {
        await registerMutation.mutateAsync(formData);
        setFormMode('login');
        setFormData({ ...formData, password: '' });
        setSuccessMessage('Registration successful! Please login with your credentials.');
      } else {
        const response = await loginMutation.mutateAsync(formData);
        setAuthToken(response.token);
        safeLocalStorage.setItem('username', response.username);
        authenticateSocket(response.token);
        onSuccess();
      }
    } catch (err: unknown) {
      const errorObj = err as {
        status?: number;
        response?: { status?: number; data?: { message?: string } };
        data?: { message?: string };
        message?: string;
        name?: string;
      };
      const status = errorObj?.status || errorObj?.response?.status;
      const msg = errorObj?.data?.message || errorObj?.response?.data?.message || errorObj?.message;

      if (status === 403) {
        setError('Account awaiting admin approval.');
      } else if (status === 400) {
        setError(msg || 'Invalid username or password.');
      } else if (status === 409) {
        setError('Username already exists. Please choose another.');
      } else if (status) {
        setError(msg || 'An error occurred. Please try again later.');
      } else if (errorObj?.name === 'TypeError') {
        setError('Network error. Please check your connection.');
      } else {
        setError(msg || 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRegister = formMode === 'register';

  return (
    <AnimatePresence mode="wait">
      {!showPasswordAuth ? (
        <motion.div
          key="oauth-view"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-cc-text mb-2">Sign In</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Choose your preferred sign-in method
          </p>

          {error && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm">
              {successMessage}
            </div>
          )}

          <OfflineWarning message="Login requires an internet connection" className="mb-4" />

          <div className="space-y-3">
            <CCAuthButton />
          </div>

          <div className="relative py-4 my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-cc-card text-xs text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowPasswordAuth(true);
                setError('');
              }}
              className="text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer hover:underline"
            >
              Use password instead
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="password-view"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.1 }}
        >
          <button
            type="button"
            onClick={() => {
              setShowPasswordAuth(false);
              setFormMode('login');
              setError('');
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer mb-4"
          >
            <FaArrowLeft size={12} />
            <span>Back to sign in options</span>
          </button>

          <h2 className="text-2xl font-bold text-cc-text mb-2">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isRegister
              ? 'Enter your details to create a new account'
              : 'Enter your credentials to access your account'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm">
              {successMessage}
            </div>
          )}

          <OfflineWarning message="Login requires an internet connection" className="mb-4" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="auth-username"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FaUser className="text-muted-foreground" size={14} />
                </div>
                <input
                  id="auth-username"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-cc-ground border border-border text-white focus:border-primary rounded-xl pl-10 pr-4 py-2.5 w-full text-sm outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FaLock className="text-muted-foreground" size={14} />
                </div>
                <input
                  id="auth-password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-cc-ground border border-border text-white focus:border-primary rounded-xl pl-10 pr-4 py-2.5 w-full text-sm outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              pill
              fullWidth
              isLoading={isSubmitting}
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 text-center justify-center text-xs">
            <button
              type="button"
              onClick={() => {
                setFormMode(isRegister ? 'login' : 'register');
                setError('');
                setSuccessMessage('');
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
            {!isRegister && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-muted-foreground hover:text-primary hover:underline cursor-pointer"
              >
                Forgot your password?
              </button>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setShowPasswordAuth(false);
                setFormMode('login');
                setError('');
              }}
              className="text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer hover:underline"
            >
              Sign in with CC or Discord instead
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginForm;
