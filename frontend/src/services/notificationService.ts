import axios from 'axios';
import { UserNotification, UserNotificationResponse, UnreadCountResponse } from '../types/notificationTypes';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.spoekle.com';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return { Authorization: `Bearer ${token}` };
};

/**
 * Check if the notifications API is available
 */
export const checkNotificationsApiAvailability = async (): Promise<boolean> => {
  try {
    // Only check if user is authenticated
    if (!isAuthenticated()) {
      return false;
    }

    await axios.head(`${backendUrl}/api/notifications`, {
      headers: getAuthHeaders()
    });
    return true;
  } catch (error: any) {
    if (error.response && (error.response.status === 404 || error.response.status === 401)) {
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
    const response = await axios.get<UserNotificationResponse>(
      `${backendUrl}/api/notifications`,
      { headers: getAuthHeaders() }
    );
    return response.data;
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
    const response = await axios.get<UnreadCountResponse>(
      `${backendUrl}/api/notifications/unread-count`,
      { headers: getAuthHeaders() }
    );
    return response.data.unreadCount;  
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
    await axios.put(
      `${backendUrl}/api/notifications/${notificationId}/read`,
      {},
      { headers: getAuthHeaders() }
    );
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
    await axios.put(
      `${backendUrl}/api/notifications/read-all`,
      {},
      { headers: getAuthHeaders() }
    );
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
    await axios.delete(
      `${backendUrl}/api/notifications/${notificationId}`,
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    console.error('Error deleting notification', error);
    throw new Error('Failed to delete notification');
  }
};

/**
 * Utility function to get the appropriate navigation state for a notification
 */
export const getNotificationNavigationState = (notification: UserNotification) => {
  if (notification.type === 'team_message') {
    return {
      openTeamChat: true,
      messageId: notification.entityId
    };
  } else if (notification.type === 'comment_reply') {
    return {
      highlightComment: notification.entityId,
      highlightReply: notification.replyId
    };
  } else {
    return {
      highlightComment: notification.entityId
    };
  }
};

/**
 * Get the clip URL for a notification
 */
export const getNotificationClipUrl = (notification: UserNotification): string => {
  return `/clips/${notification.clipId}`;
};

/**
 * Check if user is authenticated (has token)
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};