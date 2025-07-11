import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { format } from 'timeago.js';
import { User, Clip, Rating, RatingUser } from '../../../../types/adminTypes';
import { getClipVoteStatus } from '../../../../services/clipService';

interface ClipItemProps {
  clip: Clip;
  user: User | null;
  ratings: Record<string, Rating>;
  config: any;
  filterRatedClips: boolean;
  setExpandedClip: (clipId: string) => void;
}

// Add vote status type
interface VoteStatus {
  hasVoted: boolean;
  voteType?: 'upvote' | 'downvote';
}

const ClipItem: React.FC<ClipItemProps> = ({
  clip,
  user,
  ratings,
  config,
  setExpandedClip
}) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({ hasVoted: false });
  // Fetch the user's vote status for this clip
  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        const voteData = await getClipVoteStatus(clip._id);
        setVoteStatus(voteData);
      } catch (error) {
        console.error('Error fetching vote status:', error);
      }
    };

    checkVoteStatus();
  }, [clip._id]);

  // Get the user's specific rating for this clip
  const userRating = useMemo(() => {
    // If no user or no ratings, return null
    if (!user || !ratings) return null;

    const clipRatings = ratings[clip._id];
    if (!clipRatings || !clipRatings.ratings) return null;

    // Check through all rating categories (1-4 and deny)
    const ratingCategories = ['1', '2', '3', '4', 'deny'] as const;

    for (const category of ratingCategories) {
      const ratingUsers = clipRatings.ratings[category] || [];
      if (ratingUsers.some((u: RatingUser) => u && u.userId === user._id)) {
        return category;
      }
    }

    return null;
  }, [clip._id, user, ratings]);

  // Check if user has rated this clip - improved logic
  const hasRated = useMemo(() => {
    return userRating !== null;
  }, [userRating]);

  // Check if clip is denied based on threshold
  const isDenied = useMemo(() => {
    if (!ratings || !ratings[clip._id]) return false;

    const clipRatings = ratings[clip._id];
    const denyThreshold = config.denyThreshold || 3;

    return clipRatings.ratingCounts?.some(
      (rateData) => rateData.rating === 'deny' && rateData.count >= denyThreshold
    );
  }, [clip._id, ratings, config.denyThreshold]);

  // Calculate average rating with useMemo for efficiency
  const averageRating = useMemo(() => {
    // If no ratings data exists for this clip
    if (!ratings || !ratings[clip._id]) return "0.0";
    
    const clipRating = ratings[clip._id];
    
    // Handle ratings structure with "ratings" property (format 1)
    if (clipRating.ratings) {
      const ratingCategories = ['1', '2', '3', '4'] as const;
      let totalCount = 0;
      let weightedSum = 0;
      
      // Calculate based on the number of users in each rating category
      for (const category of ratingCategories) {
        const usersInCategory = clipRating.ratings[category]?.length || 0;
        totalCount += usersInCategory;
        weightedSum += parseInt(category) * usersInCategory;
      }
      
      return (totalCount > 0) ? (weightedSum / totalCount).toFixed(1) : "0.0";
    } 
    // Handle ratings structure with "ratingCounts" property (format 2)
    else if (clipRating.ratingCounts) {
      const ratingCounts = clipRating.ratingCounts;
      if (!ratingCounts || ratingCounts.length === 0) return "0.0";
      
      // Filter to include only numerical ratings (1-4)
      const numericRatings = ratingCounts.filter(r => 
        r && r.rating !== 'deny' && ['1', '2', '3', '4'].includes(r.rating)
      );
      
      if (numericRatings.length === 0) return "0.0";
      
      const totalCount = numericRatings.reduce((acc, curr) => acc + (curr.count || 0), 0);
      const weightedSum = numericRatings.reduce(
        (acc, curr) => acc + (parseInt(curr.rating) * (curr.count || 0)), 0
      );
      
      return (totalCount > 0) ? (weightedSum / totalCount).toFixed(1) : "0.0";
    }
    
    // No recognizable rating format
    return "0.0";
  }, [clip._id, ratings]);

  // Calculate denial count with useMemo for efficiency
  const denialCount = useMemo(() => {
    // If no ratings data exists for this clip
    if (!ratings || !ratings[clip._id]) return 0;
    
    const clipRating = ratings[clip._id];
    
    // Handle ratings structure with "ratings" property (format 1)
    if (clipRating.ratings) {
      return clipRating.ratings.deny?.length || 0;
    } 
    // Handle ratings structure with "ratingCounts" property (format 2)
    else if (clipRating.ratingCounts) {
      const denyData = clipRating.ratingCounts.find(r => r && r.rating === 'deny');
      return denyData?.count || 0;
    }
    
    return 0;
  }, [clip._id, ratings]);

  // Calculate total number of ratings
  const totalRatings = useMemo(() => {
    // If no ratings data exists for this clip
    if (!ratings || !ratings[clip._id]) return 0;
    
    const clipRating = ratings[clip._id];
    
    // Handle ratings structure with "ratings" property (format 1)
    if (clipRating.ratings) {
      const ratingCategories = ['1', '2', '3', '4'] as const;
      let total = 0;
      
      // Sum up the number of users in each rating category
      for (const category of ratingCategories) {
        total += clipRating.ratings[category]?.length || 0;
      }
      
      return total;
    } 
    // Handle ratings structure with "ratingCounts" property (format 2)
    else if (clipRating.ratingCounts) {
      return clipRating.ratingCounts.reduce((acc, curr) => acc + (curr?.count || 0), 0);
    }
    
    return 0;
  }, [clip._id, ratings]);

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Rated badge overlay */}
        {hasRated && userRating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute top-3 right-3 text-white px-3 py-1.5 rounded-md font-bold text-sm shadow-lg flex items-center gap-1.5 ${
              userRating === '1' ? 'bg-green-600' :
              userRating === '2' ? 'bg-yellow-600' :
              userRating === '3' ? 'bg-orange-500' :
              userRating === '4' ? 'bg-red-500' :
              userRating === 'deny' ? 'bg-red-600' :
              'bg-blue-500'
            }`}
          >

            {userRating === 'deny' ? 'Denied' : <><FaStar className="text-yellow-300" /> {userRating}</>}
          </motion.div>
        )} 

        {/* Denied badge overlay */}
        {isDenied && user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1.5 rounded-md font-bold text-sm shadow-lg"
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
            src={clip.thumbnail}
            alt={clip.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;;
            }}
          />
        )}

        {/* Clip stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-end items-center text-white p-3">
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
            <div className={`px-2 py-0.5 rounded flex items-center gap-1 ${voteStatus.hasVoted && voteStatus.voteType === 'upvote'
                ? 'bg-green-500/30 text-white font-medium'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
              }`}>
              👍 {clip.upvotes}
            </div>
            <div className={`px-2 py-0.5 rounded flex items-center gap-1 ${voteStatus.hasVoted && voteStatus.voteType === 'downvote'
                ? 'bg-red-500/30 text-white font-medium'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
              }`}>
              👎 {clip.downvotes}
            </div>
          </div>

          {/* Team rating */}
          {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
            <div className="flex items-center gap-2">
              {averageRating && averageRating !== "0.0" && (
              <div 
                className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1"
                title={totalRatings > 0 ? `Ratings: ${totalRatings}` : 'No ratings yet'}
              >
                <FaStar className="text-yellow-500" />
                {averageRating} {totalRatings > 0 && <span className="text-xs opacity-75">({totalRatings})</span>}
              </div>
              )}
              {denialCount > 0 && (
                <div className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm flex items-center gap-1">
                  🚫 {denialCount}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ClipItem;