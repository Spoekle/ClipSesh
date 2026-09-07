'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaSearch, FaTimes, FaFilter, FaSortAmountDown } from 'react-icons/fa';

type SortOption = 'newest' | 'oldest' | 'upvotes' | 'downvotes' | 'ratio';
type SearchType = 'all' | 'clips' | 'profiles';

interface SearchFilterBarProps {
  // Search
  searchInput: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;

  // Search type
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;

  // Filters
  filterOpen: boolean;
  onFilterToggle: () => void;
  streamerFilter: string;
  submitterFilter: string;
  seasonFilter: string;
  yearFilter: string;
  onStreamerChange: (value: string) => void;
  onSubmitterChange: (value: string) => void;
  onSeasonChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;

  // Sort
  sortOption: SortOption;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

  // Data
  streamers: string[];
  submitters: string[];

  // Results
  searchTerm: string;
  totalResults: number;
  loading: boolean;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchInput,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  searchType,
  onSearchTypeChange,
  filterOpen,
  onFilterToggle,
  streamerFilter,
  submitterFilter,
  seasonFilter,
  yearFilter,
  onStreamerChange,
  onSubmitterChange,
  onSeasonChange,
  onYearChange,
  onResetFilters,
  onApplyFilters,
  sortOption,
  onSortChange,
  streamers,
  submitters,
  searchTerm,
  totalResults,
  loading,
}) => {
  const activeFiltersCount =
    (streamerFilter ? 1 : 0) +
    (submitterFilter ? 1 : 0) +
    (seasonFilter ? 1 : 0) +
    (yearFilter ? 1 : 0);

  return (
    <div className="mb-6 space-y-3">
      {/* Top Search & Filter Bar */}
      <div className="bg-[#181818] rounded-xl shadow-sm border border-[#262626] p-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* YouTube-style Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
            className="flex-1 max-w-2xl relative"
          >
            <button
              type="submit"
              aria-label="Submit search"
              className="absolute top-1/2 left-3.5 transform -translate-y-1/2 text-[#717171] hover:text-[#f1f1f1] transition-colors p-1"
            >
              <FaSearch size={14} />
            </button>
            <input
              type="text"
              value={searchInput}
              onChange={onSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearchSubmit();
                }
              }}
              placeholder="Search clips, streamers, titles, or profiles..."
              className="w-full pl-10 pr-9 py-2 rounded-full text-sm bg-[#121212] border border-[#2a2a2a] text-[#f1f1f1] placeholder-[#717171] focus:outline-none focus:border-[#444444] transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Clear search"
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-[#717171] hover:text-[#f1f1f1] transition-colors p-1"
              >
                <FaTimes size={13} />
              </button>
            )}
          </form>

          {/* Right Action Pills */}
          <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
            {/* YouTube Category Chips */}
            <div className="inline-flex p-1 bg-[#121212] rounded-full border border-[#2a2a2a]">
              {(['all', 'clips', 'profiles'] as const).map((type) => {
                const isActive = searchType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onSearchTypeChange(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 capitalize ${
                      isActive
                        ? 'bg-[#f1f1f1] text-[#0f0f0f] font-semibold shadow-xs'
                        : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {/* Filter Drawer Toggle */}
            {searchType !== 'profiles' && (
              <button
                type="button"
                onClick={onFilterToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                  filterOpen || activeFiltersCount > 0
                    ? 'bg-[#f23030]/15 text-[#f23030] border-[#f23030]/30 shadow-xs'
                    : 'bg-[#121212] text-[#aaaaaa] hover:text-white border-[#2a2a2a] hover:border-[#383838]'
                }`}
              >
                <FaFilter size={10} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#f23030] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}

            {/* Sort Dropdown */}
            {searchType !== 'profiles' && (
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={onSortChange}
                  className="bg-[#121212] hover:bg-[#1a1a1a] text-[#aaaaaa] hover:text-[#f1f1f1] border border-[#2a2a2a] hover:border-[#383838] py-1.5 pl-3 pr-7 rounded-full text-xs font-medium cursor-pointer appearance-none transition-colors focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="upvotes">Most Upvotes</option>
                  <option value="downvotes">Most Downvotes</option>
                  <option value="ratio">Best Ratio</option>
                </select>
                <FaSortAmountDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#717171]" size={10} />
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {searchTerm && !loading && (
          <div className="mt-2.5 pt-2.5 border-t border-[#262626] text-xs text-[#aaaaaa] flex items-center gap-1.5">
            <span>
              Found <strong className="text-[#f1f1f1]">{totalResults}</strong> result{totalResults !== 1 ? 's' : ''} for "
              <span className="font-semibold text-[#f1f1f1]">{searchTerm}</span>"
            </span>
            {activeFiltersCount > 0 && (
              <span className="text-[#717171]">({activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''})</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-[#181818] rounded-xl border border-[#262626] p-4 sm:p-5 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#f1f1f1]">
                  Filter Search Results
                </h3>
                <button
                  type="button"
                  onClick={onFilterToggle}
                  aria-label="Close filters"
                  className="p-1 text-[#717171] hover:text-[#f1f1f1] rounded-md transition-colors"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Streamer Filter */}
                <div>
                  <label className="block text-xs font-medium text-[#aaaaaa] mb-1.5">
                    Streamer
                  </label>
                  <select
                    value={streamerFilter}
                    onChange={(e) => onStreamerChange(e.target.value)}
                    className="w-full p-2 rounded-lg text-xs bg-[#121212] border border-[#2a2a2a] text-[#f1f1f1] focus:outline-none focus:border-[#444444]"
                  >
                    <option value="">All Streamers</option>
                    {streamers.map((streamer) => (
                      <option key={streamer} value={streamer}>{streamer}</option>
                    ))}
                  </select>
                </div>

                {/* Submitter Filter */}
                <div>
                  <label className="block text-xs font-medium text-[#aaaaaa] mb-1.5">
                    Submitter
                  </label>
                  <select
                    value={submitterFilter}
                    onChange={(e) => onSubmitterChange(e.target.value)}
                    className="w-full p-2 rounded-lg text-xs bg-[#121212] border border-[#2a2a2a] text-[#f1f1f1] focus:outline-none focus:border-[#444444]"
                  >
                    <option value="">All Submitters</option>
                    {submitters.map((submitter) => (
                      <option key={submitter} value={submitter}>{submitter}</option>
                    ))}
                  </select>
                </div>

                {/* Season Filter */}
                <div>
                  <label className="block text-xs font-medium text-[#aaaaaa] mb-1.5">
                    Season
                  </label>
                  <select
                    value={seasonFilter}
                    onChange={(e) => onSeasonChange(e.target.value)}
                    className="w-full p-2 rounded-lg text-xs bg-[#121212] border border-[#2a2a2a] text-[#f1f1f1] focus:outline-none focus:border-[#444444]"
                  >
                    <option value="">All Seasons</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-xs font-medium text-[#aaaaaa] mb-1.5">
                    Year
                  </label>
                  <select
                    value={yearFilter}
                    onChange={(e) => onYearChange(e.target.value)}
                    className="w-full p-2 rounded-lg text-xs bg-[#121212] border border-[#2a2a2a] text-[#f1f1f1] focus:outline-none focus:border-[#444444]"
                  >
                    <option value="">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2.5 pt-3.5 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#222222] hover:bg-[#2c2c2c] text-[#aaaaaa] hover:text-white transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onApplyFilters}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#f23030] hover:bg-[#d92222] text-white transition-colors shadow-xs"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchFilterBar;
