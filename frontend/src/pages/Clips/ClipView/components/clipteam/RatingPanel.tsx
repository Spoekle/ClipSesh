import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '../../../../../context/AlertContext';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { User, Clip, Rating, RatingUser } from '../../../../../types/adminTypes';
import { getRatingById, submitRating } from '../../../../../services/ratingService';
import { FaTimes } from 'react-icons/fa';

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

    // Memoize the current ratings data to avoid unnecessary recalculations
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
                        [clip._id]: ratingsData
                    });
                }
            } catch (error) {
                console.error('Error fetching ratings:', error);
                showError('Failed to load ratings');
            } finally {
                setIsLoading(false);
            }
        }
    }, [clip._id, ratings, showError]);

    const fetchUserCurrentRating = useCallback(() => {
        if (!user) {
            setUserCurrentRating(null);
            return;
        }

        if (!currentRatingsData) {
            setUserCurrentRating(null);
            return;
        }

        // Check new ratingCounts structure first
        if (currentRatingsData.ratingCounts) {
            for (const ratingGroup of currentRatingsData.ratingCounts) {
                const users = ratingGroup.users || [];
                if (users.some((u: RatingUser) => u && u.userId === user._id)) {
                    setUserCurrentRating(ratingGroup.rating.toString());
                    return;
                }
            }
        }
        // Fallback to old ratings structure
        else if (currentRatingsData.ratings) {
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

    // Fetch user rating when ratings data is available
    useEffect(() => {
        fetchUserCurrentRating();
    }, [fetchUserCurrentRating]);

    const rateOrDenyClip = useCallback(async (id: string, rating: number | null = null, deny: boolean = false): Promise<void> => {
        if (isSubmitting) return; // Prevent double submissions

        setIsSubmitting(true);
        try {
            const ratingValue = rating !== null ? rating.toString() as '1' | '2' | '3' | '4' : 'deny';

            // Check if user is removing their current rating
            const isRemovingRating = userCurrentRating === ratingValue;

            await submitRating(id, ratingValue);

            // Update local state immediately for better UX
            if (isRemovingRating) {
                setUserCurrentRating(null);
            } else if (rating !== null) {
                setUserCurrentRating(rating.toString());
            } else if (deny) {
                setUserCurrentRating('deny');
            }

            // Show appropriate success message
            if (isRemovingRating) {
                showSuccess('Rating removed successfully!');
            } else {
                showSuccess('Rating submitted successfully!');
            }

            await fetchClipsAndRatings(user);
        } catch (error: any) {
            showError('Error rating clip: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, user, userCurrentRating, fetchClipsAndRatings, showError, showSuccess]);

    const isUserStreamerOrSubmitter = useMemo((): boolean => {
        if (!user) return false;

        const username = user.username.toLowerCase();
        const currentClipSubmitter = currentClip.submitter.toLowerCase();
        const currentClipStreamer = currentClip.streamer.toLowerCase();

        // Check if user submitted this clip via Discord
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

        // Check new ratingCounts structure
        if (currentRatingsData.ratingCounts) {
            const denyRating = currentRatingsData.ratingCounts.find(r => r.rating === 'deny');
            if (!denyRating) return false;

            const denyUsers = denyRating.users || [];
            return denyUsers.some((u: { userId: string }) => u.userId === user._id);
        }
        // Fallback to old ratings structure
        else if (currentRatingsData.ratings) {
            const denyUsers = currentRatingsData.ratings.deny || [];
            return denyUsers.some((u: { userId: string }) => u.userId === user._id);
        }

        return false;
    }, [user, currentRatingsData]);

    // Memoize button colors function for better performance
    const getButtonColors = useCallback((rating: number, selected: boolean) => {
        if (selected) {
            switch (rating) {
                case 4: return 'bg-red-500 text-white shadow-lg scale-110 ring-2 ring-red-300 dark:ring-red-700 hover:grayscale';
                case 3: return 'bg-orange-500 text-white shadow-lg scale-110 ring-2 ring-orange-300 dark:ring-orange-700 hover:grayscale';
                case 2: return 'bg-yellow-600 text-white shadow-lg scale-110 ring-2 ring-yellow-300 dark:ring-yellow-700 hover:grayscale';
                case 1: return 'bg-green-600 text-white shadow-lg scale-110 ring-2 ring-green-300 dark:ring-green-700 hover:grayscale';
                default: return 'bg-blue-500 text-white shadow-lg scale-110 ring-2 ring-blue-300 dark:ring-blue-700 hover:grayscale';
            }
        } else if (isUserStreamerOrSubmitter) {
            return 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed';
        } else {
            switch (rating) {
                case 4: return 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-red-500 hover:text-white hover:scale-105';
                case 3: return 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-orange-500 hover:text-white hover:scale-105';
                case 2: return 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-yellow-600 hover:text-white hover:scale-105';
                case 1: return 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-green-600 hover:text-white hover:scale-105';
                default: return 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-blue-400 hover:text-white hover:scale-105';
            }
        }
    }, [isUserStreamerOrSubmitter]);

    const cannotRateOwnClip = isUserStreamerOrSubmitter;
    const isDenied = isClipDeniedByUser;
    const isDisabled = isLoading || isSubmitting || cannotRateOwnClip;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-6 bg-neutral-100 dark:bg-neutral-700/50 rounded-xl border border-neutral-200 dark:border-neutral-600"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
                    <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <IoMdInformationCircleOutline className="text-white" />
                    </span>
                    Rate This Clip
                </h3>
                {isSubmitting && (
                    <div className="flex items-center bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="ml-2 text-sm text-blue-700 dark:text-blue-300 font-medium">Submitting...</span>
                    </div>
                )}
            </div>

            {cannotRateOwnClip && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
                    <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                        ⚠️ You cannot rate clips you submitted or are the streamer of.
                    </p>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-neutral-300 dark:border-neutral-600 border-t-blue-600"></div>
                    <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading ratings...</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Rating description */}
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        1 = Top Tier, 4 = Filler Material
                    </p>

                    {/* Rating buttons - larger and more prominent */}
                    <div className="grid grid-cols-5 gap-3">
                        {[1, 2, 3, 4].map((rate) => {
                            const isSelected = userCurrentRating === rate.toString();

                            return (
                                <button
                                    key={rate}
                                    className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl font-bold transition-all duration-200 ${getButtonColors(rate, isSelected)} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => !isDisabled && rateOrDenyClip(clip._id, rate)}
                                    disabled={isDisabled}
                                    title={cannotRateOwnClip ? "You cannot rate your own clips" : `Rate ${rate}`}
                                >
                                    <span className="text-2xl">{rate}</span>
                                </button>
                            );
                        })}

                        {/* Deny button */}
                        <button
                            className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl font-bold transition-all duration-200 ${isDenied
                                    ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-300 dark:ring-red-800'
                                    : cannotRateOwnClip
                                        ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                                        : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-red-600 hover:text-white'
                                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !isDisabled && rateOrDenyClip(clip._id, null, true)}
                            disabled={isDisabled}
                            title={cannotRateOwnClip ? "You cannot deny your own clips" : "Deny this clip"}
                        >
                            <span className="text-2xl"><FaTimes /></span>
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default RatingPanel;
