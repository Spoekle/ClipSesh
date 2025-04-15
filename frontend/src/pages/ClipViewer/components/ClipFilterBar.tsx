import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFilter, FaSort, FaSearch, FaPlus, FaTimes, 
  FaChevronDown, FaUpload, FaEye, FaEyeSlash 
} from 'react-icons/fa';
import UploadClipModal from '../../../components/admin/UploadClipModal';

const ClipFilterBar = ({ 
  sortOptionState,
  setSortOptionState,
  handleSortChange,
  filterRatedClips,
  setFilterRatedClips,
  user,
  setExpandedClip,
  isLoggedIn,
  searchTerm,
  setSearchTerm,
  filterStreamer,
  setFilterStreamer,
  streamers,
  handleFilterReset,
  fetchClipsAndRatings,
  token,
  setSearchParams
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const searchInputRef = useRef(null);
  
  // Update local search term when prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Calculate number of active filters for badge display
  useEffect(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterStreamer) count++;
    setActiveFiltersCount(count);
  }, [searchTerm, filterStreamer]);
  
  // Focus search input when filters panel opens
  useEffect(() => {
    if (showFilters && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 300);
    }
  }, [showFilters]);

  // Toggle the rated clips filter
  const toggleFilterRatedClips = () => {
    const newValue = !filterRatedClips;
    localStorage.setItem('filterRatedClips', newValue.toString());
    setFilterRatedClips(newValue);
    
    // Reset to page 1 when changing filters to prevent potential empty pages
    setSearchParams({ 
      sort: sortOptionState, 
      page: "1",
      ...(searchTerm && { q: searchTerm }),
      ...(filterStreamer && { streamer: filterStreamer }) 
    }, { replace: true });
    
    // Immediately trigger a new data fetch with the updated filter
    // We're passing user and the NEW filterRatedClips value (not the state which hasn't updated yet)
    fetchClipsAndRatings(user, newValue);
  };
  
  // Debounce search term to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm);
        
        // Update URL params
        setSearchParams({
          sort: sortOptionState,
          page: "1", // Reset to page 1 on search
          ...(localSearchTerm && { q: localSearchTerm }),
          ...(filterStreamer && { streamer: filterStreamer })
        }, { replace: true });
        
        fetchClipsAndRatings(user, filterRatedClips); // Trigger new search
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [localSearchTerm]);
  
  // Handle streamer filter change
  const handleStreamerChange = (e) => {
    const newStreamer = e.target.value;
    setFilterStreamer(newStreamer);
    
    // Update URL params
    setSearchParams({
      sort: sortOptionState,
      page: "1", // Reset to page 1 when filtering
      ...(searchTerm && { q: searchTerm }),
      ...(newStreamer && { streamer: newStreamer })
    }, { replace: true });
    
    fetchClipsAndRatings(user, filterRatedClips); // Trigger new search with updated filter
  };

  // Handle clear search field
  const handleClearSearch = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
    
    // Update URL params
    setSearchParams({
      sort: sortOptionState,
      page: "1",
      ...(filterStreamer && { streamer: filterStreamer })
    }, { replace: true });
    
    fetchClipsAndRatings(user, filterRatedClips); // Refresh without search term
  };
  
  // Handle reset all filters
  const handleResetAll = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
    setFilterStreamer('');
    
    // Reset URL params but keep sort
    setSearchParams({
      sort: sortOptionState,
      page: "1",
    }, { replace: true });
    
    fetchClipsAndRatings(user, filterRatedClips); // Refresh with clean filters
  };

  // Handle successful clip upload
  const handleUploadSuccess = () => {
    fetchClipsAndRatings(user, filterRatedClips); // Refresh clips after successful upload
  };

  const isAdmin = user?.roles?.includes('admin');
  const isTeamMember = user?.roles?.includes('admin') || user?.roles?.includes('clipteam');

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-neutral-800 rounded-xl shadow-md mb-6">
      {/* Controls panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center">
          <span>Browse Clips</span>
          {activeFiltersCount > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {activeFiltersCount}
            </motion.div>
          )}
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowControlPanel(!showControlPanel)}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-200 transition md:hidden"
          >
            <span>Controls</span>
            <FaChevronDown className={`transition ${showControlPanel ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleResetAll}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 transition ${
                activeFiltersCount > 0 
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800/30'
                  : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
              title="Reset all filters"
              disabled={activeFiltersCount === 0}
            >
              <FaTimes />
              <span>Reset</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {isTeamMember && (
              <button
                onClick={toggleFilterRatedClips}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  filterRatedClips
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
                }`}
                title={filterRatedClips ? 'Show all clips' : 'Hide rated clips'}
              >
                {filterRatedClips ? <FaEyeSlash /> : <FaEye />}
                <span>{filterRatedClips ? 'Hiding Rated' : 'Show All'}</span>
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
              }`}
              title="Filter clips"
            >
              <FaFilter />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-blue-500 text-xs px-1.5 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {/* Admin-only Upload Clip button */}
            {isLoggedIn && isAdmin && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
                title="Upload a new clip (Admin only)"
              >
                <FaUpload />
                <span>Upload Clip</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile controls that show/hide */}
      <AnimatePresence>
        {showControlPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden flex flex-wrap gap-2 px-4 pb-4 overflow-hidden"
          >
            <button
              onClick={handleResetAll}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 transition ${
                activeFiltersCount > 0 
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800/30'
                  : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
              title="Reset filters"
              disabled={activeFiltersCount === 0}
            >
              <FaTimes />
              <span>Reset</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {isTeamMember && (
              <button
                onClick={toggleFilterRatedClips}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  filterRatedClips
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
                }`}
                title={filterRatedClips ? 'Show Rated Clips' : 'Hide Rated Clips'}
              >
                {filterRatedClips ? <FaEyeSlash /> : <FaEye />}
                <span>{filterRatedClips ? 'Hiding Rated' : 'Show All'}</span>
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
              }`}
              title="Filter clips"
            >
              <FaFilter />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-blue-500 text-xs px-1.5 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {/* Admin-only Upload Clip button (mobile) */}
            {isLoggedIn && isAdmin && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
                title="Upload a new clip (Admin only)"
              >
                <FaUpload />
                <span>Upload Clip</span>
              </button>
            )}
            
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50  dark:bg-neutral-700 rounded-b-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-neutral-300">
                    Search Clips
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="block w-full pl-10 py-2.5 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-lg text-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition"
                      placeholder="Search by title or streamer..."
                      value={localSearchTerm}
                      onChange={(e) => setLocalSearchTerm(e.target.value)}
                    />
                    {localSearchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
                        aria-label="Clear search"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-neutral-300">
                    Filter by Streamer
                  </label>
                  <select
                    value={filterStreamer}
                    onChange={handleStreamerChange}
                    className="block w-full py-2.5 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-lg text-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition"
                  >
                    <option value="">Any Streamer</option>
                    {streamers.map((streamer) => (
                      <option key={streamer} value={streamer}>
                        {streamer}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-neutral-300">
                    Sort Clips
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSort className="text-gray-400" />
                    </div>
                    <select
                      value={sortOptionState}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-lg text-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highestUpvotes">Most Upvotes</option>
                      <option value="highestDownvotes">Most Downvotes</option>
                      <option value="highestRatio">Best Ratio</option>
                      <option value="lowestRatio">Worst Ratio</option>
                      {isTeamMember && (
                        <>
                          <option value="highestScore">Highest Rating</option>
                          <option value="lowestScore">Lowest Rating</option>
                        </>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
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
        token={token}
      />
    </div>
  );
};

export default ClipFilterBar;
