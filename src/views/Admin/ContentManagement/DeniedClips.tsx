import React, { useState } from 'react';
import { Link, Location } from '@/lib/routerCompat';
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
                staggerChildren: 0.06
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-[#181818] border border-[#262626] rounded-2xl p-6 text-[#f1f1f1]"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#262626]">
                <div>
                    <h2 className="text-base font-bold flex items-center gap-2.5 text-[#f1f1f1]">
                        <div className="w-8 h-8 rounded-xl bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
                            <FaBan size={14} />
                        </div>
                        <span>Denied Clips</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#222222] text-[#aaaaaa] border border-[#333333]">
                            {filteredClips.length}
                        </span>
                    </h2>
                    <p className="text-xs text-[#717171] mt-1">
                        Clips that reached or exceeded the community rejection threshold ({config.denyThreshold} votes).
                    </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs font-medium text-[#717171]">Sort:</span>
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            className="bg-[#121212] border border-[#262626] text-[#f1f1f1] text-xs font-medium py-1.5 pl-3 pr-8 rounded-xl appearance-none cursor-pointer focus:border-[#444] focus:outline-none transition-colors"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="mostDenied">Most Denied</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5">
                            <FaFilter className="text-[#717171]" size={10} />
                        </div>
                    </div>
                </div>
            </div>

            {!filteredClips.length ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-12 bg-[#141414] rounded-xl text-center flex flex-col items-center border border-[#262626] my-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-[#eab308]/15 text-[#eab308] flex items-center justify-center mb-3">
                        <FaExclamationTriangle size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-[#f1f1f1] mb-1">No Denied Clips</h3>
                    <p className="text-[#aaaaaa] text-xs max-w-sm">
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
                                >
                                    <Link
                                        to={`/clips/${clip._id}`}
                                        state={{ from: location }}
                                        className="bg-[#141414] hover:bg-[#1c1c1c] border border-[#262626] hover:border-[#383838] rounded-xl overflow-hidden block h-full transition-all group shadow-sm"
                                    >
                                        <div className="relative aspect-video bg-[#0f0f0f] overflow-hidden">
                                            {clip.thumbnail ? (
                                                <img
                                                    src={clip.thumbnail}
                                                    alt={clip.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <video
                                                    src={clip.url}
                                                    className="w-full h-full object-cover"
                                                    poster={clip.thumbnail}
                                                />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-11 h-11 rounded-full bg-[#181818]/90 border border-[#383838] flex items-center justify-center text-[#f23030] shadow-lg">
                                                    <FaThumbsDown size={14} />
                                                </div>
                                            </div>
                                            <div className="absolute top-2.5 right-2.5">
                                                <span className="bg-[#141414]/90 backdrop-blur-sm border border-[#f23030]/40 text-[#f23030] px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                                                    <FaThumbsDown size={10} /> {denyCount}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-xs text-[#f1f1f1] mb-2 line-clamp-1 group-hover:text-[#f23030] transition-colors">
                                                {clip.title}
                                            </h3>

                                            <div className="flex justify-between text-[11px] text-[#aaaaaa] mb-2.5">
                                                <span className="font-medium truncate text-[#f1f1f1]">
                                                    {clip.streamer}
                                                </span>
                                                <span className="shrink-0 text-[#717171]">
                                                    {clip.createdAt ? new Date(clip.createdAt).toLocaleDateString() : 'Unknown date'}
                                                </span>
                                            </div>

                                            <div className="w-full bg-[#222222] rounded-full h-1.5 mt-2 overflow-hidden">
                                                <div
                                                    className="bg-[#f23030] h-full rounded-full transition-all duration-300"
                                                    style={{ width: `${Math.min(100, denyPercentage)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-[#717171] mt-1.5">
                                                <span>Denial threshold</span>
                                                <span className="font-medium text-[#aaaaaa]">
                                                    {denyCount}/{config.denyThreshold} votes
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-6 gap-1.5">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-[#262626] bg-[#141414] text-[#aaaaaa] hover:text-[#f1f1f1] hover:border-[#383838] disabled:opacity-30 disabled:hover:border-[#262626] transition-colors text-xs cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Previous page"
                            >
                                <FaChevronLeft size={10} />
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
                                        const isActive = currentPage === pageToShow;
                                        return (
                                            <button
                                                key={`page-${pageToShow}`}
                                                onClick={() => paginate(pageToShow as number)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                                    isActive
                                                        ? 'bg-[#f23030] text-white shadow-xs'
                                                        : 'bg-[#141414] border border-[#262626] text-[#aaaaaa] hover:text-[#f1f1f1] hover:border-[#383838]'
                                                }`}
                                            >
                                                {pageToShow}
                                            </button>
                                        );
                                    } else {
                                        return (
                                            <span key={`dots-${i}`} className="px-2 py-1 text-xs text-[#717171]">
                                                ...
                                            </span>
                                        );
                                    }
                                })}
                            </div>

                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border border-[#262626] bg-[#141414] text-[#aaaaaa] hover:text-[#f1f1f1] hover:border-[#383838] disabled:opacity-30 disabled:hover:border-[#262626] transition-colors text-xs cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Next page"
                            >
                                <FaChevronRight size={10} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

export default DeniedClips;