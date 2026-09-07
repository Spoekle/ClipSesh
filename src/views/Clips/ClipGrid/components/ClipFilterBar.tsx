import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaFilter, FaSort, FaSearch, FaTimes,
  FaChevronDown, FaUpload, FaEye, FaEyeSlash,
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
  fetchClipsAndRatings,
  setSearchParams
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterStreamer) count++;
    if (filterDeniedClips) count++;
    setActiveFiltersCount(count);
  }, [searchTerm, filterStreamer, filterDeniedClips]);

  useEffect(() => {
    if (showFilters && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 250);
    }
  }, [showFilters]);

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
    setSearchParams({
      sort: sortOptionState,
      page: "1",
    });
  };

  const handleUploadSuccess = () => {
    fetchClipsAndRatings(user);
  };

  const isAdmin = user?.roles?.includes('admin');
  const isTeamMember = user?.roles?.includes('admin') || user?.roles?.includes('clipteam');

  const [sortField, sortDirection] = sortOptionState.includes('_')
    ? sortOptionState.split('_')
    : [sortOptionState === 'oldest' ? 'createdAt' : sortOptionState, sortOptionState === 'oldest' ? 'asc' : 'desc'];

  const handleSortFieldChange = (field: string) => {
    const newSortOption = `${field}_${sortDirection}`;
    handleSortChange(newSortOption);
  };

  const handleSortDirectionChange = (direction: string) => {
    const newSortOption = `${sortField}_${direction}`;
    handleSortChange(newSortOption);
  };

  // Quick YouTube-style Category chips
  const quickSortOptions = [
    { label: 'All', value: 'newest' },
    { label: 'Most Upvoted', value: 'highestUpvotes' },
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    ...(isTeamMember ? [{ label: 'Top Rated', value: 'highestAverageRating' }] : [])
  ];

  return (
    <div className="sticky top-14 z-10 bg-[#141414]/95 backdrop-blur-md rounded-2xl border border-[#2a2a2a] mb-6 shadow-md select-none">
      {/* Top Bar: YouTube Search & Action Controls */}
      <div className="p-3.5 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Box - Pill Shape (YouTube style) */}
        <div className="relative flex-1 max-w-md">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full pl-9 pr-8 py-2 bg-[#0e0e0e] border border-[#2a2a2a] focus:border-neutral-500 rounded-full text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
            placeholder="Search clips or streamers..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs" />
          {localSearchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              title="Clear search"
            >
              <FaTimes size={11} />
            </button>
          )}
        </div>

        {/* Action Controls on the Right */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Reset Filters button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-neutral-300 bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] flex items-center gap-1.5 transition-colors shrink-0"
              title="Reset all filters"
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
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

          {/* Filter Dropdown Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-[#2a2a2a] text-white border border-neutral-500'
                : 'bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 border border-[#2e2e2e]'
            }`}
            title="Detailed filters"
          >
            <FaFilter size={10} />
            <span>Filters</span>
          </button>

          {/* Admin Upload Button */}
          {isLoggedIn && isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#f23030] hover:bg-[#d92222] transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
              title="Upload clip"
            >
              <FaUpload size={10} />
              <span>Upload</span>
            </button>
          )}
        </div>
      </div>

      {/* YouTube-Style Category Pills Row */}
      <div className="px-3.5 pb-3 sm:px-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-[#222222] pt-2.5">
        {quickSortOptions.map((opt) => {
          const isActive = sortOptionState === opt.value && !filterStreamer;
          return (
            <button
              key={opt.label}
              onClick={() => {
                handleSortChange(opt.value);
                setFilterStreamer('');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'bg-[#202020] hover:bg-[#2a2a2a] text-neutral-300 border border-[#2e2e2e]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        {/* Quick Streamer Chips if any */}
        {streamers.slice(0, 6).map((st) => {
          const isActive = filterStreamer.toLowerCase() === st.toLowerCase();
          return (
            <button
              key={st}
              onClick={() => {
                const nextStreamer = isActive ? '' : st;
                setFilterStreamer(nextStreamer);
                setSearchParams({
                  sort: sortOptionState,
                  page: "1",
                  ...(searchTerm && { q: searchTerm }),
                  ...(nextStreamer && { streamer: nextStreamer })
                });
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'bg-[#202020] hover:bg-[#2a2a2a] text-neutral-400 border border-[#2e2e2e]'
              }`}
            >
              {st}
            </button>
          );
        })}
      </div>

      {/* Expandable Advanced Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[#262626] bg-[#101010] rounded-b-2xl"
          >
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Streamer Dropdown */}
              <div>
                <label className="block mb-1.5 font-semibold text-neutral-300 uppercase tracking-wider">
                  Filter by Streamer
                </label>
                <select
                  value={filterStreamer}
                  onChange={handleStreamerChange}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-neutral-400"
                >
                  <option value="">All Streamers</option>
                  {streamers.map((s: string) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Field */}
              <div>
                <label className="block mb-1.5 font-semibold text-neutral-300 uppercase tracking-wider">
                  Sort Criteria
                </label>
                <div className="relative">
                  <select
                    value={sortField}
                    onChange={(e) => handleSortFieldChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-neutral-400"
                  >
                    <option value="createdAt">Upload Date</option>
                    <option value="upvotes">Upvotes</option>
                    <option value="downvotes">Downvotes</option>
                    <option value="ratio">Vote Ratio</option>
                    {isTeamMember && (
                      <>
                        <option value="averageRating">Average Rating</option>
                        <option value="ratingCount">Rating Count</option>
                        <option value="denyCount">Deny Count</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Sort Direction */}
              <div>
                <label className="block mb-1.5 font-semibold text-neutral-300 uppercase tracking-wider">
                  Sort Direction
                </label>
                <div className="flex border border-[#2a2a2a] rounded-xl overflow-hidden p-0.5 bg-[#181818] w-fit">
                  <button
                    onClick={() => handleSortDirectionChange('desc')}
                    className={`px-3 py-1.5 flex items-center gap-1.5 rounded-lg font-medium transition-all ${
                      sortDirection === 'desc'
                        ? 'bg-[#2a2a2a] text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <FaArrowDown size={10} />
                    <span>Descending</span>
                  </button>
                  <button
                    onClick={() => handleSortDirectionChange('asc')}
                    className={`px-3 py-1.5 flex items-center gap-1.5 rounded-lg font-medium transition-all ${
                      sortDirection === 'asc'
                        ? 'bg-[#2a2a2a] text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <FaArrowUp size={10} />
                    <span>Ascending</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
