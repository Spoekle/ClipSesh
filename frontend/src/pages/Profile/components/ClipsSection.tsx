import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaGamepad } from 'react-icons/fa';
import { PublicProfile } from '../../../types/profileTypes';
import { useClipsByUser } from '../../../hooks/useClips';

interface ClipsSectionProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  viewSwitchTimestamp?: number;
}

const ClipsSection: React.FC<ClipsSectionProps> = ({ 
  profile, 
  isOwnProfile,
  viewSwitchTimestamp
}) => {
  const navigate = useNavigate();
  const [showAllClips, setShowAllClips] = useState(false);
  
  const limit = showAllClips ? 50 : 6;
  const { 
    data: clipsResponse, 
    isLoading: clipsLoading, 
    error: clipsError,
    refetch: refetchClips
  } = useClipsByUser(profile.discordId || '', 1, limit);
  
  const userClips = clipsResponse?.clips || [];
  const totalClips = clipsResponse?.total || 0;

  React.useEffect(() => {
    if (viewSwitchTimestamp) {
      refetchClips();
    }
  }, [viewSwitchTimestamp, refetchClips]);

  const onShowAllClick = () => {
    setShowAllClips(true);
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  return (
    <motion.div
      variants={fadeIn}
      className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/50 dark:border-neutral-700/50 p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
            <FaGamepad className="text-white text-sm" />
          </div>
          Submitted Clips
          {totalClips > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
              {totalClips}
            </span>
          )}
        </h2>
        {totalClips > 6 && !showAllClips && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShowAllClick}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            View All
          </motion.button>
        )}
      </div>
      
      {clipsLoading ? (
        <div className="flex justify-center items-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-3 border-neutral-300 border-t-blue-500 rounded-full"
          />
        </div>
      ) : userClips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {userClips.map((clip, index) => (
            <motion.div
              key={clip._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group bg-white dark:bg-neutral-700 rounded-xl overflow-hidden border border-neutral-200/50 dark:border-neutral-600/50 hover:border-blue-300/50 dark:hover:border-blue-500/50 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
              onClick={() => navigate(`/clips/${clip._id}`)}
            >
              {clip.thumbnail ? (
                <div className="aspect-video bg-neutral-100 dark:bg-neutral-600 overflow-hidden">
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-600 dark:to-neutral-700 flex items-center justify-center">
                  <FaGamepad className="text-neutral-400 dark:text-neutral-500 text-2xl" />
                </div>
              )}
              
              <div className="p-3">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {clip.title}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                  <span className="truncate font-medium">{clip.streamer}</span>
                  {clip.upvotes !== undefined && clip.downvotes !== undefined && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                        <span className="text-green-600 dark:text-green-400 font-medium">↑</span>
                        <span className="text-green-700 dark:text-green-300 font-semibold">{clip.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                        <span className="text-red-600 dark:text-red-400 font-medium">↓</span>
                        <span className="text-red-700 dark:text-red-300 font-semibold">{clip.downvotes}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
                  <p className="text-neutral-500 dark:text-neutral-500 text-xs">
                    {new Date(clip.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaGamepad className="text-neutral-400 dark:text-neutral-500 text-xl" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            No clips yet
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {isOwnProfile ? "You haven't submitted any clips yet." : "This user hasn't submitted any clips yet."}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ClipsSection;
