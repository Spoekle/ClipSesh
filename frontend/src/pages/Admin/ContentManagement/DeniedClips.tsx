import React, { useState } from 'react';
import { Link, Location } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaThumbsDown, 
  FaBan, 
  FaExclamationTriangle,
  FaChevronLeft, 
  FaChevronRight,
  FaFilter
} from 'react-icons/fa';
import { Clip, Rating } from '../../../types/adminTypes';

type SortBy = 'newest' | 'oldest' | 'mostDenied';

interface DeniedClipsProps {
  clips: Clip[];
  ratings: Record<string, Rating>;
  config: {
    denyThreshold: number;
  };
  location: Location;
}

const DeniedClips: React.FC<DeniedClipsProps> = ({ clips, ratings, config, location }) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortBy, setSortBy] = useState<SortBy>('newest');
    const clipsPerPage = 9;

    const filteredClips = clips.filter(clip => {
        const ratingData = ratings[clip._id];
        if (!ratingData || !ratingData.ratings) {
            return false;
        }
        
        const denyRatings = ratingData.ratings.deny;
        return denyRatings && Array.isArray(denyRatings) && denyRatings.length >= config.denyThreshold;
    });

    const sortedClips = [...filteredClips].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        } else if (sortBy === 'oldest') {
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        } else if (sortBy === 'mostDenied') {
            const aDenyCount = ratings[a._id]?.ratings?.deny?.length || 0;
            const bDenyCount = ratings[b._id]?.ratings?.deny?.length || 0;
            return bDenyCount - aDenyCount;
        }
        return 0;
    });

    const totalPages = Math.ceil(sortedClips.length / clipsPerPage);
    const indexOfLastClip = currentPage * clipsPerPage;
    const indexOfFirstClip = indexOfLastClip - clipsPerPage;
    const currentClips = sortedClips.slice(indexOfFirstClip, indexOfLastClip);

    const paginate = (pageNumber: number) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-3 md:col-span-2 col-span-1 w-full h-auto bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl"
        >
            <div className="flex justify-between items-center mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700">
                <h2 className="text-2xl md:text-3xl font-bold flex items-center">
                    <FaBan className="mr-3 text-red-500" /> 
                    Denied Clips
                </h2>
                
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium hidden sm:block">Sort by:</span>
                    <div className="inline-flex bg-neutral-200 dark:bg-neutral-700 rounded-lg relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            className="bg-transparent text-sm font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="mostDenied">Most Denied</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                            <FaFilter className="text-neutral-500 dark:text-neutral-400" />
                        </div>
                    </div>
                </div>
            </div>
            
            {!filteredClips.length ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg text-center flex flex-col items-center"
                >
                    <FaExclamationTriangle className="text-4xl text-yellow-500 mb-3" />
                    <h3 className="text-xl font-semibold mb-2">No Denied Clips</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        There are currently no clips that exceed the denial threshold of {config.denyThreshold} votes.
                    </p>
                </motion.div>
            ) : (
                <>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4"
                    >
                        {currentClips.map((clip) => {
                            const ratingData = ratings[clip._id];
                            const denyCount = ratingData?.ratings?.deny?.length || 0;
                            const denyPercentage = Math.round((denyCount / (config.denyThreshold * 2)) * 100);
                            
                            return (
                                <motion.div
                                    key={clip._id}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Link
                                        to={`/clips/${clip._id}`}
                                        state={{ from: location }}
                                        className="block h-full bg-white dark:bg-neutral-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                                    >
                                        <div className="relative">
                                            <video
                                                src={clip.url}
                                                className="w-full aspect-video object-cover"
                                                poster={clip.thumbnail}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    <FaThumbsDown className="text-xl text-red-500" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white font-medium drop-shadow">{clip.title.substring(0, 25)}{clip.title.length > 25 ? '...' : ''}</span>
                                                    <span className="bg-red-500/90 text-white px-2 py-0.5 rounded-md text-sm font-medium flex items-center gap-1">
                                                        <FaThumbsDown className="text-xs" /> {denyCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between mb-2">
                                                <p className="text-sm opacity-80">By: {clip.streamer}</p>
                                                <p className="text-sm opacity-80">
                                                    {new Date(clip.createdAt).toLocaleDateString() || 'Unknown date'}
                                                </p>
                                            </div>
                                            
                                            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 mt-2">
                                                <div 
                                                    className="bg-red-500 h-1.5 rounded-full" 
                                                    style={{ width: `${Math.min(100, denyPercentage)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs mt-1">
                                                <span>Denial threshold</span>
                                                <span>{denyCount}/{config.denyThreshold} votes</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-8 gap-1">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-md bg-neutral-200 dark:bg-neutral-700 disabled:opacity-50 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                                aria-label="Previous page"
                            >
                                <FaChevronLeft />
                            </button>
                            
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageToShow: number | string;
                                    if (totalPages <= 5) {
                                        pageToShow = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageToShow = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageToShow = totalPages - 4 + i;
                                    } else {
                                        pageToShow = currentPage - 2 + i;
                                    }
                                    
                                    if (typeof pageToShow === 'number') {
                                        return (
                                            <motion.button
                                                key={`page-${pageToShow}`}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => paginate(pageToShow as number)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                                                    currentPage === pageToShow
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                                                }`}
                                            >
                                                {pageToShow}
                                            </motion.button>
                                        );
                                    } else {
                                        return (
                                            <span key={`dots-${i}`} className="px-3 py-1">...</span>
                                        );
                                    }
                                })}
                            </div>
                            
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-md bg-neutral-200 dark:bg-neutral-700 disabled:opacity-50 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                                aria-label="Next page"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

export default DeniedClips;