import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { NotificationContextType, Notification, AlertModalOptions } from '../types/notificationTypes';
import { v4 as uuidv4 } from 'uuid';

// Create the notification context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  showNotification: () => {},
  removeNotification: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {},
  alertModal: null,
  showAlertModal: () => {},
  closeAlertModal: () => {},
});

// Hook for using the notification context
export const useNotification = (): NotificationContextType => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

// Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alertModal, setAlertModal] = useState<AlertModalOptions | null>(null);
  
  // Add a new notification with useCallback for better performance
  const showNotification = useCallback(({ type, message, duration = 3000 }: Omit<Notification, 'id'>): void => {
    const id = uuidv4();
    setNotifications(prev => [...prev, { id, type, message, duration }]);
  }, []);
  
  // Remove a notification by ID with useCallback for better performance
  const removeNotification = useCallback((id: string): void => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Helper functions for each notification type
  const showSuccess = useCallback((message: string, duration?: number): void => {
    showNotification({ type: 'success', message, duration });
  }, [showNotification]);
  
  const showError = useCallback((message: string, duration?: number): void => {
    showNotification({ type: 'error', message, duration });
  }, [showNotification]);
  
  const showInfo = useCallback((message: string, duration?: number): void => {
    showNotification({ type: 'info', message, duration });
  }, [showNotification]);
  
  const showWarning = useCallback((message: string, duration?: number): void => {
    showNotification({ type: 'warning', message, duration });
  }, [showNotification]);

  // Modal alert dialog methods (replacing native HTML window.alert)
  const showAlertModal = useCallback((options: AlertModalOptions): void => {
    setAlertModal(options);
  }, []);

  const closeAlertModal = useCallback((): void => {
    setAlertModal(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    notifications,
    showNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    alertModal,
    showAlertModal,
    closeAlertModal,
  }), [
    showNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    notifications,
    alertModal,
    showAlertModal,
    closeAlertModal
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
