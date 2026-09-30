'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaThumbsDown,
  FaBan,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaSearch,
  FaExternalLinkAlt,
  FaUser,
} from 'react-icons/fa';
import { Clip, Rating } from '@/types/adminTypes';

type SortBy = 'newest' | 'oldest' | 'mostDenied';

interface DeniedClipsProps {
  clips: Clip[];
  ratings: Record<string, Rating>;
  config: {
    denyThreshold: number;
  };
  location?: any;
}

export const DeniedClips: React.FC<DeniedClipsProps> = ({ clips, ratings, config }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const clipsPerPage = 9;

  // Filter clips exceeding or reaching denyThreshold
  const filteredClips = useMemo(() => {
    return clips.filter((clip) => {
      const ratingData = ratings[clip._id];
      if (!ratingData || !ratingData.ratings) return false;

      const denyRatings = ratingData.ratings.deny;
      const exceedsThreshold =
        denyRatings && Array.isArray(denyRatings) && denyRatings.length >= config.denyThreshold;

      if (!exceedsThreshold) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = clip.title?.toLowerCase().includes(query);
        const matchesStreamer = clip.streamer?.toLowerCase().includes(query);
        return matchesTitle || matchesStreamer;
      }

      return true;
    });
  }, [clips, ratings, config.denyThreshold, searchQuery]);

  const sortedClips = useMemo(() => {
    return [...filteredClips].sort((a, b) => {
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
  }, [filteredClips, sortBy, ratings]);

  const totalPages = Math.ceil(sortedClips.length / clipsPerPage);
  const indexOfLastClip = currentPage * clipsPerPage;
  const indexOfFirstClip = indexOfLastClip - clipsPerPage;
  const currentClips = sortedClips.slice(indexOfFirstClip, indexOfLastClip);

  const paginate = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="w-full bg-[#181818] border border-[#262626] rounded-2xl p-5 sm:p-6 text-[#f1f1f1] shadow-sm space-y-6"
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2.5 text-white">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <FaBan size={14} />
            </div>
            <span>Denied Submissions</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#222222] text-[#aaaaaa] border border-[#333333] font-mono">
              {filteredClips.length}
            </span>
          </h2>
          <p className="text-xs text-[#aaaaaa] mt-1">
            Clips that have met or exceeded the community rejection threshold ({config.denyThreshold} denial votes) and are excluded from season compilation.
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search title or streamer..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#121212] border border-[#262626] text-white text-xs pl-8 pr-3 py-1.5 rounded-xl outline-none focus:border-[#444] transition-colors placeholder:text-[#666]"
            />
            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717171]" size={11} />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#717171] font-medium hidden sm:inline">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortBy);
                  setCurrentPage(1);
                }}
                className="bg-[#121212] border border-[#262626] text-[#f1f1f1] text-xs font-medium py-1.5 pl-3 pr-7 rounded-xl appearance-none cursor-pointer focus:border-[#444] focus:outline-none transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostDenied">Most Denied</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <FaFilter className="text-[#717171]" size={9} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clip Grid / Empty State */}
      {!filteredClips.length ? (
        <div className="p-12 bg-[#141414] rounded-xl text-center flex flex-col items-center justify-center border border-[#262626]">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <FaExclamationTriangle size={20} />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {searchQuery ? 'No matching denied clips' : 'No Denied Clips'}
          </h3>
          <p className="text-[#aaaaaa] text-xs max-w-sm">
            {searchQuery
              ? `No rejected clips matching "${searchQuery}" were found.`
              : `There are currently no clips that exceed the denial threshold of ${config.denyThreshold} votes.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentClips.map((clip) => {
              const ratingData = ratings[clip._id];
              const denyCount = ratingData?.ratings?.deny?.length || 0;
              const denyPercentage = Math.round((denyCount / (config.denyThreshold * 1.5)) * 100);

              return (
                <div
                  key={clip._id}
                  className="bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#383838] rounded-xl overflow-hidden flex flex-col transition-all group shadow-xs"
                >
                  <Link
                    href={`/clips/${clip._id}`}
                    className="relative aspect-video bg-[#0f0f0f] overflow-hidden block"
                  >
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

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                    {/* Hover Inspect Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-10 h-10 rounded-full bg-[#181818]/90 border border-[#383838] flex items-center justify-center text-white shadow-lg">
                        <FaExternalLinkAlt size={12} />
                      </div>
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                      <span className="bg-black/80 backdrop-blur-md border border-[#333] text-white/90 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1">
                        <FaUser size={9} className="text-[#888]" />
                        <span>{clip.streamer}</span>
                      </span>

                      <span className="bg-black/80 backdrop-blur-md border border-rose-500/40 text-rose-400 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-sm font-mono">
                        <FaThumbsDown size={10} />
                        <span>{denyCount} rejected</span>
                      </span>
                    </div>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/clips/${clip._id}`}
                        className="font-semibold text-xs text-white mb-2 line-clamp-1 group-hover:text-[#f23030] transition-colors block"
                        title={clip.title}
                      >
                        {clip.title}
                      </Link>

                      <div className="flex justify-between text-[11px] text-[#888888] mb-2 font-mono">
                        <span>Season: {clip.season || 'N/A'} {clip.year || ''}</span>
                        <span>{clip.createdAt ? new Date(clip.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>

                    {/* Rejection progress meter */}
                    <div className="pt-2 border-t border-[#202020] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-[#717171] font-mono">
                        <span>Rejection Threshold</span>
                        <span className="text-rose-400 font-semibold font-mono">
                          {denyCount} / {config.denyThreshold} votes
                        </span>
                      </div>

                      <div className="w-full bg-[#202020] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-rose-500 to-[#f23030] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, denyPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center pt-4 gap-1.5">
              <button
                type="button"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-[#262626] bg-[#141414] text-[#aaaaaa] hover:text-white hover:border-[#383838] disabled:opacity-30 transition-colors text-xs cursor-pointer disabled:cursor-not-allowed"
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
                        type="button"
                        onClick={() => paginate(pageToShow as number)}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#f23030] text-white shadow-xs'
                            : 'bg-[#141414] border border-[#262626] text-[#aaaaaa] hover:text-white hover:border-[#383838]'
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
                type="button"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-[#262626] bg-[#141414] text-[#aaaaaa] hover:text-white hover:border-[#383838] disabled:opacity-30 transition-colors text-xs cursor-pointer disabled:cursor-not-allowed"
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