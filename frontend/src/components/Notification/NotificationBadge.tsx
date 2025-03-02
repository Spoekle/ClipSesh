import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import axios from 'axios';
import apiUrl from '../../config/config';
import { UnreadCountResponse } from '../../types/notificationTypes';

interface NotificationBadgeProps {
  onClick: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchUnreadCount();

    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await axios.get<UnreadCountResponse>(
        `${apiUrl}/api/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread notifications count', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      disabled={isLoading}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <FaBell className="text-neutral-600 dark:text-neutral-300" size={20} />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBadge;
