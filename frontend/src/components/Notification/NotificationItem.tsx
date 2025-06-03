import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { Notification } from '../../types/notificationTypes';

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.duration, onRemove]);

  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bgClass: 'bg-green-100 dark:bg-green-900/30',
          iconClass: 'text-green-500',
          icon: <FaCheckCircle className="w-5 h-5" />,
        };
      case 'error':
        return {
          bgClass: 'bg-red-100 dark:bg-red-900/30',
          iconClass: 'text-red-500',
          icon: <FaTimesCircle className="w-5 h-5" />,
        };
      case 'info':
        return {
          bgClass: 'bg-blue-100 dark:bg-blue-900/30',
          iconClass: 'text-blue-500',
          icon: <FaInfoCircle className="w-5 h-5" />,
        };
      case 'warning':
        return {
          bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconClass: 'text-yellow-500',
          icon: <FaExclamationTriangle className="w-5 h-5" />,
        };
      default:
        return {
          bgClass: 'bg-neutral-100 dark:bg-neutral-800',
          iconClass: 'text-neutral-500',
          icon: <FaInfoCircle className="w-5 h-5" />,
        };
    }
  };

  const styles = getNotificationStyles();

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      className={`flex items-center p-3 pr-4 rounded-lg shadow-lg backdrop-blur-lg min-w-[18rem] max-w-md ${styles.bgClass} border border-white/10`}
    >
      <div className={`mr-3 ${styles.iconClass}`}>
        {styles.icon}
      </div>
      <p className="flex-grow text-sm text-neutral-900 dark:text-neutral-100">
        {notification.message}
      </p>
      <button
        onClick={() => onRemove(notification.id)}
        className="ml-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default NotificationItem;
