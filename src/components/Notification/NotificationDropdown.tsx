'use client';

import React, { useState, useMemo } from 'react';
import { useNavigate } from '@/lib/routerCompat';
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
  FaVolumeMute
} from 'react-icons/fa';
import { UserNotification } from '../../types/notificationTypes';
import { useNotification } from '../../context/AlertContext';
import { format } from 'timeago.js';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  getNotificationClipUrl,
  getNotificationNavigationState
} from '../../hooks/useNotifications';
import { safeLocalStorage } from '@/utils/storage';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  isSoundEnabled,
  onToggleSound
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // React Query hooks
  const { data, isLoading } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const allNotifications = data?.notifications || [];
  const unreadCount = data?.unreadCount ?? allNotifications.filter(n => !n.read).length;

  // Filter notifications
  const displayedNotifications = useMemo(() => {
    const list = filter === 'unread'
      ? allNotifications.filter(n => !n.read)
      : allNotifications;
    return list.slice(0, 8); // Top 8 in dropdown tray
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
      const state = getNotificationNavigationState(notification);
      navigate(clipUrl, { state });
    } catch {
      navigate(`/clips/${notification.clipId}`);
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  const getCategoryConfig = (type: string) => {
    switch (type) {
      case 'team_message':
        return {
          icon: <FaUsers size={12} />,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/15 border-indigo-500/30',
          label: 'Team Chat'
        };
      case 'comment_reply':
        return {
          icon: <FaComments size={12} />,
          color: 'text-[#f23030]',
          bg: 'bg-[#f23030]/15 border-[#f23030]/30',
          label: 'Reply'
        };
      case 'rating':
        return {
          icon: <FaStar size={12} />,
          color: 'text-amber-400',
          bg: 'bg-amber-500/15 border-amber-500/30',
          label: 'Rating'
        };
      case 'report':
        return {
          icon: <FaFlag size={12} />,
          color: 'text-rose-400',
          bg: 'bg-rose-500/15 border-rose-500/30',
          label: 'Report'
        };
      case 'mention':
        return {
          icon: <FaBell size={12} />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/15 border-emerald-500/30',
          label: 'Mention'
        };
      case 'system':
      default:
        return {
          icon: <FaInfoCircle size={12} />,
          color: 'text-sky-400',
          bg: 'bg-sky-500/15 border-sky-500/30',
          label: 'System'
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
              {/* Sound Toggle */}
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

              {/* Mark All as Read */}
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
                    {/* Unread Glow Dot */}
                    {!notification.read && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-[#f23030] shadow-[0_0_8px_#f23030]" />
                    )}

                    {/* Category Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 border ${category.bg} ${category.color} mt-0.5`}
                      title={category.label}
                    >
                      {category.icon}
                    </div>

                    {/* Content */}
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

                    {/* Action buttons (revealed on hover) */}
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

export default NotificationDropdown;
