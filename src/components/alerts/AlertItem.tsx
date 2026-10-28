'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Notification } from '@/types/notificationTypes';

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

export const AlertItem: React.FC<NotificationItemProps> = React.memo(({ notification, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  const handleRemove = useCallback(() => {
    onRemoveRef.current(notification.id);
  }, [notification.id]);

  useEffect(() => {
    if (!notification.duration || notification.duration <= 0) return;

    const totalDuration = notification.duration;
    let remainingTime = totalDuration;
    let lastTime = Date.now();
    const intervalTime = 50;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTime;
      lastTime = now;

      if (isPausedRef.current) {
        return;
      }

      remainingTime -= elapsed;
      if (remainingTime <= 0) {
        clearInterval(interval);
        setProgress(0);
        onRemoveRef.current(notification.id);
      } else {
        setProgress(Math.max(0, (remainingTime / totalDuration) * 100));
      }
    }, intervalTime);

    return () => {
      clearInterval(interval);
    };
  }, [notification.duration, notification.id]);

  const config = useMemo(() => {
    switch (notification.type) {
      case 'success':
        return {
          borderClass: 'border-l-4 border-l-emerald-500',
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/15 border border-emerald-500/25',
          progressBar: 'bg-emerald-500',
          icon: <CheckCircle2 className="size-4" />,
          title: 'Success',
        };
      case 'error':
        return {
          borderClass: 'border-l-4 border-l-primary',
          iconColor: 'text-primary',
          iconBg: 'bg-primary/15 border border-primary/25',
          progressBar: 'bg-primary',
          icon: <XCircle className="size-4" />,
          title: 'Error',
        };
      case 'warning':
        return {
          borderClass: 'border-l-4 border-l-amber-500',
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/15 border border-amber-500/25',
          progressBar: 'bg-amber-500',
          icon: <AlertTriangle className="size-4" />,
          title: 'Warning',
        };
      case 'info':
      default:
        return {
          borderClass: 'border-l-4 border-l-sky-500',
          iconColor: 'text-sky-400',
          iconBg: 'bg-sky-500/15 border border-sky-500/25',
          progressBar: 'bg-sky-500',
          icon: <Info className="size-4" />,
          title: 'Info',
        };
    }
  }, [notification.type]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden pointer-events-auto backdrop-blur-md ${config.borderClass}`}
    >
      <div className="p-3.5 flex items-start gap-3">
        <div
          className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${config.iconBg} ${config.iconColor}`}
        >
          {config.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-foreground">
            {config.title}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed break-words">
            {notification.message}
          </div>
        </div>

        <button
          onClick={handleRemove}
          className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {notification.duration && notification.duration > 0 && (
        <div className="h-0.5 w-full bg-secondary/50">
          <div
            className={`h-full transition-all ease-linear ${config.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
});

AlertItem.displayName = 'AlertItem';
export default AlertItem;
