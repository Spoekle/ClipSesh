import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaBell } from 'react-icons/fa';
import axios from 'axios';
import apiUrl from '../../config/config';
import { UserNotificationResponse, UnreadCountResponse } from '../../types/notificationTypes';
import NotificationDropdown from './NotificationDropdown';

const NotificationBadge: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<UserNotificationResponse | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fetch notifications data on component mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications(); // Pre-fetch on component mount
    
    const countInterval = setInterval(fetchUnreadCount, 60000);
    const notificationsInterval = setInterval(fetchNotifications, 120000);
    
    return () => {
      clearInterval(countInterval);
      clearInterval(notificationsInterval);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const fetchUnreadCount = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get<UnreadCountResponse>(
        `${apiUrl}/api/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread notifications count', error);
    }
  };

  // Fetch notifications data in the background
  const fetchNotifications = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get<UserNotificationResponse>(
        `${apiUrl}/api/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data);
    } catch (error) {
      console.error('Error pre-fetching notifications', error);
    }
  };

  const toggleDropdown = () => {
    if (!dropdownOpen && !notifications) {
      // If opening and we don't have data yet
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));
    }
    setDropdownOpen(!dropdownOpen);
  };

  // Force a refresh after actions in dropdown (mark as read, delete)
  const handleNotificationsUpdate = useCallback(() => {
    // Don't fetch immediately - wait a little to avoid flickering
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, 500);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        disabled={isLoading}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={dropdownOpen}
      >
        <FaBell className="text-neutral-600 dark:text-neutral-300" size={20} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
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
