import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheck, FaTrash, FaAngleRight, FaRegBell, FaUsers, FaComments } from 'react-icons/fa';
import apiUrl from '../config/config';
import { UserNotification, UserNotificationResponse } from '../types/notificationTypes';
import { useNotification } from '../context/NotificationContext';
import LoadingBar from 'react-top-loading-bar';
import { format } from 'timeago.js';
import { Tabs, Tab } from '../components/UI/Tabs'; // You'll need to create this component

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'team'>('all');
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

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'team') return notification.type === 'team_message';
    return notification.type !== 'team_message'; // personal notifications
  });
  
  // Group team messages by clipId
  const teamMessagesByClip = notifications
    .filter(n => n.type === 'team_message')
    .reduce((acc, notification) => {
      const clipId = notification.clipId;
      if (!acc[clipId]) {
        acc[clipId] = [];
      }
      acc[clipId].push(notification);
      return acc;
    }, {} as Record<string, UserNotification[]>);

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
    
    // For team messages, scroll to message component
    if (notification.type === 'team_message') {
      navigate(`/clips/${notification.clipId}`, { 
        state: { 
          openTeamChat: true,
          messageId: notification.entityId
        }
      });
    } else if (notification.type === 'comment_reply') {
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
      case 'team_message':
        return <FaUsers className="text-indigo-500" />;
      case 'comment_reply':
        return <FaComments className="text-blue-500" />;
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

  const unreadCount = {
    all: notifications.filter(n => !n.read).length,
    team: notifications.filter(n => !n.read && n.type === 'team_message').length,
    personal: notifications.filter(n => !n.read && n.type !== 'team_message').length
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
              {unreadCount.all > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm rounded-full">
                  {unreadCount.all} unread
                </span>
              )}
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
          
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-neutral-700">
            <div className="px-4">
              <nav className="-mb-px flex space-x-6">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'all'
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  All
                  {unreadCount.all > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full">
                      {unreadCount.all}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'personal'
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Personal
                  {unreadCount.personal > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full">
                      {unreadCount.personal}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'team'
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Team Messages
                  {unreadCount.team > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full">
                      {unreadCount.team}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>
          
          {/* Notifications list */}
          <div className="divide-y divide-gray-200 dark:divide-neutral-700 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-16 text-center">
                <FaRegBell className="mx-auto text-gray-400 dark:text-gray-600 text-6xl mb-6" />
                <h2 className="text-xl font-medium text-gray-600 dark:text-gray-400">No notifications yet</h2>
                <p className="text-gray-500 dark:text-gray-500 mt-1">
                  {activeTab === 'team' 
                    ? "Team messages will appear here when team members chat on clips."
                    : activeTab === 'personal' 
                      ? "You'll see notifications about replies to your comments here." 
                      : "You'll see all your notifications here."}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {/* If we're in team view, group by clip */}
                {activeTab === 'team' && Object.entries(teamMessagesByClip).map(([clipId, clipNotifications]) => {
                  // Get the most recent notification for this clip to display clip details
                  const latestNotification = clipNotifications.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  )[0];
                  
                  const unreadMessagesCount = clipNotifications.filter(n => !n.read).length;
                  
                  return (
                    <motion.div
                      key={clipId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/30"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                          <FaUsers className="text-indigo-500" size={20} />
                        </div>
                        
                        <div className="flex-grow cursor-pointer" onClick={() => navigateToClip(latestNotification)}>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Team messages for clip
                          </h3>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {latestNotification.message.split('"')[1]}
                          </p>
                          
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">
                              {clipNotifications.length} messages
                            </span>
                            
                            {unreadMessagesCount > 0 && (
                              <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full">
                                {unreadMessagesCount} unread
                              </span>
                            )}
                            
                            <span className="ml-2">
                              Last message {format(new Date(latestNotification.createdAt))}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <button
                            onClick={() => navigateToClip(latestNotification)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <FaAngleRight size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Regular notification list for non-team views */}
                {activeTab !== 'team' && filteredNotifications.map((notification) => (
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
