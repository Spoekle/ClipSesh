'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaThumbsUp, FaEye } from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { format } from 'timeago.js';
import { User, Clip, Rating } from '@/types/adminTypes';
import { getClipVoteStatus } from '@/services/clipService';
import { computeClipRatingSummary } from '../utils/clipRatingHelpers';
import { ClipItemTeamRating } from './ClipItemTeamRating';

interface ClipItemProps {
  clip: Clip;
  user: User | null;
  ratings?: Record<string, Rating>;
  config?: { denyThreshold?: number } | null;
  filterRatedClips?: boolean;
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
  setExpandedClip,
}) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({ hasVoted: false });

  // Fetch the user's vote status for this clip
  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        const voteData = await getClipVoteStatus(clip._id);
        setVoteStatus(voteData);
      } catch (error: unknown) {
        console.error('Error fetching vote status:', error);
      }
    };

    checkVoteStatus();
  }, [clip._id]);

  const {
    userRating,
    hasRated,
    isDenied,
    averageRating,
    denialCount,
    totalRatings,
  } = useMemo(() => {
    return computeClipRatingSummary(clip._id, ratings, user, config?.denyThreshold);
  }, [clip._id, ratings, user, config?.denyThreshold]);

  const isStaff = Boolean(
    user && (user.roles.includes('admin') || user.roles.includes('clipteam'))
  );
  const formattedDate = format(new Date(clip.createdAt));

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.1 }}
      onClick={() => setExpandedClip(clip._id)}
      className="flex flex-col h-full bg-cc-card hover:bg-secondary/40 rounded-xl overflow-hidden border border-border transition-colors duration-150 group cursor-pointer shadow-sm hover:shadow-lg select-none"
    >
      {/* 16:9 Thumbnail Container */}
      <div
        className="relative overflow-hidden aspect-video bg-cc-card"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isHovering ? (
          <video
            src={clip.url}
            loop
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={clip.thumbnail}
            alt={clip.title}
            className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-103"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
            }}
          />
        )}

        {/* Subtle dark overlay for contrast */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

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

          {isDenied && isStaff && (
            <div className="px-2 py-0.5 rounded-md bg-red-950/90 border border-red-500/40 text-red-300 text-[11px] font-bold shadow-sm">
              Denied
            </div>
          )}
        </div>
      </div>

      {/* Details: Title + Metadata */}
      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div className="flex items-start justify-between gap-3">
          {/* Left Column: Title, Streamer, Date */}
          <div className="min-w-0 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-foreground line-clamp-2 leading-snug tracking-tight transition-colors">
              {clip.title}
            </h3>

            <div className="text-xs text-muted-foreground hover:text-foreground font-medium truncate transition-colors mt-1">
              <span>{clip.streamer}</span>
            </div>

            <span className="text-xs text-muted-foreground mt-0.5">{formattedDate}</span>
          </div>

          {/* Right Column: Views, Comments, Likes */}
          <div className="flex flex-col items-end justify-start gap-1 shrink-0 text-xs text-muted-foreground font-medium pt-0.5">
            <span className="flex items-center gap-1.5" title={`${clip.views || 0} views`}>
              <FaEye size={11} className="text-muted-foreground/60" />
              <span>{clip.views || 0}</span>
            </span>

            <span className="flex items-center gap-1.5" title={`${clip.comments?.length || 0} comments`}>
              <IoChatbubbleEllipsesOutline size={12} className="text-muted-foreground" />
              <span>{clip.comments?.length || 0}</span>
            </span>

            <span className="flex items-center gap-1.5" title={`${clip.upvotes || 0} likes`}>
              <FaThumbsUp
                size={10}
                className={voteStatus.hasVoted && voteStatus.voteType === 'upvote' ? 'text-cc-red' : 'text-muted-foreground/60'}
              />
              <span className={voteStatus.hasVoted && voteStatus.voteType === 'upvote' ? 'text-cc-red font-semibold' : ''}>
                {clip.upvotes || 0}
              </span>
            </span>
          </div>
        </div>

        {/* Team rating row (admin/clipteam only) */}
        {isStaff && (
          <ClipItemTeamRating
            averageRating={averageRating}
            totalRatings={totalRatings}
            denialCount={denialCount}
          />
        )}
      </div>
    </motion.div>
  );
};

export default ClipItem;