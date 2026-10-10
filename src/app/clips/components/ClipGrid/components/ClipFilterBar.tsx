'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaUpload,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';
import UploadClipModal from './UploadClipModal';
import { SortControls } from './filter/SortControls';
import { safeLocalStorage } from '@/utils/storage';
import { User } from '@/types/adminTypes';
import { Button } from '@/components/common/Button';

interface ClipFilterBarProps {
  sortOptionState: string;
  setSortOptionState: (option: string) => void;
  handleSortChange: (option: string) => void;
  filterRatedClips: boolean;
  setFilterRatedClips: (filter: boolean) => void;
  filterDeniedClips: boolean;
  setFilterDeniedClips: (filter: boolean) => void;
  user: User | null;
  setExpandedClip: (clip: string | null) => void;
  isLoggedIn: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStreamer: string;
  setFilterStreamer: (streamer: string) => void;
  streamers: string[];
  handleFilterReset: () => void;
  fetchClipsAndRatings: (user: User | null) => Promise<void>;
  setSearchParams: (params: URLSearchParams, options?: { replace?: boolean }) => void;
}

export const ClipFilterBar: React.FC<ClipFilterBarProps> = ({
  sortOptionState,
  handleSortChange,
  filterRatedClips,
  setFilterRatedClips,
  filterDeniedClips,
  setFilterDeniedClips,
  user,
  isLoggedIn,
  searchTerm,
  setSearchTerm,
  filterStreamer,
  setFilterStreamer,
  streamers,
  handleFilterReset,
  fetchClipsAndRatings,
  setSearchParams,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.roles?.includes('admin');
  const isTeamMember = user?.roles?.includes('admin') || user?.roles?.includes('clipteam');

  const updateUrlParams = (record: Record<string, string>) => {
    const urlParams = new URLSearchParams();
    Object.entries(record).forEach(([k, v]) => {
      if (v) urlParams.set(k, v);
    });
    setSearchParams(urlParams);
  };

  // Parse sortField and sortDirection from sortOptionState
  const [sortField, sortDirection] = useMemo(() => {
    if (sortOptionState.includes('_')) {
      const [field, direction] = sortOptionState.split('_');
      return [field || 'createdAt', direction || 'desc'];
    }
    switch (sortOptionState) {
      case 'oldest':
        return ['createdAt', 'asc'];
      case 'newest':
        return ['createdAt', 'desc'];
      case 'mostViewed':
        return ['views', 'desc'];
      case 'highestUpvotes':
        return ['upvotes', 'desc'];
      case 'highestDownvotes':
        return ['downvotes', 'desc'];
      case 'highestRatio':
        return ['ratio', 'desc'];
      case 'lowestRatio':
        return ['ratio', 'asc'];
      case 'highestAverageRating':
        return ['averageRating', 'desc'];
      case 'mostRated':
        return ['ratingCount', 'desc'];
      case 'mostDenied':
        return ['denyCount', 'desc'];
      default:
        return ['createdAt', 'desc'];
    }
  }, [sortOptionState]);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterStreamer) count++;
    if (filterDeniedClips) count++;
    if (filterRatedClips) count++;
    if (sortField !== 'createdAt' || sortDirection !== 'desc') count++;
    setActiveFiltersCount(count);
  }, [searchTerm, filterStreamer, filterDeniedClips, filterRatedClips, sortField, sortDirection]);

  const toggleFilterRatedClips = () => {
    const newValue = !filterRatedClips;
    safeLocalStorage.setItem('filterRatedClips', newValue.toString());
    setFilterRatedClips(newValue);
    updateUrlParams({
      sort: sortOptionState,
      page: '1',
      ...(searchTerm && { q: searchTerm }),
      ...(filterStreamer && { streamer: filterStreamer }),
    });
  };

  const toggleFilterDeniedClips = () => {
    const newValue = !filterDeniedClips;
    safeLocalStorage.setItem('filterDeniedClips', newValue.toString());
    setFilterDeniedClips(newValue);
    updateUrlParams({
      sort: sortOptionState,
      page: '1',
      ...(searchTerm && { q: searchTerm }),
      ...(filterStreamer && { streamer: filterStreamer }),
    });
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm);
        updateUrlParams({
          sort: sortOptionState,
          page: '1',
          ...(localSearchTerm && { q: localSearchTerm }),
          ...(filterStreamer && { streamer: filterStreamer }),
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearchTerm, searchTerm, setSearchTerm, sortOptionState, filterStreamer]);

  const handleStreamerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStreamer = e.target.value;
    setFilterStreamer(newStreamer);
    updateUrlParams({
      sort: sortOptionState,
      page: '1',
      ...(searchTerm && { q: searchTerm }),
      ...(newStreamer && { streamer: newStreamer }),
    });
  };

  const handleSortFieldChange = (newField: string) => {
    handleSortChange(`${newField}_${sortDirection}`);
  };

  const handleSortDirectionChange = (newDirection: string) => {
    handleSortChange(`${sortField}_${newDirection}`);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
    updateUrlParams({
      sort: sortOptionState,
      page: '1',
      ...(filterStreamer && { streamer: filterStreamer }),
    });
  };

  const handleResetAll = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
    setFilterStreamer('');
    setFilterDeniedClips(false);
    setFilterRatedClips(false);
    handleSortChange('createdAt_desc');
    handleFilterReset();
  };

  const handleUploadSuccess = () => {
    fetchClipsAndRatings(user);
  };

  return (
    <div className="sticky top-14 z-10 bg-cc-card/95 backdrop-blur-md rounded-2xl border border-border mb-6 p-3 sm:p-3.5 shadow-md select-none">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Main Controls: Search, Streamer filter, Sort criteria, Sort direction */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-sm">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full pl-9 pr-8 py-2 bg-cc-ground border border-border focus:border-border/80 rounded-xl text-xs sm:text-sm text-white placeholder-muted-foreground/60 focus:outline-none transition-colors"
              placeholder="Search clips or streamers..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
            {localSearchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                title="Clear search"
              >
                <FaTimes size={11} />
              </button>
            )}
          </div>

          {/* Streamer Dropdown */}
          <div className="relative">
            <select
              value={filterStreamer}
              onChange={handleStreamerChange}
              className="appearance-none pl-3 pr-8 py-2 bg-cc-ground hover:bg-white/5 border border-border focus:border-border/80 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none cursor-pointer transition-colors"
              aria-label="Filter by Streamer"
            >
              <option value="">All Streamers</option>
              {streamers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[10px]" />
          </div>

          {/* Sort Controls */}
          <SortControls
            sortField={sortField}
            sortDirection={sortDirection}
            isTeamMember={Boolean(isTeamMember)}
            onSortFieldChange={handleSortFieldChange}
            onSortDirectionChange={handleSortDirectionChange}
          />
        </div>

        {/* Action Controls: Reset, Reviewer Toggles, Admin Upload */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pt-1 lg:pt-0">
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-foreground bg-white/5 hover:bg-white/10 border border-border flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              title="Reset all filters and sort"
            >
              <FaTimes size={10} />
              <span>Reset ({activeFiltersCount})</span>
            </button>
          )}

          {isTeamMember && (
            <>
              <button
                type="button"
                onClick={toggleFilterRatedClips}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  filterRatedClips
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-cc-ground hover:bg-white/5 text-muted-foreground hover:text-white border border-border'
                }`}
                title={filterRatedClips ? 'Showing all clips' : 'Hiding rated clips'}
              >
                {filterRatedClips ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
                <span>{filterRatedClips ? 'Hiding Rated' : 'Hide Rated'}</span>
              </button>

              <button
                type="button"
                onClick={toggleFilterDeniedClips}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  filterDeniedClips
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'bg-cc-ground hover:bg-white/5 text-muted-foreground hover:text-white border border-border'
                }`}
                title={filterDeniedClips ? 'Showing all clips' : 'Hiding denied clips'}
              >
                {filterDeniedClips ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
                <span>{filterDeniedClips ? 'Hiding Denied' : 'Hide Denied'}</span>
              </button>
            </>
          )}

          {isLoggedIn && isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              leftIcon={<FaUpload size={10} />}
              title="Upload clip"
            >
              Upload
            </Button>
          )}
        </div>
      </div>

      {/* Admin Upload Clip Modal */}
      <UploadClipModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default ClipFilterBar;
