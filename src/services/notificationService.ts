import { safeLocalStorage } from '@/utils/storage';
import { apiClient } from '@/lib/apiClient';
import { UserNotification, UserNotificationResponse, UnreadCountResponse } from '../types/notificationTypes';
import { getCurrentUser } from './userService';
import { User } from '../types/adminTypes';

/**
 * Check if the notifications API is available
 */
export const checkNotificationsApiAvailability = async (): Promise<boolean> => {
  try {
    if (!isAuthenticated()) {
      return false;
    }

    await apiClient.head(`/api/notifications`);
    return true;
  } catch (error: any) {
    const status = error?.status || error?.response?.status;
    if (status === 404 || status === 401) {
      console.log('Notifications API not available or authentication required, disabling notification features');
      return false;
    }
    // For other errors, assume API is available but there's a temporary issue
    return true;
  }
};

/**
 * Fetch all notifications for the current user
 */
export const fetchNotifications = async (): Promise<UserNotificationResponse> => {
  try {
    return await apiClient.get<UserNotificationResponse>(`/api/notifications`);
  } catch (error) {
    console.error('Error fetching notifications', error);
    throw new Error('Failed to load notifications');
  }
};

/**
 * Fetch unread notification count
 */
export const fetchUnreadCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get<UnreadCountResponse>(`/api/notifications/unread-count`);
    return response.unreadCount;
  } catch {
    console.log('Could not fetch notification count - API may not be implemented yet');
    return 0;
  }
};

/**
 * Mark a specific notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await apiClient.put(`/api/notifications/${notificationId}/read`);
  } catch (error) {
    console.error('Error marking notification as read', error);
    throw new Error('Failed to update notification');
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await apiClient.put(`/api/notifications/read-all`);
  } catch (error) {
    console.error('Error marking all notifications as read', error);
    throw new Error('Failed to update notifications');
  }
};

/**
 * Delete a specific notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/notifications/${notificationId}`);
  } catch (error) {
    console.error('Error deleting notification', error);
    throw new Error('Failed to delete notification');
  }
};

/**
 * Clear all read notifications (or all notifications if all=true)
 */
export const clearNotifications = async (all = false): Promise<void> => {
  try {
    await apiClient.delete(`/api/notifications`, {
      params: all ? { all: 'true' } : undefined,
    });
  } catch (error) {
    console.error('Error clearing notifications', error);
    throw new Error('Failed to clear notifications');
  }
};

/**
 * Utility function to get the appropriate navigation state for a notification
 */
export const getNotificationNavigationState = (notification: UserNotification) => {
  if (notification.type === 'team_message') {
    return {
      openTeamChat: true,
      messageId: notification.entityId,
    };
  } else if (notification.type === 'comment_reply') {
    return {
      highlightComment: notification.entityId,
      highlightReply: notification.replyId,
    };
  } else if (notification.type === 'report' || notification.type === 'report_update') {
    return {
      highlightReport: notification.entityId,
    };
  } else {
    return {
      highlightComment: notification.entityId,
    };
  }
};

/**
 * Get the clip URL for a notification
 */
export const getNotificationClipUrl = async (notification: UserNotification): Promise<string> => {
  if (notification.type === 'report' || notification.type === 'report_update') {
    const currentUser: User = await getCurrentUser();
    if (currentUser) {
      try {
        const isAdmin = currentUser.roles && Array.isArray(currentUser.roles) && currentUser.roles.includes('admin');
        if (isAdmin) {
          return '/admin?tab=reports';
        } else {
          return '/my-reports';
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return '/my-reports';
      }
    }
    return '/my-reports';
  }
  return notification.clipId ? `/clips/${notification.clipId}` : '/notifications';
};

/**
 * Check if user is authenticated (has token)
 */
export const isAuthenticated = (): boolean => {
  return !!safeLocalStorage.getItem('token');
};