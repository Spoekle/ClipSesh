import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaUserAlt, FaCheck, FaVideo, FaTimes, FaClock } from 'react-icons/fa';

interface SummaryStatsProps {
  totalRatings: number;
  averageRatings: number;
  mostActiveUser: string;
  totalClips: number;
  ratedClips: number;
  unratedClips: number;
  deniedClips: number;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({
  totalRatings,
  averageRatings,
  mostActiveUser, 
  totalClips,
  ratedClips,
  unratedClips,
  deniedClips
}) => { 
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-blue-900/20 dark:to-blue-800/40 p-5 rounded-lg shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Total Clips</p>
              <h3 className="text-3xl font-bold mt-1">{totalClips}</h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaVideo className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-green-900/20 dark:to-green-800/40 p-5 rounded-lg shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Rated Clips</p>
              <h3 className="text-3xl font-bold mt-1">{ratedClips}</h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FaCheck className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-orange-900/20 dark:to-orange-800/40 p-5 rounded-lg shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Unrated Clips</p>
              <h3 className="text-3xl font-bold mt-1">{unratedClips}</h3>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FaClock className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-red-900/20 dark:to-red-800/40 p-5 rounded-lg shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Denied Clips</p>
              <h3 className="text-3xl font-bold mt-1">{deniedClips}</h3>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FaTimes className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-blue-900/20 dark:to-blue-800/40 p-5 rounded-lg shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Total Ratings</p>
              <h3 className="text-3xl font-bold mt-1">{totalRatings}</h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaStar className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-green-900/20 dark:to-green-800/40 p-5 rounded-lg shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Avg. Ratings per Member</p>
              <h3 className="text-3xl font-bold mt-1">{averageRatings.toFixed(0)}</h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FaUserAlt className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-purple-900/20 dark:to-purple-800/40 p-5 rounded-lg shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Most Active Member</p>
              <h3 className="text-3xl font-bold mt-1 truncate max-w-[200px]">{mostActiveUser}</h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FaCheck className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SummaryStats;
