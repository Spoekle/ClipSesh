import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as notificationService from '../services/notificationService';

// Hook for checking notification API availability
export const useNotificationApiAvailability = () => {
  return useQuery({
    queryKey: ['notifications', 'api-availability'],
    queryFn: () => notificationService.checkNotificationsApiAvailability(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(localStorage.getItem('token')),
  });
};

// Hook for fetching all notifications
export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationService.fetchNotifications(),
    enabled: Boolean(localStorage.getItem('token')),
  });
};

// Hook for fetching unread count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => notificationService.fetchUnreadCount(),
    enabled: Boolean(localStorage.getItem('token')),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Mutation for marking notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
};

// Mutation for marking all notifications as read
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => notificationService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
};

// Mutation for deleting a notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
};

// Helper functions that can be used directly
export const getNotificationNavigationState = notificationService.getNotificationNavigationState;
export const getNotificationClipUrl = notificationService.getNotificationClipUrl;
export const isAuthenticated = notificationService.isAuthenticated;
