import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaSearch, FaTimes, FaChevronDown,
  FaUpload, FaEye, FaEyeSlash,
  FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import UploadClipModal from './UploadClipModal';
import { User } from '../../../../types/adminTypes';

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
  setSearchParams: (params: any) => void;
}

const ClipFilterBar: React.FC<ClipFilterBarProps> = ({
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
  setSearchParams
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.roles?.includes('admin');
  const isTeamMember = user?.roles?.includes('admin') || user?.roles?.includes('clipteam');

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
    setSearchParams({
      sort: sortOptionState,
      page: "1",
      ...(searchTerm && { q: searchTerm }),
      ...(filterStreamer && { streamer: filterStreamer })
    });
  };

  const toggleFilterDeniedClips = () => {
    const newValue = !filterDeniedClips;
    safeLocalStorage.setItem('filterDeniedClips', newValue.toString());
    setFilterDeniedClips(newValue);
    setSearchParams({
      sort: sortOptionState,
      page: "1",
      ...(searchTerm && { q: searchTerm }),
      ...(filterStreamer && { streamer: filterStreamer })
    });
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm);
        setSearchParams({
          sort: sortOptionState,
          page: "1",
          ...(localSearchTerm && { q: localSearchTerm }),
          ...(filterStreamer && { streamer: filterStreamer })
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearchTerm, searchTerm, setSearchTerm, setSearchParams, sortOptionState, filterStreamer]);

  const handleStreamerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStreamer = e.target.value;
    setFilterStreamer(newStreamer);
    setSearchParams({
      sort: sortOptionState,
      page: "1",
      ...(searchTerm && { q: searchTerm }),
      ...(newStreamer && { streamer: newStreamer })
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
    setSearchParams({
      sort: sortOptionState,
      page: "1",
      ...(filterStreamer && { streamer: filterStreamer })
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
    <div className="sticky top-14 z-10 bg-[#141414]/95 backdrop-blur-md rounded-2xl border border-[#262626] mb-6 p-3 sm:p-3.5 shadow-md select-none">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Main Controls: Search, Streamer filter, Sort criteria, Sort direction */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-sm">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full pl-9 pr-8 py-2 bg-[#0e0e0e] border border-[#2a2a2a] focus:border-neutral-500 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
              placeholder="Search clips or streamers..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs" />
            {localSearchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
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
              className="appearance-none pl-3 pr-8 py-2 bg-[#0e0e0e] hover:bg-[#181818] border border-[#2a2a2a] focus:border-neutral-500 rounded-xl text-xs sm:text-sm text-neutral-200 focus:outline-none cursor-pointer transition-colors"
              aria-label="Filter by Streamer"
            >
              <option value="">All Streamers</option>
              {streamers.map((s: string) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-[10px]" />
          </div>

          {/* Sort Criteria Dropdown */}
          <div className="relative">
            <select
              value={sortField}
              onChange={(e) => handleSortFieldChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-[#0e0e0e] hover:bg-[#181818] border border-[#2a2a2a] focus:border-neutral-500 rounded-xl text-xs sm:text-sm text-neutral-200 focus:outline-none cursor-pointer transition-colors"
              aria-label="Sort criteria"
            >
              <option value="createdAt">Upload Date</option>
              <option value="views">Views</option>
              <option value="upvotes">Upvotes</option>
              <option value="downvotes">Downvotes</option>
              {isTeamMember && (
                <>
                  <option value="averageRating">Average Rating</option>
                  <option value="ratingCount">Rating Count</option>
                  <option value="denyCount">Deny Count</option>
                </>
              )}
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-[10px]" />
          </div>

          {/* Sort Direction Toggle Button Group */}
          <div className="flex items-center border border-[#2a2a2a] rounded-xl p-0.5 bg-[#0e0e0e] shrink-0" role="group" aria-label="Sort direction">
            <button
              type="button"
              onClick={() => handleSortDirectionChange('desc')}
              className={`px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all ${
                sortDirection === 'desc'
                  ? 'bg-[#262626] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Sort Descending (Highest/Newest first)"
            >
              <FaArrowDown size={10} />
              <span>Desc</span>
            </button>
            <button
              type="button"
              onClick={() => handleSortDirectionChange('asc')}
              className={`px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all ${
                sortDirection === 'asc'
                  ? 'bg-[#262626] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Sort Ascending (Lowest/Oldest first)"
            >
              <FaArrowUp size={10} />
              <span>Asc</span>
            </button>
          </div>
        </div>

        {/* Action Controls: Reset, Reviewer Toggles, Admin Upload */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pt-1 lg:pt-0">
          {/* Reset Filters button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-300 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333333] flex items-center gap-1.5 transition-colors shrink-0"
              title="Reset all filters and sort"
            >
              <FaTimes size={10} />
              <span>Reset ({activeFiltersCount})</span>
            </button>
          )}

          {/* Team Member Toggles */}
          {isTeamMember && (
            <>
              <button
                onClick={toggleFilterRatedClips}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
                  filterRatedClips
                    ? 'bg-[#f23030] text-white shadow-xs'
                    : 'bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 border border-[#2e2e2e]'
                }`}
                title={filterRatedClips ? 'Showing all clips' : 'Hiding rated clips'}
              >
                {filterRatedClips ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
                <span>{filterRatedClips ? 'Hiding Rated' : 'Hide Rated'}</span>
              </button>

              <button
                onClick={toggleFilterDeniedClips}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
                  filterDeniedClips
                    ? 'bg-neutral-200 text-neutral-900 font-semibold shadow-xs'
                    : 'bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 border border-[#2e2e2e]'
                }`}
                title={filterDeniedClips ? 'Showing all clips' : 'Hiding denied clips'}
              >
                {filterDeniedClips ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
                <span>{filterDeniedClips ? 'Hiding Denied' : 'Hide Denied'}</span>
              </button>
            </>
          )}

          {/* Admin Upload Button */}
          {isLoggedIn && isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#f23030] hover:bg-[#d92222] transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
              title="Upload clip"
            >
              <FaUpload size={10} />
              <span>Upload</span>
            </button>
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
