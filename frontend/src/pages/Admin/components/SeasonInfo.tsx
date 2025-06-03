import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaExclamationCircle, FaClipboard, FaStar } from 'react-icons/fa';
import { SeasonInfo as SeasonInfoType } from '../../../types/adminTypes';

interface SeasonInfoProps {
  seasonInfo: SeasonInfoType;
  deniedClips: number;
  ratedClips: number;
}

const SeasonInfo: React.FC<SeasonInfoProps> = ({ seasonInfo, deniedClips, ratedClips }) => {
  const totalClips = seasonInfo.clipAmount || 0;
  const approvedClips = totalClips - deniedClips;
  const unratedClips = totalClips - ratedClips;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl mb-8"
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
        <FaCalendarAlt className="mr-3 text-blue-500" /> 
        Season Summary
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-purple-900/20 dark:to-purple-800/40 p-5 rounded-lg shadow relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full bg-purple-500/20 dark:bg-purple-500/10"></div>
          <div>
            <p className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Current Season</p>
            <h3 className="text-3xl font-bold">{seasonInfo.season}</h3>
            <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-blue-900/20 dark:to-blue-800/40 p-5 rounded-lg shadow relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full bg-blue-500/20 dark:bg-blue-500/10"></div>
          <div>
            <p className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Total Clips</p>
            <h3 className="text-3xl font-bold">{totalClips}</h3>
            <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
              <FaClipboard className="mr-1" /> 
              {approvedClips} approved / {deniedClips} denied
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-yellow-900/20 dark:to-yellow-800/40 p-5 rounded-lg shadow relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full bg-yellow-500/20 dark:bg-yellow-500/10"></div>
          <div>
            <p className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Rated Clips</p>
            <h3 className="text-3xl font-bold">{ratedClips}</h3>
            <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
              <FaStar className="mr-1" /> 
              {unratedClips} unrated remaining
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className={`bg-gradient-to-br from-neutral-200 to-neutral-300 ${
            deniedClips > approvedClips 
              ? 'dark:from-red-900/20 dark:to-red-800/40' 
              : 'dark:from-green-900/20 dark:to-green-800/40'
          } p-5 rounded-lg shadow relative overflow-hidden`}
        >
          <div className={`absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full ${
            deniedClips > approvedClips 
              ? 'bg-red-500/20 dark:bg-red-500/10' 
              : 'bg-green-500/20 dark:bg-green-500/10'
          }`}></div>
          <div>
            <p className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Status</p>
            <h3 className="text-3xl font-bold">{
              totalClips === 0 
                ? 'No Clips' 
                : deniedClips > approvedClips 
                  ? 'Needs Attention' 
                  : 'Looking Good'
            }</h3>
            <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
              {totalClips === 0 ? (
                <span>Upload clips to get started</span>
              ) : deniedClips > approvedClips ? (
                <span className="flex items-center text-red-600 dark:text-red-400">
                  <FaExclamationCircle className="mr-1" /> 
                  More than 50% clips denied
                </span>
              ) : (
                <span>Majority of clips are approved</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SeasonInfo;
