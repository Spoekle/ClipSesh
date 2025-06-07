import React from 'react';
import { motion } from 'framer-motion';
import { FaGamepad, FaStar, FaEye, FaThumbsUp } from 'react-icons/fa';
import { PublicProfile } from '../../../types/profileTypes';

interface ProfileStatsProps {
  profile: PublicProfile | null;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ profile }) => {
  if (!profile) {
    return null;
  }
  // Mock stats - in a real app, these would come from the backend
  const stats = [
    {
      label: 'Clips Submitted',
      value: '24',
      icon: FaGamepad,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'dark:from-blue-900/20 dark:to-blue-800/40',
      decorationBg: 'bg-blue-500/20 dark:bg-blue-500/10',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40'
    },
    {
      label: 'Average Rating',
      value: '4.2',
      icon: FaStar,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgGradient: 'dark:from-amber-900/20 dark:to-amber-800/40',
      decorationBg: 'bg-amber-500/20 dark:bg-amber-500/10',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40'
    },
    {
      label: 'Total Views',
      value: '1.2K',
      icon: FaEye,
      iconColor: 'text-green-600 dark:text-green-400',
      bgGradient: 'dark:from-green-900/20 dark:to-green-800/40',
      decorationBg: 'bg-green-500/20 dark:bg-green-500/10',
      iconBg: 'bg-green-100 dark:bg-green-900/40'
    },
    {
      label: 'Likes Received',
      value: '89',
      icon: FaThumbsUp,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgGradient: 'dark:from-purple-900/20 dark:to-purple-800/40',
      decorationBg: 'bg-purple-500/20 dark:bg-purple-500/10',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ scale: 1.03, y: -5 }}
          className={`p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 ${stat.bgGradient} rounded-lg shadow relative overflow-hidden`}
        >
          <div className={`absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full ${stat.decorationBg}`}></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-neutral-900 dark:text-white">{stat.value}</h3>
            </div>
            <div className={`p-3 ${stat.iconBg} rounded-lg`}>
              <stat.icon className={stat.iconColor} size={24} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ProfileStats;
