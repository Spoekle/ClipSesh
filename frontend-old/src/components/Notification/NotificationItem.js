import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from 'react-icons/fa';
import { NOTIFICATION_TYPES } from '../../context/NotificationContext';

const NotificationItem = ({ notification, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const { id, type, message, duration } = notification;
  
  // Setup for progress bar animation
  useEffect(() => {
    if (duration === 0) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const updateProgress = () => {
      const now = Date.now();
      const remaining = endTime - now;
      const percentage = (remaining / duration) * 100;
      
      setProgress(Math.max(0, percentage));
      
      if (percentage > 0) {
        requestAnimationFrame(updateProgress);
      }
    };
    
    const animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [duration]);

  // Get appropriate icon and styles based on notification type
  const getTypeStyles = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return {
          icon: <FaCheckCircle className="text-lg" />,
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-500',
          progressColor: 'bg-green-500'
        };
      case NOTIFICATION_TYPES.ERROR:
        return {
          icon: <FaTimesCircle className="text-lg" />,
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-500',
          progressColor: 'bg-red-500'
        };
      case NOTIFICATION_TYPES.WARNING:
        return {
          icon: <FaExclamationTriangle className="text-lg" />,
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-800 dark:text-amber-200',
          borderColor: 'border-amber-500',
          progressColor: 'bg-amber-500'
        };
      default:
        return {
          icon: <FaInfoCircle className="text-lg" />,
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-500',
          progressColor: 'bg-blue-500'
        };
    }
  };

  const { icon, bgColor, textColor, borderColor, progressColor } = getTypeStyles();

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`${bgColor} ${textColor} backdrop-blur-sm p-3 rounded-lg shadow-lg border-l-4 ${borderColor} flex items-start w-full max-w-md relative overflow-hidden`}
    >
      <div className="flex-shrink-0 mr-2 pt-0.5">
        {icon}
      </div>
      
      <div className="flex-1 pr-6">
        <p className="font-medium">{message}</p>
      </div>
      
      <button
        onClick={() => onRemove(id)}
        className="absolute top-3 right-3 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-1 transition-colors"
        aria-label="Close notification"
      >
        <FaTimes />
      </button>
      
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
          <div
            className={`h-full ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default NotificationItem;
