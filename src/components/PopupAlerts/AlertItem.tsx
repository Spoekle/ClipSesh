import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';
import { Notification } from '../../types/notificationTypes';

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = React.memo(({ notification, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  const handleRemove = useCallback(() => {
    onRemove(notification.id);
  }, [notification.id, onRemove]);

  useEffect(() => {
    if (!notification.duration) return;

    const totalDuration = notification.duration;
    const intervalTime = 50;
    const step = (100 / (totalDuration / intervalTime));

    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        setProgress((prev) => {
          const next = prev - step;
          if (next <= 0) {
            clearInterval(interval);
            handleRemove();
            return 0;
          }
          return next;
        });
      }
    }, intervalTime);

    return () => {
      clearInterval(interval);
    };
  }, [notification.duration, handleRemove]);

  const config = useMemo(() => {
    switch (notification.type) {
      case 'success':
        return {
          borderClass: 'border-l-4 border-l-emerald-500',
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/15 border border-emerald-500/25',
          progressBar: 'bg-emerald-500',
          icon: <FaCheckCircle className="w-4 h-4" />,
          title: 'Success'
        };
      case 'error':
        return {
          borderClass: 'border-l-4 border-l-[#f23030]',
          iconColor: 'text-[#f23030]',
          iconBg: 'bg-[#f23030]/15 border border-[#f23030]/25',
          progressBar: 'bg-[#f23030]',
          icon: <FaTimesCircle className="w-4 h-4" />,
          title: 'Error'
        };
      case 'warning':
        return {
          borderClass: 'border-l-4 border-l-amber-500',
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/15 border border-amber-500/25',
          progressBar: 'bg-amber-500',
          icon: <FaExclamationTriangle className="w-4 h-4" />,
          title: 'Warning'
        };
      case 'info':
      default:
        return {
          borderClass: 'border-l-4 border-l-sky-500',
          iconColor: 'text-sky-400',
          iconBg: 'bg-sky-500/15 border border-sky-500/25',
          progressBar: 'bg-sky-500',
          icon: <FaInfoCircle className="w-4 h-4" />,
          title: 'Notice'
        };
    }
  }, [notification.type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-sm bg-[#181818]/95 backdrop-blur-md rounded-2xl shadow-2xl p-3.5 mb-2.5 overflow-hidden border border-[#262626] ${config.borderClass} select-none transition-all duration-200 hover:border-[#383838]`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${config.iconBg} ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="flex-grow min-w-0 pr-1">
          <p className="text-[#f1f1f1] font-medium text-xs leading-relaxed break-words">
            {notification.message}
          </p>
        </div>
        <button
          onClick={handleRemove}
          className="text-[#717171] hover:text-white transition-colors p-1 rounded-md hover:bg-white/5 shrink-0"
          title="Dismiss"
        >
          <FaTimes className="w-3 h-3" />
        </button>
      </div>

      {/* Progress bar */}
      {notification.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#121212]">
          <div
            style={{ width: `${progress}%` }}
            className={`h-full transition-all duration-75 ease-linear ${config.progressBar}`}
          />
        </div>
      )}
    </motion.div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;
