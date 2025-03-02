import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaUserAlt, FaCheck } from 'react-icons/fa';

const SummaryStats = ({ totalRatings, averageRatings, mostActiveUser }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
  );
};

export default SummaryStats;
