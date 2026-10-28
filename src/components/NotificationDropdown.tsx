'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { safeLocalStorage } from '@/utils/storage';
import { useUnreadCount } from '../hooks/useNotifications';
import { playNotificationChime } from './notifications/NotificationAudio';
import { NotificationDropdownMenu } from './notifications/NotificationDropdownMenu';

export { NotificationDropdownMenu };

interface NotificationBadgeProps {
  className?: string;
}

export default function NotificationBadge({ className = '' }: NotificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousUnreadRef = useRef<number | null>(null);

  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    return safeLocalStorage.getItem('notificationSound') !== 'false';
  });

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      safeLocalStorage.setItem('notificationSound', next ? 'true' : 'false');
      return next;
    });
  }, []);

  const { data: unreadCount = 0 } = useUnreadCount();

  useEffect(() => {
    if (previousUnreadRef.current !== null && unreadCount > previousUnreadRef.current) {
      if (isSoundEnabled) {
        playNotificationChime();
      }
    }
    previousUnreadRef.current = unreadCount;
  }, [unreadCount, isSoundEnabled]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
            : 'Notifications'
        }
        className={`relative p-2 rounded-full transition-colors border cursor-pointer ${
          isOpen
            ? 'bg-cc-card border-border text-white'
            : 'text-muted-foreground hover:text-white hover:bg-cc-card border-transparent'
        }`}
      >
        <Bell className="size-4" />

        {unreadCount > 0 && (
          <>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full animate-ping opacity-40" />
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-extrabold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-md border border-cc-ground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </motion.button>

      <NotificationDropdownMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={toggleSound}
      />
    </div>
  );
}

export { NotificationBadge };
