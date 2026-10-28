'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheck, ChevronRight, Bell, Volume2, VolumeX } from 'lucide-react';
import { UserNotification } from '@/types/notificationTypes';
import { useNotification } from '@/context/AlertContext';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  getNotificationClipUrl,
} from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { Button } from '@/components/Button';

interface NotificationDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationDropdownMenu: React.FC<NotificationDropdownMenuProps> = ({
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
    const list = filter === 'unread' ? allNotifications.filter((n) => !n.read) : allNotifications;
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute right-0 mt-2.5 w-84 sm:w-96 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-[100] select-none flex flex-col text-foreground"
          style={{ transformOrigin: 'top right' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-3.5 px-4 bg-secondary/40 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full border border-primary/40">
                  {unreadCount > 99 ? '99+' : unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleSound}
                className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer ${
                  isSoundEnabled
                    ? 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary'
                }`}
                title={
                  isSoundEnabled
                    ? 'Notification sound enabled (click to mute)'
                    : 'Notification sound muted (click to enable)'
                }
              >
                {isSoundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="p-1.5 px-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="size-3.5 text-primary" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span>All</span>
              <span
                className={`text-[10px] px-1 rounded-full ${
                  filter === 'all' ? 'bg-white/20' : 'bg-secondary'
                }`}
              >
                {allNotifications.length}
              </span>
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                filter === 'unread'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    filter === 'unread' ? 'bg-white/20' : 'bg-primary/20 text-primary'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/80 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                  <Bell className="size-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  {filter === 'unread'
                    ? 'You are all caught up!'
                    : 'When you get comment replies, mentions, or ratings, they will appear here.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClick={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 bg-secondary/30 border-t border-border flex items-center justify-between">
            <Button
              variant="card"
              size="sm"
              pill
              fullWidth
              onClick={handleViewAll}
              rightIcon={<ChevronRight className="size-3.5 text-primary" />}
            >
              View all notifications
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdownMenu;
