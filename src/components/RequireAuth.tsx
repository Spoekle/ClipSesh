'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaLock, FaShieldAlt, FaUserCheck } from 'react-icons/fa';
import { useCurrentUser } from '../hooks/useUser';

interface RequireAuthProps {
  children: ReactNode;
  isAdminRequired?: boolean;
  isEditorRequired?: boolean;
  isVerifiedRequired?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  isAdminRequired = false,
  isEditorRequired = false,
  isVerifiedRequired = false,
}) => {
  const router = useRouter();
  const { data: user, isLoading: authLoading } = useCurrentUser();
  const [authCheckComplete, setAuthCheckComplete] = useState<boolean>(false);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Checking authentication...');

  useEffect(() => {
    if (isAdminRequired) {
      setLoadingMessage('Verifying Admin privileges...');
    } else if (isEditorRequired) {
      setLoadingMessage('Verifying Editor privileges...');
    } else if (isVerifiedRequired) {
      setLoadingMessage('Verifying ClipTeam privileges...');
    }

    const timer = setTimeout(() => {
      setAuthCheckComplete(true);
      setTimeout(() => {
        setShowVerificationModal(false);
      }, 200);
    }, 600);

    return () => clearTimeout(timer);
  }, [isAdminRequired, isEditorRequired, isVerifiedRequired]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/clips');
      } else if (isAdminRequired && !user.roles.includes('admin')) {
        router.replace('/clips');
      } else if (
        isEditorRequired &&
        !(user.roles.includes('admin') || user.roles.includes('editor'))
      ) {
        router.replace('/clips');
      } else if (
        isVerifiedRequired &&
        !(user.roles.includes('admin') || user.roles.includes('clipteam'))
      ) {
        router.replace('/clips');
      }
    }
  }, [user, authLoading, isAdminRequired, isEditorRequired, isVerifiedRequired, router]);

  if (authLoading) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <FaLock className="text-5xl text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-white">
                Loading...
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-6">
                Checking authentication status...
              </p>
              <div className="flex justify-center items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full bg-blue-500 animate-ping"
                  style={{ animationDelay: '0s' }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-blue-500 animate-ping"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-blue-500 animate-ping"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isAdminRequired && !user.roles.includes('admin')) {
    return null;
  }

  if (
    isEditorRequired &&
    !(user.roles.includes('admin') || user.roles.includes('editor'))
  ) {
    return null;
  }

  if (
    isVerifiedRequired &&
    !(user.roles.includes('admin') || user.roles.includes('clipteam'))
  ) {
    return null;
  }

  return (
    <div className="relative">
      <div className={showVerificationModal ? 'blur-sm pointer-events-none' : ''}>
        {children}
      </div>

      {showVerificationModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="mb-6 relative"
              >
                {isAdminRequired ? (
                  <FaShieldAlt className="text-5xl text-red-500" />
                ) : isVerifiedRequired ? (
                  <FaUserCheck className="text-5xl text-blue-500" />
                ) : (
                  <FaLock className="text-5xl text-amber-500" />
                )}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                />
              </motion.div>

              <motion.h2
                className="text-2xl font-bold mb-3 text-neutral-900 dark:text-white"
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                Secure Access Required
              </motion.h2>

              <motion.p
                className="text-lg text-neutral-600 dark:text-neutral-300 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                {loadingMessage}
              </motion.p>

              <motion.div
                className="flex justify-center items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: authCheckComplete ? [1, 0] : 1,
                  transition: {
                    opacity: { duration: 0.15 },
                  },
                }}
              >
                <div
                  className="w-2 h-2 rounded-full bg-blue-500 animate-ping"
                  style={{ animationDelay: '0s' }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-blue-500 animate-ping"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-blue-500 animate-ping"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </motion.div>

              <motion.div
                className="w-full mt-6"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: authCheckComplete ? '100%' : '85%' }}
                    transition={{
                      duration: authCheckComplete ? 0.1 : 0.6,
                      ease: 'easeOut',
                    }}
                  />
                </div>
                <p className="text-center mt-2 text-xs text-neutral-400">
                  {authCheckComplete ? 'Access granted!' : 'Validating credentials...'}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default RequireAuth;