import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '../../../../../context/AlertContext';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { User, Clip, Rating, RatingUser } from '../../../../../types/adminTypes';
import { getRatingById, submitRating } from '../../../../../services/ratingService';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

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
            return 'bg-[#f23030] text-white shadow-md shadow-[#f23030]/25 ring-2 ring-[#f23030]/50';
        } else if (isUserStreamerOrSubmitter) {
            return 'bg-[#0e1315]/50 border border-[#263238] text-[#626262] cursor-not-allowed';
        } else {
            return 'bg-[#0e1315] border border-[#263238] text-white hover:border-[#f23030] hover:text-[#f23030] transition-colors';
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
            className="mt-6 p-6 bg-[#161d21] rounded-xl border border-[#263238] shadow-sm text-white"
        >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#263238]">
                <div>
                    <h3 className="text-base font-bold text-white">Rate This Clip</h3>
                    <p className="text-xs text-[#8b98a5]">1 = Top Tier · 4 = Filler Material</p>
                </div>
                {isSubmitting && (
                    <div className="flex items-center bg-[#f23030]/15 border border-[#f23030]/30 px-3 py-1 rounded-full">
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[#f23030] border-t-transparent"></div>
                        <span className="ml-2 text-xs text-[#f23030] font-semibold">Submitting...</span>
                    </div>
                )}
            </div>

            {cannotRateOwnClip && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 mb-4">
                    <p className="text-amber-400 text-sm font-medium flex items-center gap-1.5">
                        <FaExclamationTriangle className="shrink-0" />
                        <span>You cannot rate clips you submitted or are the streamer of.</span>
                    </p>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#263238] border-t-[#f23030]"></div>
                    <span className="ml-3 text-[#b3b3b3] text-sm">Loading ratings...</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Rating description */}
                    <p className="text-xs text-[#b3b3b3]">
                        1 = Top Tier, 4 = Filler Material
                    </p>

                    {/* Rating buttons - larger and more prominent */}
                    <div className="grid grid-cols-5 gap-3">
                        {[1, 2, 3, 4].map((rate) => {
                            const isSelected = userCurrentRating === rate.toString();

                            return (
                                <button
                                    key={rate}
                                    className={`flex flex-col items-center justify-center py-4 px-2 rounded-[10px] font-bold transition-all duration-200 ${getButtonColors(rate, isSelected)} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                            className={`flex flex-col items-center justify-center py-4 px-2 rounded-[10px] font-bold transition-all duration-200 ${isDenied
                                    ? 'bg-[#f23030] text-white shadow-lg ring-2 ring-[#f23030]/50'
                                    : cannotRateOwnClip
                                        ? 'bg-[#0e1315]/50 border border-[#263238] text-[#626262] cursor-not-allowed'
                                        : 'bg-[#0e1315] border border-[#263238] text-[#e6e6e6] hover:bg-[#f23030] hover:text-white'
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
