'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '@/context/AlertContext';
import { User, Clip, Rating, RatingUser } from '@/types/adminTypes';
import { getRatingById, submitRating } from '@/services/ratingService';
import { FaExclamationTriangle } from 'react-icons/fa';
import { RatingButtons } from './RatingButtons';

interface RatingPanelProps {
  clip: Clip;
  user: User | null;
  ratings: Record<string, Rating>;
  currentClip: Clip;
  isLoading: boolean;
  fetchClipsAndRatings: (user: User | null) => Promise<void>;
}

const RatingPanel: React.FC<RatingPanelProps> = ({
  clip,
  user,
  fetchClipsAndRatings,
  currentClip,
  ratings,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localRatings, setLocalRatings] = useState<Record<string, Rating> | null>(null);
  const [userCurrentRating, setUserCurrentRating] = useState<string | null>(null);
  const { showError, showSuccess } = useNotification();

  const currentRatingsData = useMemo(() => {
    return (ratings && ratings[clip._id]) || (localRatings && localRatings[clip._id]);
  }, [ratings, localRatings, clip._id]);

  const fetchRatings = useCallback(async () => {
    if (!ratings || !ratings[clip._id]) {
      setIsLoading(true);
      try {
        const ratingsData = await getRatingById(clip._id);
        if (ratingsData) {
          setLocalRatings({
            [clip._id]: ratingsData,
          });
        }
      } catch (error: unknown) {
        console.error('Error fetching ratings:', error);
        showError('Failed to load ratings');
      } finally {
        setIsLoading(false);
      }
    }
  }, [clip._id, ratings, showError]);

  const fetchUserCurrentRating = useCallback(() => {
    if (!user || !currentRatingsData) {
      setUserCurrentRating(null);
      return;
    }

    if (currentRatingsData.ratingCounts) {
      for (const ratingGroup of currentRatingsData.ratingCounts) {
        const users = ratingGroup.users || [];
        if (users.some((u: RatingUser) => u && u.userId === user._id)) {
          setUserCurrentRating(ratingGroup.rating.toString());
          return;
        }
      }
    } else if (currentRatingsData.ratings) {
      const ratingCategories = ['1', '2', '3', '4', 'deny'] as const;
      for (const category of ratingCategories) {
        const ratingUsers = currentRatingsData.ratings[category] || [];
        if (ratingUsers.some((u: RatingUser) => u && u.userId === user._id)) {
          setUserCurrentRating(category);
          return;
        }
      }
    }

    setUserCurrentRating(null);
  }, [user, currentRatingsData]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  useEffect(() => {
    fetchUserCurrentRating();
  }, [fetchUserCurrentRating]);

  const rateOrDenyClip = useCallback(
    async (rating: number | null, deny: boolean): Promise<void> => {
      if (isSubmitting) return;

      setIsSubmitting(true);
      try {
        const ratingValue =
          rating !== null ? (rating.toString() as '1' | '2' | '3' | '4') : 'deny';

        const isRemovingRating = userCurrentRating === ratingValue;

        await submitRating(clip._id, ratingValue);

        if (isRemovingRating) {
          setUserCurrentRating(null);
          showSuccess('Rating removed successfully!');
        } else {
          if (rating !== null) {
            setUserCurrentRating(rating.toString());
          } else if (deny) {
            setUserCurrentRating('deny');
          }
          showSuccess('Rating submitted successfully!');
        }

        await fetchClipsAndRatings(user);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        showError(`Error rating clip: ${msg}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, userCurrentRating, clip._id, fetchClipsAndRatings, user, showError, showSuccess]
  );

  const isUserStreamerOrSubmitter = useMemo((): boolean => {
    if (!user) return false;

    const username = user.username.toLowerCase();
    const currentClipSubmitter = currentClip.submitter.toLowerCase();
    const currentClipStreamer = currentClip.streamer.toLowerCase();
    const userDiscordId = user.discordId;
    const clipDiscordSubmitterId = currentClip.discordSubmitterId;

    return Boolean(
      username === currentClipSubmitter ||
        username === currentClipStreamer ||
        (userDiscordId && clipDiscordSubmitterId && userDiscordId === clipDiscordSubmitterId)
    );
  }, [user, currentClip]);

  const isClipDeniedByUser = useMemo(() => {
    if (!user || !currentRatingsData) return false;

    if (currentRatingsData.ratingCounts) {
      const denyRating = currentRatingsData.ratingCounts.find((r) => r.rating === 'deny');
      if (!denyRating) return false;
      const denyUsers = denyRating.users || [];
      return denyUsers.some((u: { userId: string }) => u.userId === user._id);
    } else if (currentRatingsData.ratings) {
      const denyUsers = currentRatingsData.ratings.deny || [];
      return denyUsers.some((u: { userId: string }) => u.userId === user._id);
    }

    return false;
  }, [user, currentRatingsData]);

  const cannotRateOwnClip = isUserStreamerOrSubmitter;
  const isDenied = isClipDeniedByUser;
  const isDisabled = isLoading || isSubmitting || cannotRateOwnClip;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1 }}
      className="mt-6 p-6 bg-cc-card rounded-xl border border-border shadow-sm text-foreground"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-foreground">Rate This Clip</h3>
          <p className="text-xs text-muted-foreground">1 = Top Tier · 4 = Filler Material</p>
        </div>
        {isSubmitting && (
          <div className="flex items-center bg-cc-red/15 border border-cc-red/30 px-3 py-1 rounded-full">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-cc-red border-t-transparent"></div>
            <span className="ml-2 text-xs text-cc-red font-semibold">Submitting...</span>
          </div>
        )}
      </div>

      {cannotRateOwnClip && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
          <p className="text-amber-400 text-sm font-medium flex items-center gap-1.5">
            <FaExclamationTriangle className="shrink-0" />
            <span>You cannot rate clips you submitted or are the streamer of.</span>
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-border border-t-primary"></div>
          <span className="ml-3 text-muted-foreground text-sm">Loading ratings...</span>
        </div>
      ) : (
        <RatingButtons
          userCurrentRating={userCurrentRating}
          cannotRateOwnClip={cannotRateOwnClip}
          isDenied={isDenied}
          isDisabled={isDisabled}
          isSubmitting={isSubmitting}
          onRateOrDeny={rateOrDenyClip}
        />
      )}
    </motion.div>
  );
};

export default RatingPanel;
