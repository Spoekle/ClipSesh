import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay } from 'react-icons/fa';
import { useNotification } from '../../../../context/AlertContext';
import { Rating, Clip } from '../../../../types/adminTypes';

interface ExtendedClip extends Clip {
    userRating?: string | number;
}

interface RatedClipsProps {
    ratingsData: Record<string, Rating>;
    clipsData: Clip[];
    location?: {
        pathname: string;
        state?: unknown;
    };
}

const RatedClips: React.FC<RatedClipsProps> = ({ ratingsData, clipsData, location }) => {
    const [ratedClips, setRatedClips] = useState<ExtendedClip[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9);
    const [isLoading, setIsLoading] = useState(true);
    const { showError } = useNotification();

    useEffect(() => {
        const filterUserRatedClips = () => {
            try {
                setIsLoading(true);

                const token = localStorage.getItem('token');
                if (!token) {
                    setRatedClips([]);
                    return;
                }

                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                const userId = tokenPayload.id;

                if (!userId) {
                    setRatedClips([]);
                    return;
                }

                const userRated: ExtendedClip[] = [];

                clipsData.forEach(clip => {
                    const clipRatings = ratingsData[clip._id];
                    if (!clipRatings || !clipRatings.ratingCounts) return;

                    const userRatedThis = clipRatings.ratingCounts.some(
                        ratingCount => ratingCount.users &&
                            ratingCount.users.some(ratingUser => ratingUser.userId === userId)
                    );

                    if (userRatedThis) {
                        let userRating: string | number | undefined = undefined;
                        clipRatings.ratingCounts.forEach(ratingCount => {
                            const userRatingObj = ratingCount.users.find(u => u.userId === userId);
                            if (userRatingObj) {
                                userRating = ratingCount.rating;
                            }
                        });

                        userRated.push({
                            ...clip,
                            userRating
                        });
                    }
                });

                const sortedRated = [...userRated].sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                setRatedClips(sortedRated);
            } catch (error) {
                console.error('Error filtering rated clips:', error);
                showError('Could not load your rated clips');
                setRatedClips([]);
            } finally {
                setIsLoading(false);
            }
        };

        filterUserRatedClips();
    }, [clipsData, ratingsData, showError]);

    const indexOfLastClip = currentPage * itemsPerPage;
    const indexOfFirstClip = indexOfLastClip - itemsPerPage;
    const currentClips = ratedClips.slice(indexOfFirstClip, indexOfLastClip);
    const totalPages = Math.ceil(ratedClips.length / itemsPerPage);

    const paginate = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };
    const getRatingColor = (rating: string | number) => {
        if (rating === 1 || rating === '1') return "bg-blue-600";
        if (rating === 2 || rating === '2') return "bg-green-600";
        if (rating === 3 || rating === '3') return "bg-amber-500";
        if (rating === 4 || rating === '4') return "bg-orange-600";
        if (rating === "deny") return "bg-red-600";
        return "bg-neutral-600";
    };

    return (
        <div className="w-full">
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
                    {Array(6).fill(0).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-video bg-neutral-800/20 animate-pulse rounded-lg overflow-hidden shadow-md"
                        />
                    ))}
                </div>) : ratedClips.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-center bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm"
                    >
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                            <div className="text-4xl">🎬</div>
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-3">
                            No rated clips found
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400 max-w-md mb-8 leading-relaxed">
                            You haven't rated any clips yet. Visit the clip browser to start rating clips and help the team!
                        </p>
                        <Link
                            to="/clips"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            Browse Clips
                        </Link>
                    </motion.div>
                ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
                        {currentClips.map((clip: ExtendedClip) => (
                            <motion.div
                                key={clip._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }} whileHover={{ scale: 1.03, y: -5 }}
                                className="relative group aspect-video rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-200 dark:border-neutral-700"
                            >
                                <Link
                                    to={`/clips/${clip._id}`}
                                    state={{ from: location }}
                                    className="block w-full h-full"
                                >
                                    {/* Rating badge */}
                                    <div className={`absolute z-30 top-3 right-3 backdrop-blur-sm text-white px-3 py-2 rounded-xl flex items-center font-bold text-sm shadow-lg border border-white/20 ${getRatingColor(clip.userRating || 'unknown')}`}>
                                        {clip.userRating === "deny" ? "Denied" : `Rated ${clip.userRating || 'Unknown'}`}
                                    </div>

                                    {/* Streamer name */}
                                    <div className="absolute z-30 top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-4 py-2 font-bold rounded-xl text-sm border border-white/10">
                                        {clip.streamer}
                                    </div>

                                    {/* Video or thumbnail */}
                                    <div className="w-full h-full bg-neutral-900 relative">
                                        {clip.thumbnail ? (
                                            <img
                                                src={clip.thumbnail}
                                                alt={clip.title}
                                                className="w-full h-full object-cover absolute inset-0"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-neutral-800">
                                                <span className="text-neutral-400 text-sm px-2 text-center">{clip.title}</span>
                                            </div>
                                        )}
                                        {/* Play overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                                            <motion.div
                                                whileHover={{ scale: 1.2 }}
                                                className="bg-white/10 px-5 py-4 rounded-full shadow-xl border border-white/20 backdrop-blur-sm"
                                            >
                                                <FaPlay className="text-2xl text-white/50 ml-1" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Title overlay at bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/70">
                                        <h3 className="text-white text-sm font-medium line-clamp-2">{clip.title}</h3>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                    {/* Modern Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8 mb-4">
                            <div className="flex items-center space-x-2 bg-white dark:bg-neutral-800 rounded-2xl p-2 shadow-lg border border-neutral-200 dark:border-neutral-700">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${currentPage === 1
                                        ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                                        : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300'
                                        }`}
                                >
                                    Previous
                                </motion.button>

                                <div className="flex flex-wrap justify-center gap-1 max-w-lg mx-2">
                                    {[...Array(totalPages).keys()].map(number => (
                                        <motion.button
                                            key={number + 1}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => paginate(number + 1)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all duration-200 ${currentPage === number + 1
                                                ? 'bg-blue-500 text-white shadow-lg'
                                                : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300'
                                                }`}
                                        >
                                            {number + 1}
                                        </motion.button>
                                    ))}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${currentPage === totalPages
                                        ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                                        : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300'
                                        }`}
                                >
                                    Next
                                </motion.button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RatedClips;
