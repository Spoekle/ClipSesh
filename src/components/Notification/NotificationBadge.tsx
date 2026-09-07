'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaBell } from 'react-icons/fa';
import NotificationDropdown from './NotificationDropdown';
import { useUnreadCount } from '../../hooks/useNotifications';
import { safeLocalStorage } from '@/utils/storage';

// Clean Web Audio API notification chime (no external MP3 asset needed)
const playNotificationChime = () => {
  if (typeof window === 'undefined') return;
  const isMuted = safeLocalStorage.getItem('notificationSound') === 'false';
  if (isMuted) return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // High note 1 (D5 - 587.33Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.06, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.2);

    // Note 2 (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay restrictions or unavailable audio context
  }
};

interface NotificationBadgeProps {
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className = '' }) => {
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

  // Play gentle sound when unread count increases
  useEffect(() => {
    if (previousUnreadRef.current !== null && unreadCount > previousUnreadRef.current) {
      if (isSoundEnabled) {
        playNotificationChime();
      }
    }
    previousUnreadRef.current = unreadCount;
  }, [unreadCount, isSoundEnabled]);

  // Handle click outside and Escape key
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
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'Notifications'}
        className={`relative p-2 rounded-full transition-colors border ${
          isOpen
            ? 'bg-[#1a1a1a] border-[#262626] text-white'
            : 'text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a] border-transparent'
        }`}
      >
        <FaBell size={16} />

        {unreadCount > 0 && (
          <>
            {/* Pulsing ring indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#f23030] rounded-full animate-ping opacity-40" />

            {/* Badge Pill */}
            <span className="absolute -top-1 -right-1 bg-[#f23030] text-white text-[10px] font-extrabold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-md border border-[#0f0f0f]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </motion.button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={toggleSound}
      />
    </div>
  );
};

export default NotificationBadge;
