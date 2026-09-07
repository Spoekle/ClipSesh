import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaThumbsUp, FaThumbsDown, FaBan } from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { format } from 'timeago.js';
import { User, Clip, Rating, RatingUser } from '../../../../types/adminTypes';
import { getClipVoteStatus } from '../../../../services/clipService';
import generateAvatar from '../../../../utils/generateAvatar';

interface ClipItemProps {
  clip: Clip;
  user: User | null;
  ratings: Record<string, Rating>;
  config: any;
  filterRatedClips: boolean;
  setExpandedClip: (clipId: string) => void;
}

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
    if (!user || !ratings || !ratings[clip._id]) return null;
    const clipRatings = ratings[clip._id];

    if (clipRatings.ratings) {
      const ratingCategories = ['1', '2', '3', '4', 'deny'] as const;
      for (const category of ratingCategories) {
        const ratingUsers = clipRatings.ratings[category] || [];
        if (ratingUsers.some((u: RatingUser) => u && u.userId === user._id)) {
          return category;
        }
      }
    } else if (clipRatings.ratingCounts) {
      for (const ratingCount of clipRatings.ratingCounts) {
        if (ratingCount.users && ratingCount.users.some((u: RatingUser) => u && u.userId === user._id)) {
          return ratingCount.rating;
        }
      }
    }

    return null;
  }, [clip._id, user, ratings]);

  const hasRated = useMemo(() => userRating !== null, [userRating]);

  // Check if clip is denied based on threshold
  const isDenied = useMemo(() => {
    if (!ratings || !ratings[clip._id]) return false;
    const clipRatings = ratings[clip._id];
    const denyThreshold = config?.denyThreshold || 3;

    if (clipRatings.ratingCounts) {
      return clipRatings.ratingCounts.some(
        (rateData) => rateData.rating === 'deny' && rateData.count >= denyThreshold
      );
    } else if (clipRatings.ratings) {
      const denyCount = clipRatings.ratings.deny?.length || 0;
      return denyCount >= denyThreshold;
    }

    return false;
  }, [clip._id, ratings, config?.denyThreshold]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (!ratings || !ratings[clip._id]) return "0.0";
    const clipRating = ratings[clip._id];

    if (clipRating.ratings) {
      const ratingCategories = ['1', '2', '3', '4'] as const;
      let totalCount = 0;
      let weightedSum = 0;
      for (const category of ratingCategories) {
        const usersInCategory = clipRating.ratings[category]?.length || 0;
        totalCount += usersInCategory;
        weightedSum += parseInt(category) * usersInCategory;
      }
      return (totalCount > 0) ? (weightedSum / totalCount).toFixed(1) : "0.0";
    } else if (clipRating.ratingCounts) {
      const ratingCounts = clipRating.ratingCounts;
      if (!ratingCounts || ratingCounts.length === 0) return "0.0";
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

    return "0.0";
  }, [clip._id, ratings]);

  // Denial count
  const denialCount = useMemo(() => {
    if (!ratings || !ratings[clip._id]) return 0;
    const clipRating = ratings[clip._id];

    if (clipRating.ratings) {
      return clipRating.ratings.deny?.length || 0;
    } else if (clipRating.ratingCounts) {
      const denyData = clipRating.ratingCounts.find(r => r && r.rating === 'deny');
      return denyData?.count || 0;
    }
    return 0;
  }, [clip._id, ratings]);

  const totalRatings = useMemo(() => {
    if (!ratings || !ratings[clip._id]) return 0;
    const clipRating = ratings[clip._id];

    if (clipRating.ratings) {
      const ratingCategories = ['1', '2', '3', '4'] as const;
      let total = 0;
      for (const category of ratingCategories) {
        total += clipRating.ratings[category]?.length || 0;
      }
      return total;
    } else if (clipRating.ratingCounts) {
      const numericRatings = clipRating.ratingCounts.filter(r =>
        r && r.rating !== 'deny' && ['1', '2', '3', '4'].includes(r.rating)
      );
      return numericRatings.reduce((acc, curr) => acc + (curr?.count || 0), 0);
    }
    return 0;
  }, [clip._id, ratings]);

  const formattedDate = format(new Date(clip.createdAt));
  const streamerAvatar = generateAvatar(clip.streamer) || undefined;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.15 }}
      onClick={() => setExpandedClip(clip._id)}
      className="flex flex-col h-full bg-[#181818] hover:bg-[#202020] rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-xl select-none"
    >
      {/* 16:9 Thumbnail Container */}
      <div
        className="relative overflow-hidden aspect-video bg-[#0e1315]"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
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
          <img
            src={clip.thumbnail}
            alt={clip.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
            }}
          />
        )}

        {/* Subtle dark overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Comments Badge (Bottom-Right) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[11px] font-medium text-[#f1f1f1] border border-white/10">
          <IoChatbubbleEllipsesOutline size={12} className="text-neutral-300" />
          <span>{clip.comments?.length || 0}</span>
        </div>

        {/* Rating/Denial Badges (Top-Right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {hasRated && userRating && (
            <div className="px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-xs border border-white/15 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
              {userRating === 'deny' ? (
                <span className="text-red-400">Denied</span>
              ) : (
                <>
                  <FaStar className="text-amber-400" size={10} />
                  <span>{userRating}</span>
                </>
              )}
            </div>
          )}

          {isDenied && user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
            <div className="px-2 py-0.5 rounded-md bg-red-950/90 border border-red-500/40 text-red-300 text-[11px] font-bold shadow-sm">
              Denied
            </div>
          )}
        </div>
      </div>

      {/* Details Row: Streamer Avatar + Title + Metadata */}
      <div className="p-3.5 flex gap-3 flex-1">
        {/* Streamer Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#0e1315] border border-[#2c2c2c] overflow-hidden shrink-0 mt-0.5 flex items-center justify-center">
          <img
            src={streamerAvatar}
            alt={clip.streamer}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#f1f1f1] group-hover:text-white line-clamp-2 leading-snug tracking-tight transition-colors">
              {clip.title}
            </h3>

            <div className="text-xs text-[#aaaaaa] hover:text-white font-medium mt-1 truncate transition-colors flex items-center gap-1">
              <span>{clip.streamer}</span>
            </div>

            <div className="text-xs text-[#717171] mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-neutral-400 font-medium">
                <FaThumbsUp size={10} className="text-neutral-500" />
                <span>{clip.upvotes}</span>
              </span>
              <span className="text-neutral-600">•</span>
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Team rating row (admin/clipteam only) */}
          {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#262626]">
              {averageRating && averageRating !== "0.0" && (
                <div
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#222222] border border-[#333333] text-[11px] text-[#cccccc] font-medium"
                  title={totalRatings > 0 ? `Ratings: ${totalRatings}` : 'No ratings yet'}
                >
                  <FaStar className="text-amber-400" size={9} />
                  <span>{averageRating}</span>
                  {totalRatings > 0 && <span className="text-[10px] text-neutral-500">({totalRatings})</span>}
                </div>
              )}

              {denialCount > 0 && (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#261818] border border-[#442222] text-[11px] text-red-400 font-medium">
                  <FaBan size={9} />
                  <span>{denialCount}</span>
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