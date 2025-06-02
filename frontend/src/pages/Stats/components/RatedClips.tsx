import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay } from 'react-icons/fa';
import { useNotification } from '../../../context/NotificationContext';
import { Rating, Clip } from '../../../types/adminTypes';

interface RatedClipsProps {
    ratingsData: Record<string, Rating>;
    clipsData: Clip[];
    location?: any;
}

const RatedClips: React.FC<RatedClipsProps> = ({ ratingsData, clipsData, location }) => {
    const [ratedClips, setRatedClips] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9);
    const [isLoading, setIsLoading] = useState(true);
    const { showError } = useNotification();

    // Filter rated clips for the current user
    useEffect(() => {
        const filterUserRatedClips = () => {
            try {
                setIsLoading(true);
                
                // Get user ID from localStorage (assuming JWT contains user info)
                const token = localStorage.getItem('token');
                if (!token) {
                    setRatedClips([]);
                    return;
                }
                
                // Extract user ID from token
                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                const userId = tokenPayload.id;
                
                if (!userId) {
                    setRatedClips([]);
                    return;
                }

                // Filter clips that user has rated
                const userRated: Clip[] = [];
                
                clipsData.forEach(clip => {
                    const clipRatings = ratingsData[clip._id];
                    if (!clipRatings || !clipRatings.ratingCounts) return;
                    
                    // Check if user has rated this clip
                    const userRatedThis = clipRatings.ratingCounts.some(
                        ratingCount => ratingCount.users && 
                        ratingCount.users.some(ratingUser => ratingUser.userId === userId)
                    );
                    
                    if (userRatedThis) {
                        // Find what rating the user gave
                        let userRating = null;
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
                
                // Sort by creation date (newest first)
                const sortedRated = [...userRated].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
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

    // Get clips for current page
    const indexOfLastClip = currentPage * itemsPerPage;
    const indexOfFirstClip = indexOfLastClip - itemsPerPage;
    const currentClips = ratedClips.slice(indexOfFirstClip, indexOfLastClip);
    const totalPages = Math.ceil(ratedClips.length / itemsPerPage);

    // Handle page change
    const paginate = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // Rating badge color
    const getRatingColor = (rating: string | number) => {
        if (rating === 1) return "bg-blue-600";
        if (rating === 2) return "bg-green-600";
        if (rating === 3) return "bg-amber-500";
        if (rating === 4) return "bg-orange-500";
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
                </div>
            ) : ratedClips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">🎬</div>
                    <h3 className="text-xl font-medium text-neutral-800 dark:text-neutral-200 mb-2">
                        No rated clips found
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
                        You haven't rated any clips yet. Visit the clip browser to start rating clips and help the team!
                    </p>
                    <Link
                        to="/clips"
                        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                        Browse Clips
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
                        {currentClips.map((clip) => (
                            <motion.div
                                key={clip._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{ scale: 1.03 }}
                                className="relative group aspect-video rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition duration-200"
                            >
                                <Link 
                                    to={`/clips/${clip._id}`}
                                    state={{ from: location }}
                                    className="block w-full h-full"
                                >
                                    {/* Rating badge */}
                                    <div className="absolute z-30 top-2 right-2 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center font-bold text-sm shadow-md"
                                         style={{ backgroundColor: getRatingColor(clip.userRating) }}>
                                        {clip.userRating === "deny" ? "Denied" : `Rated ${clip.userRating}`}
                                    </div>
                                    
                                    {/* Streamer name */}
                                    <div className="absolute z-30 top-2 left-2 bg-neutral-800/80 backdrop-blur-sm text-white px-3 py-1 font-bold rounded-md text-sm">
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
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <div className="bg-blue-600/80 p-4 rounded-full">
                                                <FaPlay className="text-xl text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Title overlay at bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                        <h3 className="text-white text-sm font-medium line-clamp-2">{clip.title}</h3>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 mb-2">
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${
                                        currentPage === 1
                                            ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
                                            : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                                    }`}
                                >
                                    Prev
                                </button>
                                
                                {[...Array(totalPages).keys()].map(number => (
                                    <button
                                        key={number + 1}
                                        onClick={() => paginate(number + 1)}
                                        className={`w-8 h-8 rounded-md flex items-center justify-center ${
                                            currentPage === number + 1
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                                        }`}
                                    >
                                        {number + 1}
                                    </button>
                                ))}
                                
                                <button
                                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-md ${
                                        currentPage === totalPages
                                            ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
                                            : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RatedClips;
