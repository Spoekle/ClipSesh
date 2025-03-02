import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create context
export const NotificationContext = createContext();

// Create notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a notification
  const addNotification = useCallback(
    ({ type = NOTIFICATION_TYPES.INFO, message, duration = 3000 }) => {
      const id = uuidv4();
      
      setNotifications((prev) => [
        ...prev,
        {
          id,
          type,
          message,
          duration,
        },
      ]);

      // Auto-remove notification after duration
      if (duration !== 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
      
      return id;
    },
    []
  );

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback(
    (message, duration = 3000) =>
      addNotification({ type: NOTIFICATION_TYPES.SUCCESS, message, duration }),
    [addNotification]
  );

  const showError = useCallback(
    (message, duration = 4000) =>
      addNotification({ type: NOTIFICATION_TYPES.ERROR, message, duration }),
    [addNotification]
  );

  const showInfo = useCallback(
    (message, duration = 3000) =>
      addNotification({ type: NOTIFICATION_TYPES.INFO, message, duration }),
    [addNotification]
  );

  const showWarning = useCallback(
    (message, duration = 3500) =>
      addNotification({ type: NOTIFICATION_TYPES.WARNING, message, duration }),
    [addNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
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

// Custom hook for easy access to notifications
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
