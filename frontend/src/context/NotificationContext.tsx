import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NotificationContextType, Notification } from '../types/notificationTypes';

// Create the notification context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  showNotification: () => {},
  removeNotification: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {},
});

// Hook for using the notification context
export const useNotification = (): NotificationContextType => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

// Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Add a new notification
  const showNotification = ({ type, message, duration = 5000 }: Omit<Notification, 'id'>): void => {
    const id = uuidv4();
    setNotifications(prev => [...prev, { id, type, message, duration }]);
  };
  
  // Remove a notification by ID
  const removeNotification = (id: string): void => {
    // Using a callback to ensure we're only updating notifications that exist
    // and do it in a more immutable way to prevent React reconciliation issues
    setNotifications(prev => {
      const itemIndex = prev.findIndex(item => item.id === id);
      
      // Only update state if the notification exists
      if (itemIndex === -1) return prev;
      
      // Create a new array without modifying the original
      const newNotifications = [...prev];
      newNotifications.splice(itemIndex, 1);
      return newNotifications;
    });
  };
  
  // Helper functions for each notification type
  const showSuccess = (message: string, duration?: number): void => {
    showNotification({ type: 'success', message, duration });
  };
  
  const showError = (message: string, duration?: number): void => {
    showNotification({ type: 'error', message, duration });
  };
  
  const showInfo = (message: string, duration?: number): void => {
    showNotification({ type: 'info', message, duration });
  };
  
  const showWarning = (message: string, duration?: number): void => {
    showNotification({ type: 'warning', message, duration });
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        removeNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
