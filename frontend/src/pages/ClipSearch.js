import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaArrowUp, FaArrowDown, FaFilter, 
  FaTimes, FaPlay, FaCalendarAlt, FaSortAmountDown,
  FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight
} from 'react-icons/fa';
import { format } from 'timeago.js';
import axios from 'axios';
import debounce from 'lodash.debounce';
import LoadingBar from 'react-top-loading-bar';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ClipSearch = () => {
  const query = useQuery();
  const searchTerm = query.get('query') || '';
  const pageParam = parseInt(query.get('page')) || 1;
  const streamerFilterParam = query.get('streamer') || '';
  const submitterFilterParam = query.get('submitter') || '';
  const sortOptionParam = query.get('sort') || 'newest';
  
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalClips, setTotalClips] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(pageParam);
  
  const [streamerFilter, setStreamerFilter] = useState(streamerFilterParam);
  const [submitterFilter, setSubmitterFilter] = useState(submitterFilterParam);
  const [sortOption, setSortOption] = useState(sortOptionParam);
  
  const [progress, setProgress] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [streamers, setStreamers] = useState([]);
  const [submitters, setSubmitters] = useState([]);
  const [isHoveringVideo, setIsHoveringVideo] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch unique streamers and submitters for filters
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/clips/filter-options`);
      if (response.data) {
        setStreamers(response.data.streamers || []);
        setSubmitters(response.data.submitters || []);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  // Main fetch function for clips
  const fetchClips = useCallback(async () => {
    if (!searchTerm.trim()) {
      setClips([]);
      setLoading(false);
      setTotalClips(0);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setProgress(30);
      
      const params = {
        q: searchTerm,
        page: currentPage,
        streamer: streamerFilter,
        submitter: submitterFilter,
        sort: sortOption,
        limit: 12 // Consistent page size
      };

      const response = await axios.get(`${apiUrl}/api/clips/search`, { params });
      setProgress(70);
      
      setClips(response.data.clips || []);
      // Make sure we get the total count from the API response
      setTotalClips(response.data.totalResults || response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
      
      if (!streamers.length || !submitters.length) {
        fetchFilterOptions();
      }
      
      setProgress(100);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching clips.');
      setProgress(100);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, streamerFilter, submitterFilter, sortOption, fetchFilterOptions, streamers.length, submitters.length]);

  // Initial load and parameter changes
  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('query', searchTerm);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (streamerFilter) params.set('streamer', streamerFilter);
    if (submitterFilter) params.set('submitter', submitterFilter);
    if (sortOption !== 'newest') params.set('sort', sortOption);
    
    navigate(`/search?${params.toString()}`, { replace: true });
  }, [searchTerm, currentPage, streamerFilter, submitterFilter, sortOption, navigate]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((term) => {
      const params = new URLSearchParams(location.search);
      params.set('query', term);
      params.delete('page'); // Reset to page 1 on new search
      navigate(`/search?${params.toString()}`);
    }, 500),
    [location.search, navigate]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // Reset filters
  const resetFilters = () => {
    setStreamerFilter('');
    setSubmitterFilter('');
    setSortOption('newest');
  };

  // Handle filter changes
  const applyFilters = () => {
    setCurrentPage(1); // Reset to page 1 when filters change
    setFilterOpen(false);
  };

  // Generate title highlighting for search matches
  const highlightSearchTerm = (text) => {
    if (!searchTerm || !text) return text;
    
    try {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, i) => 
        regex.test(part) ? <mark key={i} className="bg-yellow-300 dark:bg-yellow-700 px-0.5 rounded-sm">{part}</mark> : part
      );
    } catch (e) {
      return text; // In case of invalid regex
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full bg-neutral-100 dark:bg-neutral-900 transition-colors duration-200"
    >
      <Helmet>
        <title>{searchTerm ? `Search: ${searchTerm}` : 'Search'} | ClipSesh</title>
        <meta name="description" content={`Search results for ${searchTerm} on ClipSesh`} />
      </Helmet>
      
      <LoadingBar
        color="#3b82f6"
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
        shadow={true}
        height={3}
      />
      
      {/* Search Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-center">
            {searchTerm ? 'Search Results' : 'Search Clips'}
          </h1>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <FaSearch className="absolute top-1/2 left-4 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" size={18} />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search for clips, streamers, or titles..."
                className="w-full py-3 pl-12 pr-4 bg-white dark:bg-neutral-800 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-white border border-transparent focus:border-blue-500"
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-between mt-4">
              {/* Fixed: Show total clips count */}
              {searchTerm && !loading && (
                <div className="flex-grow text-sm md:text-base mb-2 md:mb-0">
                  <span>
                    Found <strong>{totalClips}</strong> clip{totalClips !== 1 ? 's' : ''}
                    {(streamerFilter || submitterFilter) && ' matching your filters'}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                {/* Sort dropdown */}
                <div className="relative inline-block">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="appearance-none bg-white/20 hover:bg-white/30 text-white rounded px-4 py-2 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="upvotes">Most Upvotes</option>
                    <option value="downvotes">Most Downvotes</option>
                  </select>
                  <FaSortAmountDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
                
                {/* Filter button */}
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center space-x-1 px-4 py-2 rounded ${
                    filterOpen || streamerFilter || submitterFilter
                      ? 'bg-white/30 hover:bg-white/40'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <FaFilter />
                  <span>Filter</span>
                  {(streamerFilter || submitterFilter) && (
                    <span className="bg-blue-500 text-xs px-1.5 py-0.5 rounded-full ml-1">
                      {(streamerFilter ? 1 : 0) + (submitterFilter ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Panel */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-neutral-800 border-t border-b border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Filter Results</h2>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <FaTimes size={18} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Streamer Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Streamer
                  </label>
                  <select
                    value={streamerFilter}
                    onChange={(e) => setStreamerFilter(e.target.value)}
                    className="w-full p-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                  >
                    <option value="">All Streamers</option>
                    {streamers.map((streamer) => (
                      <option key={streamer} value={streamer}>
                        {streamer}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Submitter Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Submitter
                  </label>
                  <select
                    value={submitterFilter}
                    onChange={(e) => setSubmitterFilter(e.target.value)}
                    className="w-full p-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                  >
                    <option value="">All Submitters</option>
                    {submitters.map((submitter) => (
                      <option key={submitter} value={submitter}>
                        {submitter}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  Reset Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        {loading && !clips.length ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Searching for clips...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : clips.length > 0 ? (
          <>
            {/* Grid of Clips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {clips.map((clip, index) => (
                <motion.div
                  key={clip._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link
                    to={`/clips/${clip._id}`}
                    state={{ from: location }}
                    className="block relative aspect-video bg-neutral-200 dark:bg-neutral-900"
                  >
                    {/* Static thumbnail, no hover interaction */}
                    {clip.thumbnail ? (
                      <img 
                        src={clip.thumbnail} 
                        alt={clip.title} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={clip.url}
                        className="w-full h-full object-cover"
                        poster={clip.thumbnail}
                        preload="none"
                        muted
                      />
                    )}
                    
                    {/* Play indicator always visible */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                        <FaPlay className="text-white text-2xl" />
                      </div>
                    </div>
                    
                    {/* Streamer badge */}
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-sm px-2 py-1 rounded backdrop-blur-sm">
                      {clip.streamer}
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 line-clamp-2 h-12">
                      {highlightSearchTerm(clip.title)}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <FaArrowUp className="text-green-500 mr-1" />
                          {clip.upvotes}
                        </span>
                        <span className="flex items-center">
                          <FaArrowDown className="text-red-500 mr-1" />
                          {clip.downvotes}
                        </span>
                      </div>
                      <span className="flex items-center" title={new Date(clip.createdAt).toLocaleDateString()}>
                        <FaCalendarAlt className="mr-1" />
                        {format(new Date(clip.createdAt))}
                      </span>
                    </div>
                    
                    {clip.submitter !== 'Legacy(no data)' && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 truncate">
                        Submitted by: <span className="font-medium">{clip.submitter}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <nav className="flex items-center bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`p-3 border-r border-neutral-200 dark:border-neutral-700 ${
                      currentPage === 1 
                        ? 'text-neutral-400 cursor-not-allowed' 
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                    aria-label="First Page"
                  >
                    <FaAngleDoubleLeft size={18} />
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-3 border-r border-neutral-200 dark:border-neutral-700 ${
                      currentPage === 1 
                        ? 'text-neutral-400 cursor-not-allowed' 
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                    aria-label="Previous Page"
                  >
                    <FaAngleLeft size={18} />
                  </button>
                  
                  <div className="px-4 py-2 font-medium text-neutral-800 dark:text-white">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-3 border-l border-neutral-200 dark:border-neutral-700 ${
                      currentPage === totalPages 
                        ? 'text-neutral-400 cursor-not-allowed' 
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                    aria-label="Next Page"
                  >
                    <FaAngleRight size={18} />
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-3 border-l border-neutral-200 dark:border-neutral-700 ${
                      currentPage === totalPages 
                        ? 'text-neutral-400 cursor-not-allowed' 
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                    aria-label="Last Page"
                  >
                    <FaAngleDoubleRight size={18} />
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : searchTerm ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <FaSearch size={32} className="text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">No clips found</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              We couldn't find any clips matching "{searchTerm}". Please try different keywords or filters.
            </p>
            {(streamerFilter || submitterFilter) && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <FaSearch size={32} className="text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Search for clips</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Enter a search term above to find clips by streamer, title, or submitter.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ClipSearch;
