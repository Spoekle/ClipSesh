'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaAngleRight,
  FaRegBell,
  FaUsers,
  FaComments,
  FaStar,
  FaFlag,
  FaInfoCircle,
  FaVolumeUp,
  FaVolumeMute,
} from 'react-icons/fa';
import { UserNotification } from '../types/notificationTypes';
import { useNotification } from '../context/AlertContext';
import { format } from 'timeago.js';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  getNotificationClipUrl,
} from '../hooks/useNotifications';
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

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationDropdownMenu: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  isSoundEnabled,
  onToggleSound,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const { data, isLoading } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const allNotifications = data?.notifications || [];
  const unreadCount = data?.unreadCount ?? allNotifications.filter((n) => !n.read).length;

  const displayedNotifications = useMemo(() => {
    const list = filter === 'unread'
      ? allNotifications.filter((n) => !n.read)
      : allNotifications;
    return list.slice(0, 8);
  }, [allNotifications, filter]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch {
      showError('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      showSuccess('All notifications marked as read');
    } catch {
      showError('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      showError('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id);
    }
    onClose();

    try {
      const clipUrl = await getNotificationClipUrl(notification);
      router.push(clipUrl);
    } catch {
      router.push(`/clips/${notification.clipId}`);
    }
  };

  const handleViewAll = () => {
    onClose();
    router.push('/notifications');
  };

  const getCategoryConfig = (type: string) => {
    switch (type) {
      case 'team_message':
        return {
          icon: <FaUsers size={12} />,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/15 border-indigo-500/30',
          label: 'Team Chat',
        };
      case 'comment_reply':
        return {
          icon: <FaComments size={12} />,
          color: 'text-[#f23030]',
          bg: 'bg-[#f23030]/15 border-[#f23030]/30',
          label: 'Reply',
        };
      case 'rating':
        return {
          icon: <FaStar size={12} />,
          color: 'text-amber-400',
          bg: 'bg-amber-500/15 border-amber-500/30',
          label: 'Rating',
        };
      case 'report':
      case 'report_update':
        return {
          icon: <FaFlag size={12} />,
          color: 'text-rose-400',
          bg: 'bg-rose-500/15 border-rose-500/30',
          label: 'Report',
        };
      case 'mention':
        return {
          icon: <FaBell size={12} />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/15 border-emerald-500/30',
          label: 'Mention',
        };
      case 'system':
      default:
        return {
          icon: <FaInfoCircle size={12} />,
          color: 'text-sky-400',
          bg: 'bg-sky-500/15 border-sky-500/30',
          label: 'System',
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute right-0 mt-2.5 w-84 sm:w-96 bg-[#181818] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] border border-[#262626] overflow-hidden z-[100] select-none flex flex-col"
          style={{ transformOrigin: 'top right' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-3.5 px-4 bg-[#141414] border-b border-[#262626] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#f1f1f1] flex items-center gap-1.5">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#f23030]/20 text-[#f23030] text-[10px] font-bold rounded-full border border-[#f23030]/40">
                  {unreadCount > 99 ? '99+' : unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleSound}
                className={`p-1.5 rounded-[6px] transition-colors text-xs flex items-center gap-1 ${
                  isSoundEnabled
                    ? 'text-[#aaaaaa] hover:text-white hover:bg-white/5'
                    : 'text-[#717171] hover:text-[#aaaaaa] hover:bg-white/5'
                }`}
                title={isSoundEnabled ? 'Notification sound enabled (click to mute)' : 'Notification sound muted (click to enable)'}
              >
                {isSoundEnabled ? <FaVolumeUp size={12} /> : <FaVolumeMute size={12} />}
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="p-1.5 px-2 rounded-[6px] text-xs font-medium text-[#aaaaaa] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
                  title="Mark all as read"
                >
                  <FaCheckDouble size={11} className="text-[#f23030]" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 border-b border-[#262626] bg-[#181818] flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filter === 'all'
                  ? 'bg-[#f23030] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-white hover:bg-[#141414]'
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1 rounded-full ${filter === 'all' ? 'bg-white/20' : 'bg-[#262626]'}`}>
                {allNotifications.length}
              </span>
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-[#f23030] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-white hover:bg-[#141414]'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className={`text-[10px] px-1 rounded-full ${filter === 'unread' ? 'bg-white/20' : 'bg-[#f23030]/20 text-[#f23030]'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#262626]/80 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-6 h-6 border-2 border-[#262626] border-t-[#f23030] rounded-full animate-spin" />
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center mx-auto mb-3 text-[#717171]">
                  <FaRegBell size={20} />
                </div>
                <p className="text-xs font-semibold text-[#f1f1f1]">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-[#aaaaaa] mt-1 max-w-xs mx-auto">
                  {filter === 'unread'
                    ? 'You are all caught up!'
                    : 'When you get comment replies, mentions, or ratings, they will appear here.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notification) => {
                const category = getCategoryConfig(notification.type);
                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group p-3 px-4 flex items-start gap-3 cursor-pointer transition-all duration-150 relative ${
                      !notification.read
                        ? 'bg-[#f23030]/[0.06] hover:bg-[#f23030]/[0.10]'
                        : 'hover:bg-[#141414]'
                    }`}
                  >
                    {!notification.read && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-[#f23030] shadow-[0_0_8px_#f23030]" />
                    )}

                    <div
                      className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 border ${category.bg} ${category.color} mt-0.5`}
                      title={category.label}
                    >
                      {category.icon}
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-[#f1f1f1] truncate">
                          {notification.senderUsername || 'Notification'}
                        </span>
                        <span className="text-[10px] text-[#717171] shrink-0 font-medium">
                          {format(new Date(notification.createdAt))}
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-snug line-clamp-2 ${
                          !notification.read ? 'text-[#f1f1f1] font-medium' : 'text-[#aaaaaa]'
                        }`}
                      >
                        {notification.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!notification.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                          className="p-1.5 text-[#aaaaaa] hover:text-[#f23030] hover:bg-white/5 rounded-[6px] transition-colors"
                          title="Mark as read"
                        >
                          <FaCheck size={10} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notification._id, e)}
                        className="p-1.5 text-[#717171] hover:text-rose-400 hover:bg-white/5 rounded-[6px] transition-colors"
                        title="Delete"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 bg-[#141414] border-t border-[#262626] flex items-center justify-between">
            <button
              onClick={handleViewAll}
              className="w-full py-2 text-xs font-bold text-white bg-[#222222] hover:bg-[#2a2a2a] border border-[#262626] rounded-full transition-all flex items-center justify-center gap-1.5 hover:border-[#f23030]/50"
            >
              <span>View all notifications</span>
              <FaAngleRight size={12} className="text-[#f23030]" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

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
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#f23030] rounded-full animate-ping opacity-40" />
            <span className="absolute -top-1 -right-1 bg-[#f23030] text-white text-[10px] font-extrabold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-md border border-[#0f0f0f]">
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
