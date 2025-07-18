import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWifi } from 'react-icons/fa';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface OfflineWarningProps {
  message?: string;
  showIcon?: boolean;
  className?: string;
}

const OfflineWarning: React.FC<OfflineWarningProps> = ({ 
  message = "This action requires an internet connection", 
  className = ""
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
          className={`flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm ${className}`}
        >
          <FaWifi className="text-orange-500" size={14} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineWarning;
