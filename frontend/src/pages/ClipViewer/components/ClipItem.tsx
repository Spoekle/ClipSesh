import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { format } from 'timeago.js';
import { User, Clip, Rating } from '../../../types/adminTypes';

interface ClipItemProps {
  clip: Clip;
  user: User | null;
  ratings: Record<string, Rating>;
  config: any;
  filterRatedClips: boolean;
  setExpandedClip: (clipId: string) => void;
}

const ClipItem: React.FC<ClipItemProps> = ({ 
  clip, 
  user, 
  ratings, 
  config, 
  filterRatedClips, 
  setExpandedClip 
}) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);
  
  // Check if user has rated this clip - improved logic
  const hasRated = useMemo(() => {
    // If no user or no ratings, can't be rated
    if (!user || !ratings) return false;
    
    const clipRatings = ratings[clip._id];
    if (!clipRatings || !clipRatings.ratings) return false;
    
    // Check through all rating categories (1-4 and deny)
    const ratingCategories = ['1', '2', '3', '4', 'deny'];
    
    for (const category of ratingCategories) {
      const ratingUsers = clipRatings.ratings[category] || [];
      if (ratingUsers.some(u => u && u.userId === user._id)) {
        return true;
      }
    }
    
    return false;
  }, [clip._id, user, ratings]);
  
  // Check if clip is denied based on threshold
  const isDenied = useMemo(() => {
    if (!ratings || !ratings[clip._id]) return false;
    
    const clipRatings = ratings[clip._id];
    const denyThreshold = config.denyThreshold || 3;
    
    return clipRatings.ratingCounts?.some(
      (rateData) => rateData.rating === 'deny' && rateData.count >= denyThreshold
    );
  }, [clip._id, ratings, config.denyThreshold]);

  // Format the date nicely
  const formattedDate = format(new Date(clip.createdAt));

  return (
    <motion.div 
      className="flex flex-col h-full bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow relative"
      layout
    >
      {/* Image thumbnail with overlay */}
      <div 
        className="relative cursor-pointer overflow-hidden aspect-video"
        onClick={() => setExpandedClip(clip._id)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
        
        {/* Rated badge overlay */}
        {hasRated && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 z-20 bg-blue-500 text-white px-3 py-1.5 rounded-md font-bold text-sm shadow-lg flex items-center gap-1.5"
          >
            <FaStar className="text-yellow-300" />
            Rated
          </motion.div>
        )}
        
        {/* Denied badge overlay */}
        {isDenied && user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 z-20 bg-red-500 text-white px-3 py-1.5 rounded-md font-bold text-sm shadow-lg"
          >
            Denied
          </motion.div>
        )}
        
        {isHovering ? (
          <motion.video
            src={clip.url}
            loop
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ) : (
          <motion.img 
            src={clip.thumbnail || 'https://via.placeholder.com/320x180?text=No+Thumbnail'} 
            alt={clip.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://via.placeholder.com/320x180?text=No+Thumbnail';
            }}
          />
        )}
        
        {/* Clip stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-end items-center text-white p-3 z-10">
          <div className="flex items-center gap-1.5 text-sm">
            <IoChatbubbleEllipsesOutline className="text-white/90" />
            <span className="font-medium">
              {clip.comments?.length || '0'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div 
        className="flex flex-col flex-grow p-4 cursor-pointer"
        onClick={() => setExpandedClip(clip._id)}
      >
        <h3 className="text-neutral-900 dark:text-white font-medium line-clamp-2 mb-2 h-12">
          {clip.title}
        </h3>
        
        <div className="mt-auto flex justify-between items-end">
          <div className="text-neutral-700 dark:text-neutral-400 text-sm font-medium">
            {clip.streamer}
          </div>
          <div className="text-neutral-500 dark:text-neutral-500 text-xs">
            {formattedDate}
          </div>
        </div>
        
        {/* Vote counter */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded ${
              clip.upvotes > clip.downvotes 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
            }`}>
              👍 {clip.upvotes}
            </div>
            <div className={`px-2 py-0.5 rounded ${
              clip.downvotes > clip.upvotes 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
            }`}>
              👎 {clip.downvotes}
            </div>
          </div>
          
          {/* Team rating */}
          {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && 
           ratings && ratings[clip._id] && ratings[clip._id].averageRating > 0 && (
            <div className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1">
              <FaStar className="text-yellow-500" />
              {ratings[clip._id].averageRating.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ClipItem;