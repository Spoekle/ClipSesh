import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheck, FaTrash, FaAngleRight, FaRegBell } from 'react-icons/fa';
import apiUrl from '../config/config';
import { UserNotification, UserNotificationResponse } from '../types/notificationTypes';
import { useNotification } from '../context/NotificationContext';
import LoadingBar from 'react-top-loading-bar';
import { format } from 'timeago.js';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setProgress(30);
      setLoading(true);
      const response = await axios.get<UserNotificationResponse>(
        `${apiUrl}/api/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProgress(100);
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications', error);
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put(
        `${apiUrl}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
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
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      showSuccess('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read', error);
      showError('Failed to update notifications');
    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(
        `${apiUrl}/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
      
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
    
    // Check if this is a comment_reply type notification
    if (notification.type === 'comment_reply') {
      // Navigate to the clip with both the comment and reply highlighted
      navigate(`/clips/${notification.clipId}`, { 
        state: { 
          highlightComment: notification.entityId,
          highlightReply: notification.replyId 
        }
      });
    } else {
      // For other types, just highlight the entity (usually a comment)
      navigate(`/clips/${notification.clipId}`, { 
        state: { highlightComment: notification.entityId }
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Helmet>
        <title>Notifications | ClipSesh</title>
        <meta name="description" content="Your notifications on ClipSesh" />
      </Helmet>
      
      <LoadingBar color='#3b82f6' height={3} progress={progress} onLoaderFinished={() => setProgress(0)} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaBell className="mr-3 text-blue-500" />
              Notifications
            </h1>
            
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center"
              >
                <FaCheck className="mr-2" />
                Mark all as read
              </button>
            )}
          </div>
          
          {/* Notifications list */}
          <div className="divide-y divide-gray-200 dark:divide-neutral-700 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center">
                <FaRegBell className="mx-auto text-gray-400 dark:text-gray-600 text-6xl mb-6" />
                <h2 className="text-xl font-medium text-gray-600 dark:text-gray-400">No notifications yet</h2>
                <p className="text-gray-500 dark:text-gray-500 mt-1">
                  You'll see notifications about replies to your comments here.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 sm:p-6 flex items-start gap-x-4 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } hover:bg-gray-50 dark:hover:bg-neutral-700/50`}
                  >
                    <div className={`rounded-full p-2 ${
                      !notification.read ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-neutral-700'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-grow cursor-pointer" onClick={() => navigateToClip(notification)}>
                      <p className={`text-sm sm:text-base ${
                        !notification.read ? 'font-medium' : ''
                      } text-gray-900 dark:text-white`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(notification.createdAt))}
                        </p>
                        
                        <div className="flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 p-1 rounded-full"
                            title="Mark as read"
                          >
                            <FaCheck size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 p-1 rounded-full ml-2"
                            title="Delete notification"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => navigateToClip(notification)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <FaAngleRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
