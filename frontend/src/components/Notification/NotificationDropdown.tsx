import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheck, FaTrash, FaAngleRight, FaRegBell, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import apiUrl from '../../config/config';
import { UserNotification, UserNotificationResponse } from '../../types/notificationTypes';
import { useNotification } from '../../context/NotificationContext';
import { format } from 'timeago.js';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  prefetchedData: UserNotificationResponse | null;
  onNotificationUpdate: () => void;
  isLoading: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  isOpen, 
  onClose, 
  prefetchedData, 
  onNotificationUpdate,
  isLoading: externalLoading 
}) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  // Number of notifications to show in dropdown
  const MAX_NOTIFICATIONS = 5;

  // Use prefetched data if available, otherwise fetch when opened
  useEffect(() => {
    if (isOpen) {
      if (prefetchedData) {
        setNotifications(prefetchedData.notifications);
      } else {
        fetchNotifications();
      }
    }
  }, [isOpen, prefetchedData]);

  // Update local state when prefetched data changes
  useEffect(() => {
    if (prefetchedData) {
      setNotifications(prefetchedData.notifications);
    }
  }, [prefetchedData]);

  const fetchNotifications = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get<UserNotificationResponse>(
        `${apiUrl}/api/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications', error);
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string, event?: React.MouseEvent): Promise<void> => {
    if (event) {
      event.stopPropagation();
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put(
        `${apiUrl}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      // Notify parent component to update counter
      onNotificationUpdate();
      
    } catch (error) {
      console.error('Error marking notification as read', error);
      showError('Failed to update notification');
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put(
        `${apiUrl}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      // Notify parent component to update counter
      onNotificationUpdate();
      
      showSuccess('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read', error);
      showError('Failed to update notifications');
    }
  };

  const deleteNotification = async (notificationId: string, event: React.MouseEvent): Promise<void> => {
    event.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(
        `${apiUrl}/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
      
      // Notify parent component to update counter
      onNotificationUpdate();
      
    } catch (error) {
      console.error('Error deleting notification', error);
      showError('Failed to delete notification');
    }
  };

  const navigateToClip = (notification: UserNotification): void => {
    // Mark as read when navigating
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    onClose();
    
    // Handle different notification types
    if (notification.type === 'team_message') {
      navigate(`/clips/${notification.clipId}`, { 
        state: { 
          openTeamChat: true,
          messageId: notification.entityId 
        }
      });
    } else if (notification.type === 'comment_reply') {
      navigate(`/clips/${notification.clipId}`, { 
        state: { 
          highlightComment: notification.entityId,
          highlightReply: notification.replyId 
        }
      });
    } else {
      navigate(`/clips/${notification.clipId}`, { 
        state: { highlightComment: notification.entityId }
      });
    }
  };

  const viewAllNotifications = (): void => {
    onClose();
    navigate('/notifications');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_message':
        return <FaUsers className="text-indigo-500" />;
      case 'comment_reply':
        return <FaBell className="text-blue-500" />;
      case 'mention':
        return <FaBell className="text-green-500" />;
      case 'rating':
        return <FaBell className="text-yellow-500" />;
      case 'system':
        return <FaBell className="text-purple-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  // Take only the MAX_NOTIFICATIONS most recent notifications
  const recentNotifications = notifications.slice(0, MAX_NOTIFICATIONS);
  const isLoadingData = loading || externalLoading;

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.1 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ type: "tween", duration: 0.15 }} // Faster animation for better responsiveness
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <FaBell className="mr-2 text-blue-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto">
            {isLoadingData ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <FaRegBell className="mx-auto text-gray-400 dark:text-gray-600 text-4xl mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => navigateToClip(notification)}
                    className={`p-3 flex items-start gap-3 cursor-pointer ${
                      !notification.read 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'
                    }`}
                  >
                    <div className={`rounded-full p-1.5 ${
                      !notification.read 
                        ? 'bg-blue-100 dark:bg-blue-800' 
                        : 'bg-gray-100 dark:bg-neutral-700'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-grow">
                      <p className={`text-xs ${
                        !notification.read ? 'font-medium' : ''
                      } text-gray-900 dark:text-white line-clamp-2`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(notification.createdAt))}
                        </span>
                        
                        <div className="flex space-x-1">
                          {!notification.read && (
                            <button
                              onClick={(e) => markAsRead(notification._id, e)}
                              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 p-0.5"
                              title="Mark as read"
                            >
                              <FaCheck size={10} />
                            </button>
                          )}
                          <button
                            onClick={(e) => deleteNotification(notification._id, e)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 p-0.5"
                            title="Delete notification"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 text-center">
            <button
              onClick={viewAllNotifications}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              View all notifications
              <FaAngleRight className="ml-1" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
