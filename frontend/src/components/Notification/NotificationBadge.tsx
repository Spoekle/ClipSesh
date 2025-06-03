import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaBell } from 'react-icons/fa';
import axios from 'axios';
import apiUrl from '../../config/config';
import { UserNotificationResponse, UnreadCountResponse } from '../../types/notificationTypes';
import NotificationDropdown from './NotificationDropdown';

interface NotificationBadgeProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ isOpen, onToggle }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [internalDropdownOpen, setInternalDropdownOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<UserNotificationResponse | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean>(true);

  // Use external state if provided, otherwise use internal state
  const dropdownOpen = isOpen !== undefined ? isOpen : internalDropdownOpen;
  const setDropdownOpen = onToggle !== undefined ? onToggle : setInternalDropdownOpen;

  // Pre-fetch notifications data on component mount and periodically
  useEffect(() => {
    // Check if notifications API is available
    checkApiAvailability();
    
    // Only set up intervals if the API is available
    if (apiAvailable) {
      fetchUnreadCount();
      fetchNotifications(); // Pre-fetch on component mount
      
      const countInterval = setInterval(fetchUnreadCount, 60000);
      const notificationsInterval = setInterval(fetchNotifications, 120000);
      
      return () => {
        clearInterval(countInterval);
        clearInterval(notificationsInterval);
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      };
    }
  }, [apiAvailable]);

  // Close dropdown when clicking outside (only for internal state management)
  useEffect(() => {
    if (onToggle) return; // Don't handle outside clicks if using external state management
    
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setInternalDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onToggle]);

  // Check if notifications API endpoints exist
  const checkApiAvailability = async (): Promise<void> => {
    try {
      // Try to access the notification endpoint with HEAD request
      await axios.head(`${apiUrl}/api/notifications`);
      setApiAvailable(true);
    } catch (error: any) {
      // If we get 404, the API doesn't exist
      if (error.response && error.response.status === 404) {
        console.log('Notifications API not available, disabling notification features');
        setApiAvailable(false);
      }
    }
  };

  const fetchUnreadCount = async (): Promise<void> => {
    if (!apiAvailable) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get<UnreadCountResponse>(
        `${apiUrl}/api/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.log('Could not fetch notification count - API may not be implemented yet');
      // Don't show errors for missing notification API
    }
  };

  // Fetch notifications data in the background
  const fetchNotifications = async (): Promise<void> => {
    if (!apiAvailable) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get<UserNotificationResponse>(
        `${apiUrl}/api/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data);
    } catch (error) {
      console.log('Could not fetch notifications - API may not be implemented yet');
      // Don't show errors for missing notification API
    }
  };

  const toggleDropdown = () => {
    if (!apiAvailable) return;
    
    if (!dropdownOpen && !notifications) {
      // If opening and we don't have data yet
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));
    }
    
    if (onToggle) {
      // Use external toggle function
      onToggle();
    } else {
      // Use internal state
      setInternalDropdownOpen(!internalDropdownOpen);
    }
  };

  // Force a refresh after actions in dropdown (mark as read, delete)
  const handleNotificationsUpdate = useCallback(() => {
    if (!apiAvailable) return;
    
    // Don't fetch immediately - wait a little to avoid flickering
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, 500);
  }, [apiAvailable]);

  // If the notifications API isn't available, don't render anything
  if (!apiAvailable) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        disabled={isLoading}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={dropdownOpen}
      >
        <FaBell className="text-neutral-600 dark:text-neutral-300" size={20} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>
      
      <NotificationDropdown 
        isOpen={dropdownOpen} 
        onClose={() => setDropdownOpen(false)}
        prefetchedData={notifications}
        onNotificationUpdate={handleNotificationsUpdate}
        isLoading={isLoading}
      />
    </div>
  );
};

export default NotificationBadge;
