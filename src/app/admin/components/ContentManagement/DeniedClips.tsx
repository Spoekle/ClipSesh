'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Ban,
  AlertTriangle,
  Filter,
  Search,
} from 'lucide-react';
import { Clip, Rating } from '@/types/adminTypes';
import { DeniedClipCard } from './denied/DeniedClipCard';
import { DeniedClipPagination } from './denied/DeniedClipPagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type SortBy = 'newest' | 'oldest' | 'mostDenied';

interface DeniedClipsProps {
  clips: Clip[];
  ratings: Record<string, Rating>;
  config: {
    denyThreshold: number;
  };
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
        const aCount = ratings[a._id]?.ratings?.deny?.length || 0;
        const bCount = ratings[b._id]?.ratings?.deny?.length || 0;
        return bCount - aCount;
      }
      return 0;
    });
  }, [filteredClips, ratings, sortBy]);

  const totalPages = Math.ceil(sortedClips.length / clipsPerPage);
  const paginatedClips = useMemo(() => {
    const startIndex = (currentPage - 1) * clipsPerPage;
    return sortedClips.slice(startIndex, startIndex + clipsPerPage);
  }, [sortedClips, currentPage, clipsPerPage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2.5 text-foreground">
            <div className="w-8 h-8 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center">
              <Ban className="size-4" />
            </div>
            <span>Denied Submissions</span>
            <Badge variant="outline" className="text-xs font-semibold font-mono">
              {filteredClips.length}
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
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
              className="w-full bg-background border border-border text-foreground text-xs pl-8 pr-3 py-1.5 rounded-xl outline-none focus:border-border/80 transition-colors placeholder:text-muted-foreground/60"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortBy);
                  setCurrentPage(1);
                }}
                className="bg-background border border-border text-foreground text-xs font-medium py-1.5 pl-3 pr-7 rounded-xl appearance-none cursor-pointer focus:border-border/80 focus:outline-none transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostDenied">Most Denied</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <Filter className="text-muted-foreground size-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clip Grid / Empty State */}
      {filteredClips.length === 0 ? (
        <Card className="p-12 bg-card rounded-xl text-center flex flex-col items-center justify-center border-border">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <AlertTriangle className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">
            {searchQuery ? 'No matching denied clips' : 'No Denied Clips'}
          </h3>
          <p className="text-muted-foreground text-xs max-w-sm">
            {searchQuery
              ? `No rejected clips matching "${searchQuery}" were found.`
              : 'There are currently no clips marked as denied. Clips reach this list when review members cast denial votes reaching the configured threshold.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedClips.map((clip) => (
              <DeniedClipCard
                key={clip._id}
                clip={clip}
                ratingData={ratings[clip._id]}
                denyThreshold={config.denyThreshold}
              />
            ))}
          </div>

          <DeniedClipPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </motion.div>
  );
};

export default DeniedClips;