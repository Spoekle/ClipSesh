'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface OfflineBannerProps {
  isVisible: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-destructive text-destructive-foreground shadow-lg border-b border-destructive/40 relative z-[60]"
        >
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex items-center justify-center space-x-3">
              <div className="flex items-center space-x-2">
                <WifiOff className="size-4 shrink-0" />
                <span className="font-medium text-sm">
                  You are currently offline
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface OfflineWarningProps {
  message?: string;
  showIcon?: boolean;
  className?: string;
}

export const OfflineWarning: React.FC<OfflineWarningProps> = ({
  message = 'This action requires an internet connection',
  className = '',
}) => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center space-x-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm ${className}`}
        >
          <WifiOff className="size-4 text-amber-400 shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
