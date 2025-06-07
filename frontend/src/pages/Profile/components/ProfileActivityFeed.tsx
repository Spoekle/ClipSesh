import React from 'react';
import { motion } from 'framer-motion';
import { FaGamepad, FaStar, FaComment, FaCalendarAlt } from 'react-icons/fa';
import { PublicProfile } from '../../../types/profileTypes';

interface ProfileActivityFeedProps {
  profile: PublicProfile | null;
}

const ProfileActivityFeed: React.FC<ProfileActivityFeedProps> = ({ profile }) => {
  if (!profile) {
    return null;
  }
  // Mock activity data - in a real app, this would come from the backend
  const activities = [
    {
      type: 'clip_upload',
      description: 'Uploaded a new clip',
      clipTitle: 'Amazing Beat Saber Play',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      icon: <FaGamepad className="text-blue-500" />
    },
    {
      type: 'rating',
      description: 'Rated a clip',
      rating: 5,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      icon: <FaStar className="text-amber-500" />
    },
    {
      type: 'comment',
      description: 'Left a comment on a clip',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      icon: <FaComment className="text-green-500" />
    }
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
    >
      <div className="flex items-center gap-3 mb-6 border-b border-neutral-400 dark:border-neutral-700 pb-4">
        <div className="p-3 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-blue-900/20 dark:to-blue-800/40 rounded-lg shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 -mt-3 -mr-3 rounded-full bg-blue-500/20 dark:bg-blue-500/10"></div>
          <FaCalendarAlt className="text-blue-600 dark:text-blue-400" size={20} />
        </div>
        <h3 className="text-xl font-bold">Recent Activity</h3>
      </div>
      
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className="flex items-start gap-4 p-4 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700/50 dark:to-neutral-600/50 rounded-lg shadow-inner"
            >
              <div className="flex-shrink-0">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-600 rounded-lg">
                  {activity.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-neutral-800 dark:text-neutral-200">
                  <span className="font-medium text-neutral-900 dark:text-white">{profile.username}</span>
                  {' '}
                  {activity.description}
                  {activity.clipTitle && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium"> "{activity.clipTitle}"</span>
                  )}
                  {activity.rating && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium"> ({activity.rating} stars)</span>
                  )}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="p-6 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700/50 dark:to-neutral-600/50 rounded-lg shadow-inner">
            <FaGamepad className="text-4xl mx-auto mb-3 text-neutral-600 dark:text-neutral-400" />
            <p className="text-neutral-800 dark:text-neutral-200 font-medium">No recent activity</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProfileActivityFeed;
