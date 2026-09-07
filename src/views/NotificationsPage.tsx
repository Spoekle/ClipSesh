'use client';

import React, { useState, useMemo } from 'react';
import { Helmet } from '@/lib/helmetCompat';
import { useNavigate } from '@/lib/routerCompat';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaRegBell,
  FaUsers,
  FaComments,
  FaStar,
  FaFlag,
  FaInfoCircle,
  FaFilter,
  FaHome,
  FaBroom,
} from 'react-icons/fa';
import { UserNotification } from '../types/notificationTypes';
import { useNotification } from '../context/AlertContext';
import LoadingBar from 'react-top-loading-bar';
import { format } from 'timeago.js';
import * as notificationService from '../services/notificationService';
import Breadcrumbs from '../components/common/Breadcrumbs';

import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useClearNotifications,
} from '../hooks/useNotifications';

type NotificationCategory = 'all' | 'personal' | 'team' | 'ratings';

const NotificationsPage: React.FC = () => {
  const { data: notificationResponse, isLoading: loading, error } = useNotifications();
  const notifications = notificationResponse?.notifications || [];
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const clearNotificationsMutation = useClearNotifications();

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (loading) {
      setProgress(40);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 400);
    }
  }, [loading]);

  React.useEffect(() => {
    if (!notificationService.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  React.useEffect(() => {
    if (error) {
      showError('Failed to load notifications');
    }
  }, [error, showError]);

  // Filter notifications by category and unread status
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // Unread filter
      if (unreadOnly && notification.read) return false;

      // Category filter
      switch (activeCategory) {
        case 'personal':
          return notification.type === 'comment_reply' || notification.type === 'mention';
        case 'team':
          return notification.type === 'team_message';
        case 'ratings':
          return notification.type === 'rating' || notification.type === 'report';
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
      (n) => n.type === 'rating' || n.type === 'report'
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
      navigate(clipUrl, { state });
    } catch {
      navigate(`/clips/${notification.clipId}`);
    }
  };

  const getCategoryConfig = (type: string) => {
    switch (type) {
      case 'team_message':
        return {
          icon: <FaUsers size={13} />,
          color: 'text-neutral-300',
          bg: 'bg-[#222222] border-[#2e2e2e]',
          label: 'Team Chat',
        };
      case 'comment_reply':
        return {
          icon: <FaComments size={13} />,
          color: 'text-[#f23030]',
          bg: 'bg-[#f23030]/15 border-[#f23030]/30',
          label: 'Comment Reply',
        };
      case 'mention':
        return {
          icon: <FaBell size={13} />,
          color: 'text-neutral-300',
          bg: 'bg-[#222222] border-[#2e2e2e]',
          label: 'Mention',
        };
      case 'rating':
        return {
          icon: <FaStar size={13} />,
          color: 'text-amber-400',
          bg: 'bg-[#222222] border-[#2e2e2e]',
          label: 'Rating',
        };
      case 'report':
        return {
          icon: <FaFlag size={13} />,
          color: 'text-red-400',
          bg: 'bg-[#222222] border-[#2e2e2e]',
          label: 'Report',
        };
      case 'system':
      default:
        return {
          icon: <FaInfoCircle size={13} />,
          color: 'text-neutral-300',
          bg: 'bg-[#222222] border-[#2e2e2e]',
          label: 'System',
        };
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#0f0f0f] text-[#f1f1f1] transition-colors flex flex-col">
      <Helmet>
        <title>Notifications • ClipSesh</title>
        <meta name="description" content="Manage your notifications and alerts on ClipSesh." />
      </Helmet>

      <div className="w-full">
        <LoadingBar
          color="#f23030"
          height={3}
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
        />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-6 md:py-8 grow flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-3">
            <Breadcrumbs
              items={[
                { label: 'Home', path: '/', icon: <FaHome className="w-3.5 h-3.5" /> },
                { label: 'Notifications' },
              ]}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f1f1] tracking-tight">
                Notifications
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#aaaaaa] leading-relaxed max-w-xl">
                Stay updated on clip discussions, ratings, team chats, and mentions.
              </p>
            </div>

            {/* Top Toolbar Actions */}
            <div className="flex items-center gap-2 self-start sm:self-end flex-wrap">
              {counts.unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="bg-[#1e1e1e] hover:bg-[#282828] border border-[#2e2e2e] text-[#f1f1f1] text-xs rounded-full flex items-center gap-1.5 px-3.5 py-1.5 font-medium transition-colors"
                  title="Mark all as read"
                >
                  <FaCheckDouble size={11} className="text-[#f23030]" />
                  <span>Mark all read</span>
                </button>
              )}

              {notifications.some((n) => n.read) && (
                <button
                  type="button"
                  onClick={handleClearRead}
                  disabled={clearNotificationsMutation.isPending}
                  className="bg-[#1e1e1e] hover:bg-[#282828] border border-[#2e2e2e] text-[#aaaaaa] hover:text-white text-xs rounded-full flex items-center gap-1.5 px-3.5 py-1.5 font-medium transition-colors"
                  title="Clear all read notifications"
                >
                  <FaBroom size={12} />
                  <span>Clear read</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Container Card */}
        <div className="bg-[#181818] rounded-xl shadow-sm border border-[#262626] overflow-hidden flex flex-col">
          {/* Controls Bar: Category Tabs & Filters */}
          <div className="p-3 sm:p-4 border-b border-[#262626] bg-[#141414] flex flex-wrap items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="inline-flex p-1 bg-[#121212] rounded-full border border-[#2a2a2a] gap-1 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`py-1 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-[#f1f1f1] text-[#0f0f0f] font-semibold shadow-xs'
                    : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                }`}
              >
                <span>All</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCategory === 'all'
                      ? 'bg-neutral-300 text-neutral-900 font-bold'
                      : 'bg-[#222222] text-[#aaaaaa]'
                  }`}
                >
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('personal')}
                className={`py-1 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === 'personal'
                    ? 'bg-[#f1f1f1] text-[#0f0f0f] font-semibold shadow-xs'
                    : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                }`}
              >
                <span>Replies & Mentions</span>
                {counts.personal > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeCategory === 'personal'
                        ? 'bg-neutral-300 text-neutral-900 font-bold'
                        : 'bg-[#222222] text-[#aaaaaa]'
                    }`}
                  >
                    {counts.personal}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('team')}
                className={`py-1 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === 'team'
                    ? 'bg-[#f1f1f1] text-[#0f0f0f] font-semibold shadow-xs'
                    : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                }`}
              >
                <span>Team Chat</span>
                {counts.team > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeCategory === 'team'
                        ? 'bg-neutral-300 text-neutral-900 font-bold'
                        : 'bg-[#222222] text-[#aaaaaa]'
                    }`}
                  >
                    {counts.team}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('ratings')}
                className={`py-1 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === 'ratings'
                    ? 'bg-[#f1f1f1] text-[#0f0f0f] font-semibold shadow-xs'
                    : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                }`}
              >
                <span>Ratings & Reports</span>
                {counts.ratings > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeCategory === 'ratings'
                        ? 'bg-neutral-300 text-neutral-900 font-bold'
                        : 'bg-[#222222] text-[#aaaaaa]'
                    }`}
                  >
                    {counts.ratings}
                  </span>
                )}
              </button>
            </div>

            {/* Unread Only Toggle */}
            <button
              type="button"
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                unreadOnly
                  ? 'bg-[#f23030]/15 border-[#f23030]/40 text-[#f23030] shadow-xs'
                  : 'bg-[#121212] border-[#2a2a2a] text-[#aaaaaa] hover:text-white hover:border-[#383838]'
              }`}
            >
              <FaFilter size={10} className={unreadOnly ? 'text-[#f23030]' : 'text-[#717171]'} />
              <span>Unread only</span>
              {counts.unread > 0 && (
                <span className="bg-[#f23030] text-white text-[10px] font-bold px-1.5 rounded-full">
                  {counts.unread}
                </span>
              )}
            </button>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-[#262626] min-h-[300px]">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-[#262626] border-t-[#f23030] rounded-full animate-spin" />
                <span className="text-xs text-[#aaaaaa]">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mb-3.5 text-[#717171]">
                  <FaRegBell size={22} />
                </div>
                <h3 className="text-sm font-semibold text-[#f1f1f1] mb-1">
                  {unreadOnly ? 'No unread notifications' : 'No notifications in this category'}
                </h3>
                <p className="text-xs text-[#aaaaaa] max-w-sm mb-5 leading-relaxed">
                  {unreadOnly
                    ? 'You are all caught up! Toggle off "Unread only" to view past activity.'
                    : 'Activity related to your clips, comments, and ratings will appear here.'}
                </p>
                {unreadOnly ? (
                  <button
                    type="button"
                    onClick={() => setUnreadOnly(false)}
                    className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#222222] hover:bg-[#2a2a2a] text-[#f1f1f1] border border-[#2e2e2e] transition-colors"
                  >
                    View all notifications
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/clips')}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#f23030] hover:bg-[#d92222] text-white transition-colors"
                  >
                    Explore Clips
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredNotifications.map((notification) => {
                  const category = getCategoryConfig(notification.type);

                  return (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.15 }}
                      onClick={() => navigateToTarget(notification)}
                      className={`group p-4 sm:p-4.5 flex items-start gap-3.5 transition-all duration-150 cursor-pointer relative ${
                        !notification.read
                          ? 'bg-[#f23030]/[0.04] hover:bg-[#f23030]/[0.08]'
                          : 'hover:bg-[#1e1e1e]'
                      }`}
                    >
                      {/* Left accent bar for unread notifications */}
                      {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f23030]" />
                      )}

                      {/* Category Icon Badge */}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${category.bg} ${category.color} mt-0.5`}
                        title={category.label}
                      >
                        {category.icon}
                      </div>

                      {/* Content Body */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-[#f1f1f1]">
                            {notification.senderUsername || 'ClipSesh'}
                          </span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.2 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#aaaaaa]">
                            {category.label}
                          </span>
                          <span className="text-[#3a3a3a]">•</span>
                          <span className="text-[11px] text-[#717171]">
                            {format(new Date(notification.createdAt))}
                          </span>
                        </div>

                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            !notification.read ? 'text-[#f1f1f1] font-medium' : 'text-[#aaaaaa]'
                          }`}
                        >
                          {notification.message}
                        </p>
                      </div>

                      {/* Action buttons on hover */}
                      <div
                        className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-1.5 text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222] rounded-md transition-colors"
                            title="Mark as read"
                          >
                            <FaCheck size={11} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(notification._id)}
                          className="p-1.5 text-[#717171] hover:text-red-400 hover:bg-[#222222] rounded-md transition-colors"
                          title="Delete notification"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
