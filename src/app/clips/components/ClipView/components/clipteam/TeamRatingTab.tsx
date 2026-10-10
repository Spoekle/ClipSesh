'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import RatingDistributionGraph from './RatingDistributionGraph';
import { RatingUser } from '@/types/adminTypes';

interface TeamRatingTabProps {
  userCurrentRating: string | null;
  isUserStreamerOrSubmitter: boolean;
  isDisabled: boolean;
  isSubmitting: boolean;
  rateOrDenyClip: (rating: number | null, isDeny?: boolean) => Promise<void>;
  ratingCounts: Array<{ rating: string; count: number; users: RatingUser[] }>;
  totalRatings: number;
  averageRating: string;
}

export const TeamRatingTab: React.FC<TeamRatingTabProps> = ({
  userCurrentRating,
  isUserStreamerOrSubmitter,
  isDisabled,
  isSubmitting,
  rateOrDenyClip,
  ratingCounts,
  totalRatings,
  averageRating,
}) => {
  const getButtonColors = (rating: number, selected: boolean) => {
    if (selected) {
      return 'bg-primary text-white ring-2 ring-primary/50 shadow-md shadow-primary/20';
    }
    if (isUserStreamerOrSubmitter) {
      return 'bg-cc-ground/50 border border-border text-muted-foreground cursor-not-allowed';
    }
    return 'bg-cc-card border border-border text-white/90 hover:border-primary hover:text-primary transition-colors';
  };

  return (
    <motion.div
      key="rate"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-4"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div>
          <h3 className="font-bold text-white text-sm">Rating Score</h3>
          <p className="text-[11px] text-muted-foreground">1 = Top Tier · 4 = Filler Material</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
          Clip Team
        </span>
      </div>

      {isUserStreamerOrSubmitter && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
          <p className="text-amber-400 text-xs font-medium flex items-center gap-1.5">
            <FaExclamationTriangle className="shrink-0" />
            <span>You cannot rate your own clips.</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 mb-4">
        {[1, 2, 3, 4].map((rate) => {
          const isSelected = userCurrentRating === rate.toString();
          return (
            <button
              key={rate}
              type="button"
              onClick={() => !isDisabled && rateOrDenyClip(rate)}
              disabled={isDisabled}
              className={`flex items-center justify-center py-2.5 rounded-xl font-bold text-base transition-all cursor-pointer ${getButtonColors(
                rate,
                isSelected
              )} ${isSubmitting ? 'opacity-50' : ''}`}
            >
              <span>{rate}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => !isDisabled && rateOrDenyClip(null, true)}
          disabled={isDisabled}
          title="Deny clip"
          className={`flex items-center justify-center py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            userCurrentRating === 'deny'
              ? 'bg-rose-600 text-white ring-2 ring-rose-500/50 shadow-md'
              : isUserStreamerOrSubmitter
              ? 'bg-cc-ground/50 border border-border text-muted-foreground cursor-not-allowed'
              : 'bg-cc-card border border-border text-white/80 hover:border-rose-500/60 hover:text-rose-400'
          } ${isSubmitting ? 'opacity-50' : ''}`}
        >
          <FaTimes />
        </button>
      </div>

      {/* Ratings Stats breakdown */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Average Rating</span>
          <span className="font-bold text-white font-mono">{averageRating} / 4.0</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total Ratings</span>
          <span className="font-bold text-white font-mono">{totalRatings}</span>
        </div>

        <RatingDistributionGraph
          ratingCounts={ratingCounts}
          totalRatings={totalRatings}
          averageRating={averageRating}
          className="pt-2"
        />
      </div>
    </motion.div>
  );
};

export default TeamRatingTab;
