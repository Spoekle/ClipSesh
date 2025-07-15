import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '../../../../../context/AlertContext';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { User, Clip, Rating, RatingUser } from '../../../../../types/adminTypes';
import { getRatingById, submitRating } from '../../../../../services/ratingService';

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
            className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg"
        >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                <IoMdInformationCircleOutline className="mr-2" />
                Clip Team Controls
                {isSubmitting && (
                    <div className="ml-2 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="ml-1 text-sm text-neutral-600 dark:text-neutral-400">Submitting...</span>
                    </div>
                )}
            </h3>
            
            {cannotRateOwnClip && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4">
                    <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                        ⚠️ You cannot rate clips you submitted or are the streamer of.
                    </p>
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">Loading ratings...</span>
                </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {[1, 2, 3, 4].map((rate) => {
                    const isSelected = userCurrentRating === rate.toString();
                    
                    return (
                        <button
                            key={rate}
                            className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 transform ${getButtonColors(rate, isSelected)} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !isDisabled && rateOrDenyClip(clip._id, rate)}
                            disabled={isDisabled}
                            title={cannotRateOwnClip ? "You cannot rate your own clips" : `Rate this clip ${rate} stars`}
                        >
                            {rate}
                            {isSelected && <span className="ml-1">★</span>}
                        </button>
                    );
                })}
                
                <button
                    className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 transform ${
                        isDenied
                            ? 'bg-red-600 text-white shadow-lg scale-110 ring-2 ring-red-300 dark:ring-red-800 hover:grayscale'
                            : cannotRateOwnClip
                                ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                                : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-red-600 hover:text-white hover:scale-105'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isDisabled && rateOrDenyClip(clip._id, null, true)}
                    disabled={isDisabled}
                    title={cannotRateOwnClip ? "You cannot deny your own clips" : "Deny this clip"}
                >
                    Deny
                    {isDenied && <span className="ml-1">✓</span>}
                </button>
            </div>
        </motion.div>
    );
};

export default RatingPanel;
