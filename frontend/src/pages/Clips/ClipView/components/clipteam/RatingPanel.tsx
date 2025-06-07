import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNotification } from '../../../../../context/NotificationContext';
import apiUrl from '../../../../../config/config';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { User, Clip, Rating, RatingUser } from '../../../../../types/adminTypes';

interface RatingPanelProps {
    clip: Clip;
    user: User | null;
    ratings: Record<string, Rating>;
    token: string;
    currentClip: Clip;
    isLoading: boolean;
    fetchClipsAndRatings: (user: User | null) => Promise<void>;
}

const RatingPanel: React.FC<RatingPanelProps> = ({
    clip,
    user,
    token,
    fetchClipsAndRatings,
    currentClip,
    ratings,
}) => {

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [localRatings, setLocalRatings] = useState<Record<string, Rating> | null>(null);
    const [userCurrentRating, setUserCurrentRating] = useState<string | null>(null);
    const { showError } = useNotification();

    const fetchRatings = async () => {
        if (!ratings || !ratings[clip._id]) {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${apiUrl}/api/ratings/${clip._id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined
                });

                if (response.data) {
                    setLocalRatings({
                        [clip._id]: response.data
                    });
                }
            } catch (error) {
                console.error('Error fetching ratings:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const fetchUserCurrentRating = () => {
        if (!user) {
            setUserCurrentRating(null);
            return;
        }

        // Use either provided ratings or locally fetched ones
        const ratingsData = (ratings && ratings[clip._id]) || (localRatings && localRatings[clip._id]);

        if (!ratingsData) {
            setUserCurrentRating(null);
            return;
        }

        // Check if we have the new ratingCounts structure
        if (ratingsData.ratingCounts) {
            for (const ratingGroup of ratingsData.ratingCounts) {
                const users = ratingGroup.users || [];
                if (users.some((u: RatingUser) => u && u.userId === user._id)) {
                    setUserCurrentRating(ratingGroup.rating.toString());
                    return;
                }
            }
        }
        // Fallback to old ratings structure
        else if (ratingsData.ratings) {
            const ratingCategories = ['1', '2', '3', '4', 'deny'] as const;
            for (const category of ratingCategories) {
                const ratingUsers = ratingsData.ratings[category] || [];
                if (ratingUsers.some((u: RatingUser) => u && u.userId === user._id)) {
                    setUserCurrentRating(category);
                    return;
                }
            }
        }
        
        setUserCurrentRating(null);
    };

    useEffect(() => {
        fetchRatings();
    }, [clip._id]);

    // Fetch user rating when ratings data is available
    useEffect(() => {
        if (ratings?.[clip._id] || localRatings?.[clip._id]) {
            fetchUserCurrentRating();
        }
    }, [clip._id, ratings?.[clip._id], localRatings?.[clip._id], user]);

    const rateOrDenyClip = async (id: string, rating: number | null = null, deny: boolean = false): Promise<void> => {
        try {
            const data = rating !== null ? { rating } : { deny };
            await axios.post(`${apiUrl}/api/ratings/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            // Update local state immediately for better UX
            if (rating !== null) {
                setUserCurrentRating(rating.toString());
            } else if (deny) {
                setUserCurrentRating('deny');
            }
            
            await fetchClipsAndRatings(user);
        } catch (error: any) {
            showError('Error rating clip: ' + (error.response?.data?.message || 'Unknown error'));
        } finally {
        }
    };

    const isUserStreamerOrSubmitter = (): boolean => {
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
    };

    const isClipDeniedByUser = () => {
        if (!user) return false;

        const ratingData = (ratings && ratings[clip._id]) || (localRatings && localRatings[clip._id]);
        if (!ratingData) return false;

        // Check new ratingCounts structure
        if (ratingData.ratingCounts) {
            const denyRating = ratingData.ratingCounts.find(r => r.rating === 'deny');
            if (!denyRating) return false;
            
            const denyUsers = denyRating.users || [];
            return denyUsers.some((u: { userId: string }) => u.userId === user._id);
        }
        // Fallback to old ratings structure
        else if (ratingData.ratings) {
            const denyUsers = ratingData.ratings.deny || [];
            return denyUsers.some((u: { userId: string }) => u.userId === user._id);
        }

        return false;
    };

    const cannotRateOwnClip = isUserStreamerOrSubmitter();
    const isDenied = isClipDeniedByUser();

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
            </h3>
            {cannotRateOwnClip && (
                <p className="text-amber-600 dark:text-amber-400 mb-3 font-medium">
                    You cannot rate clips you submitted or are the streamer of.
                </p>
            )}
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {[1, 2, 3, 4].map((rate) => {
                    const isSelected = userCurrentRating === rate.toString();
                    
                    // Color scheme matching RatingsPopup
                    const getButtonColors = (rating: number, selected: boolean) => {
                        if (selected) {
                            switch (rating) {
                                case 4: return 'bg-red-500 text-white shadow-lg scale-110 ring-2 ring-red-300 dark:ring-red-700 hover:grayscale';
                                case 3: return 'bg-orange-500 text-white shadow-lg scale-110 ring-2 ring-orange-300 dark:ring-orange-700 hover:grayscale';
                                case 2: return 'bg-yellow-600 text-white shadow-lg scale-110 ring-2 ring-yellow-300 dark:ring-yellow-700 hover:grayscale';
                                case 1: return 'bg-green-600 text-white shadow-lg scale-110 ring-2 ring-green-300 dark:ring-green-700 hover:grayscale';
                                default: return 'bg-blue-500 text-white shadow-lg scale-110 ring-2 ring-blue-300 dark:ring-blue-700 hover:grayscale';
                            }
                        } else if (cannotRateOwnClip) {
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
                    };

                    return (
                        <button
                            key={rate}
                            className={`px-4 py-2 rounded-full font-semibold transition transform ${getButtonColors(rate, isSelected)}`}
                            onClick={() => !cannotRateOwnClip && rateOrDenyClip(clip._id, rate)}
                            disabled={isLoading || cannotRateOwnClip}
                            title={cannotRateOwnClip ? "You cannot rate your own clips" : ""}
                        >
                            {rate}
                            {isSelected && <span className="ml-1">★</span>}
                        </button>
                    );
                })}
                <button
                    className={`px-4 py-2 rounded-full font-semibold transition transform ${isDenied
                        ? 'bg-red-600 text-white shadow-lg scale-110 ring-2 ring-red-300 dark:ring-red-800 hover:grayscale'
                        : cannotRateOwnClip
                            ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                            : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-white hover:bg-red-600 hover:text-white hover:scale-105'
                        }`}
                    onClick={() => !cannotRateOwnClip && rateOrDenyClip(clip._id, null, true)}
                    disabled={isLoading || cannotRateOwnClip}
                    title={cannotRateOwnClip ? "You cannot deny your own clips" : ""}
                >
                    Deny
                    {isDenied && <span className="ml-1">✓</span>}
                </button>
            </div>
        </motion.div>
    );
};

export default RatingPanel;
