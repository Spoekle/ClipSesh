'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaRegBell } from 'react-icons/fa';
import { UserNotification } from '@/types/notificationTypes';
import { useNotification } from '@/context/AlertContext';
import * as notificationService from '@/services/notificationService';
import RequireAuth from '@/components/RequireAuth';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useClearNotifications,
} from '@/hooks/useNotifications';
import NotificationHeader from './components/NotificationHeader';
import NotificationFilters, { NotificationCategory } from './components/NotificationFilters';
import NotificationRow from './components/NotificationRow';

const NotificationsPage: React.FC = () => {
  const { data: notificationResponse, isLoading: loading, error } = useNotifications();
  const notifications = notificationResponse?.notifications || [];
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const clearNotificationsMutation = useClearNotifications();

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const { showSuccess, showError } = useNotification();
  const router = useRouter();

  useEffect(() => {
    if (!notificationService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (error) {
      showError('Failed to load notifications');
    }
  }, [error, showError]);

  // Filter notifications by category and unread status
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (unreadOnly && notification.read) return false;

      switch (activeCategory) {
        case 'personal':
          return notification.type === 'comment_reply' || notification.type === 'mention';
        case 'team':
          return notification.type === 'team_message';
        case 'ratings':
          return (
            notification.type === 'rating' ||
            notification.type === 'report' ||
            notification.type === 'report_update'
          );
        case 'all':
        default:
          return true;
      }
    });
  }, [notifications, activeCategory, unreadOnly]);

  const counts = useMemo(() => {
    const unread = notifications.filter((n) => !n.read).length;
    const personal = notifications.filter(
      (n) => n.type === 'comment_reply' || n.type === 'mention'
    ).length;
    const team = notifications.filter((n) => n.type === 'team_message').length;
    const ratings = notifications.filter(
      (n) => n.type === 'rating' || n.type === 'report' || n.type === 'report_update'
    ).length;

    return {
      all: notifications.length,
      unread,
      personal,
      team,
      ratings,
    };
  }, [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch {
      showError('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      showSuccess('All notifications marked as read');
    } catch {
      showError('Failed to update notifications');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      showSuccess('Notification deleted');
    } catch {
      showError('Failed to delete notification');
    }
  };

  const handleClearRead = async () => {
    try {
      await clearNotificationsMutation.mutateAsync(false);
      showSuccess('Cleared read notifications');
    } catch {
      showError('Failed to clear notifications');
    }
  };

  const navigateToTarget = async (notification: UserNotification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id);
    }

    try {
      const clipUrl = await notificationService.getNotificationClipUrl(notification);
      const state = notificationService.getNotificationNavigationState(notification);
      const url = new URL(
        clipUrl,
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      );
      if (state) {
        Object.entries(state).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            url.searchParams.set(k, String(v));
          }
        });
      }
      router.push(url.pathname + url.search);
    } catch {
      router.push(`/clips/${notification.clipId}`);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-cc-ground text-cc-text transition-colors flex flex-col">
      <NotificationHeader
        unreadCount={counts.unread}
        readCount={counts.all - counts.unread}
        isMarkAllPending={markAllAsReadMutation.isPending}
        isClearPending={clearNotificationsMutation.isPending}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearRead={handleClearRead}
      />

      <div className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-6">
        <NotificationFilters
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          unreadOnly={unreadOnly}
          setUnreadOnly={setUnreadOnly}
          counts={counts}
        />

        {/* Notifications Container */}
        <div className="bg-cc-card border border-border rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-border/40 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-border/40 rounded w-1/3" />
                    <div className="h-3 bg-border/40 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-cc-ground border border-border flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <FaRegBell size={26} />
              </div>
              <h3 className="text-base font-bold text-cc-text mb-1">
                {unreadOnly ? 'No unread notifications' : 'No notifications found'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {unreadOnly
                  ? 'You are all caught up on your unread updates.'
                  : 'Notifications about replies, mentions, and ratings will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <NotificationRow
                  key={notification._id}
                  notification={notification}
                  onClick={navigateToTarget}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <RequireAuth>
      <NotificationsPage />
    </RequireAuth>
  );
}