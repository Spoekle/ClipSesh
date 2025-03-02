import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaSort, FaSearch, FaPlus, FaTimes, FaChevronDown } from 'react-icons/fa';

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
  fetchClipsAndRatings
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);

  const toggleFilterRatedClips = () => {
    const newValue = !filterRatedClips;
    setFilterRatedClips(newValue);
    localStorage.setItem('filterRatedClips', newValue);
    fetchClipsAndRatings(user, newValue);
  };

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-neutral-800 rounded-xl shadow-md mb-6 py-4 px-6">
      {/* Controls panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Browse Clips
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
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-200 transition"
            >
              <FaFilter />
              <span>Filter</span>
            </button>
            
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center rounded-lg overflow-hidden">
                  <select
                    value={sortOptionState}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none bg-neutral-100 dark:bg-neutral-700 pl-10 pr-10 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highestUpvotes">Most Upvoted</option>
                    <option value="highestDownvotes">Most Downvoted</option>
                    <option value="highestRatio">Best Ratio</option>
                    <option value="lowestRatio">Worst Ratio</option>
                    {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                      <>
                        <option value="highestScore">Highest Rated</option>
                        <option value="lowestScore">Lowest Rated</option>
                      </>
                    )}
                  </select>
                  <FaSort className="absolute left-3 text-neutral-500 dark:text-neutral-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile controls panel */}
      <AnimatePresence>
        {showControlPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 mt-4 mb-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-200 transition"
              >
                <FaFilter />
                <span>Filter</span>
              </button>
              
              <div className="relative flex items-center rounded-lg overflow-hidden">
                <select
                  value={sortOptionState}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none w-full bg-neutral-100 dark:bg-neutral-700 pl-10 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highestUpvotes">Most Upvoted</option>
                  <option value="highestDownvotes">Most Downvoted</option>
                  <option value="highestRatio">Best Ratio</option>
                  <option value="lowestRatio">Worst Ratio</option>
                  {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                    <>
                      <option value="highestScore">Highest Rated</option>
                      <option value="lowestScore">Lowest Rated</option>
                    </>
                  )}
                </select>
                <FaSort className="absolute left-3 text-neutral-500 dark:text-neutral-400" />
              </div>
              
              {isLoggedIn && (
                <button
                  onClick={() => setExpandedClip("new")}
                  className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <FaPlus />
                  <span>Add Clip</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-200 dark:border-neutral-700 mt-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or streamer..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-white"
                  />
                </div>
                
                <div className="relative">
                  <select
                    value={filterStreamer}
                    onChange={(e) => setFilterStreamer(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-white"
                  >
                    <option value="">All Streamers</option>
                    {streamers.map((streamer) => (
                      <option key={streamer} value={streamer}>
                        {streamer}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaChevronDown className="text-gray-400" />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFilterReset}
                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded-lg text-neutral-800 dark:text-white transition flex items-center gap-2"
                  >
                    <FaTimes />
                    Clear Filters
                  </button>
                  
                  {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                    <button
                      onClick={toggleFilterRatedClips}
                      className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                        filterRatedClips
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-white'
                      }`}
                    >
                      {filterRatedClips ? 'Show Rated' : 'Hide Rated'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClipFilterBar;
