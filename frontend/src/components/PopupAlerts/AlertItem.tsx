import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { Notification } from '../../types/notificationTypes';

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = React.memo(({ notification, onRemove }) => {
  const [progress, setProgress] = useState(100);

  // Memoize the remove handler to prevent recreating the function
  const handleRemove = useCallback(() => {
    onRemove(notification.id);
  }, [notification.id, onRemove]);

  useEffect(() => {
    if (!notification.duration) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newValue = prev - (100 / (notification.duration! / 100));
        return Math.max(0, newValue);
      });
    }, 100);

    // Separate timer to handle closing the notification
    const closeTimer = setTimeout(() => {
      handleRemove();
    }, notification.duration);

    return () => {
      clearInterval(interval);
      clearTimeout(closeTimer);
    };
  }, [notification.id, notification.duration, handleRemove]);

  // Memoize the notification styles to prevent recalculation
  const notificationStyles = useMemo(() => {
    switch (notification.type) {
      case 'success':
        return {
          bgClass: 'from-green-500/90 to-green-600/90',
          iconClass: 'text-white',
          icon: <FaCheckCircle className="w-5 h-5" />,
        };
      case 'error':
        return {
          bgClass: 'from-red-500/90 to-red-600/90',
          iconClass: 'text-white',
          icon: <FaTimesCircle className="w-5 h-5" />,
        };
      case 'info':
        return {
          bgClass: 'from-blue-500/90 to-blue-600/90',
          iconClass: 'text-white',
          icon: <FaInfoCircle className="w-5 h-5" />,
        };
      case 'warning':
        return {
          bgClass: 'from-amber-500/90 to-amber-600/90',
          iconClass: 'text-white',
          icon: <FaExclamationTriangle className="w-5 h-5" />,
        };
      default:
        return {
          bgClass: 'from-neutral-500/90 to-neutral-600/90',
          iconClass: 'text-white',
          icon: <FaInfoCircle className="w-5 h-5" />,
        };
    }
  }, [notification.type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className={`relative w-full max-w-sm backdrop-blur-md rounded-lg shadow-lg p-4 mb-2 overflow-hidden
                 bg-gradient-to-r ${notificationStyles.bgClass} border border-white/10`}
    >
      <div className="flex items-center justify-between">
        <div className={`mr-3 ${notificationStyles.iconClass}`}>
          {notificationStyles.icon}
        </div>
        <p className="flex-grow text-white font-medium text-sm">
          {notification.message}
        </p>
        <button
          onClick={handleRemove}
          className="ml-4 text-white/80 hover:text-white transition-colors"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {notification.duration && (
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          className="absolute bottom-0 left-0 h-1 bg-white/30"
          transition={{ duration: 0.1, ease: "linear" }}
        />
      )}
    </motion.div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;
