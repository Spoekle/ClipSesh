import { useEffect, useState, useCallback, ReactNode } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaArrowUp, FaArrowDown, FaFilter, 
  FaTimes, FaPlay, FaCalendarAlt, FaSortAmountDown,
  FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight,
  FaUser, FaDiscord, FaGlobe, FaYoutube, FaTwitch, FaTwitter, FaInstagram, FaGithub
} from 'react-icons/fa';
import { format } from 'timeago.js';
import axios from 'axios';
import debounce from 'lodash.debounce';
import LoadingBar from 'react-top-loading-bar';
import { Clip } from '../types/adminTypes';
import { unifiedSearch } from '../services/searchService';
import { UnifiedSearchResponse, SearchProfile } from '../types/searchTypes';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Filter options response type
interface FilterOptionsResponse {
  streamers: string[];
  submitters: string[];
}

type SortOption = 'newest' | 'oldest' | 'upvotes' | 'downvotes';

const ClipSearch: React.FC = () => {
  const query = useQuery();
  const searchTerm = query.get('query') || '';
  const pageParam = parseInt(query.get('page') || '1');
  const streamerFilterParam = query.get('streamer') || '';
  const submitterFilterParam = query.get('submitter') || '';
  const sortOptionParam = (query.get('sort') as SortOption) || 'newest';
  
  const [clips, setClips] = useState<Clip[]>([]);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [totalResults, setTotalResults] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(pageParam);
  const [searchType, setSearchType] = useState<'all' | 'clips' | 'profiles'>('all');
  
  const [streamerFilter, setStreamerFilter] = useState<string>(streamerFilterParam);
  const [submitterFilter, setSubmitterFilter] = useState<string>(submitterFilterParam);
  const [sortOption, setSortOption] = useState<SortOption>(sortOptionParam);
  
  const [progress, setProgress] = useState<number>(0);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>(searchTerm);
  const [streamers, setStreamers] = useState<string[]>([]);
  const [submitters, setSubmitters] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<UnifiedSearchResponse | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch unique streamers and submitters for filters
  const fetchFilterOptions = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get<FilterOptionsResponse>(`${apiUrl}/api/clips/filter-options`);
      if (response.data) {
        setStreamers(response.data.streamers || []);
        setSubmitters(response.data.submitters || []);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  // Main fetch function for unified search
  const fetchResults = useCallback(async (): Promise<void> => {
    if (!searchTerm.trim()) {
      setClips([]);
      setProfiles([]);
      setLoading(false);
      setTotalResults(0);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setProgress(30);
      
      const searchParams = {
        q: searchTerm,
        type: searchType,
        page: currentPage,
        limit: 12,
        ...(searchType !== 'profiles' && {
          streamer: streamerFilter,
          submitter: submitterFilter,
          sort: sortOption
        })
      };

      const response = await unifiedSearch(searchParams);
      setProgress(70);
      
      setClips(response.clips || []);
      setProfiles(response.profiles || []);
      setTotalResults(response.total || 0);
      setTotalPages(response.totalPages || 1);
      
      if (!streamers.length || !submitters.length) {
        fetchFilterOptions();
      }
      
      setProgress(100);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('An error occurred while fetching search results.');
      setProgress(100);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchType, currentPage, streamerFilter, submitterFilter, sortOption, fetchFilterOptions, streamers.length, submitters.length]);

  // Initial load and parameter changes
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('query', searchTerm);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (searchType !== 'all') params.set('type', searchType);
    if (streamerFilter) params.set('streamer', streamerFilter);
    if (submitterFilter) params.set('submitter', submitterFilter);
    if (sortOption !== 'newest') params.set('sort', sortOption);
    
    navigate(`/search?${params.toString()}`, { replace: true });
    
    // Only fetch if searchTerm exists
    if (searchTerm) {
      fetchResults();
    }
  }, [searchTerm, searchType, currentPage, streamerFilter, submitterFilter, sortOption, navigate, fetchResults]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      const params = new URLSearchParams(location.search);
      params.set('query', term);
      params.delete('page'); // Reset to page 1 on new search
      navigate(`/search?${params.toString()}`);
    }, 500),
    [location.search, navigate]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Handle page change
  const handlePageChange = (newPage: number): void => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // Reset filters
  const resetFilters = (): void => {
    setStreamerFilter('');
    setSubmitterFilter('');
    setSortOption('newest');
  };

  // Fix the applyFilters function to actually trigger a search
  const applyFilters = (): void => {
    setCurrentPage(1); // Reset to page 1 when filters change
    setFilterOpen(false);
  };

  // Fix the sort option change handler to immediately apply the sorting
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newSortOption = e.target.value as SortOption;
    setSortOption(newSortOption);
    setCurrentPage(1); // Important: reset to page 1 when sorting changes
  };

  // Generate title highlighting for search matches
  const highlightSearchTerm = (text: string): ReactNode => {
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

  const handleSearch = useCallback(async (page: number = 1, resetResults: boolean = false) => {
    if (!searchInput.trim()) return;

    setProgress(10);
    setLoading(true);
    
    if (resetResults) {
      setSearchResults(null);
    }

    try {
      const params = {
        q: searchInput,
        type: searchType,
        page,
        limit: 12,
        ...(searchType === 'clips' && streamerFilter && { streamer: streamerFilter }),
        ...(searchType === 'clips' && submitterFilter && { submitter: submitterFilter }),
        ...(searchType === 'clips' && { sort: sortOption })
      };

      setProgress(50);
      const results = await unifiedSearch(params);
      setSearchResults(results);
      setCurrentPage(page);
      
      setProgress(100);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, [searchInput, searchType, streamerFilter, submitterFilter, sortOption]);

  // Add the ProfileCard component if it's missing
  const ProfileCard: React.FC<{ profile: SearchProfile }> = ({ profile }) => {
    const getSocialIcon = (platform: string) => {
      switch (platform) {
        case 'youtube': return <FaYoutube className="text-red-500" />;
        case 'twitch': return <FaTwitch className="text-purple-500" />;
        case 'twitter': return <FaTwitter className="text-blue-400" />;
        case 'instagram': return <FaInstagram className="text-pink-500" />;
        case 'github': return <FaGithub className="text-gray-600 dark:text-gray-400" />;
        default: return <FaGlobe />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={() => window.open(`/profile/${profile._id}`, '_blank')}
      >
        <div className="flex items-start gap-4">
          <img
            src={profile.profilePicture}
            alt={profile.username}
            className="w-16 h-16 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
                {profile.username}
              </h3>
              {profile.roles && profile.roles.length > 0 && (
                <div className="flex gap-1">
                  {profile.roles.slice(0, 2).map((role) => (
                    <span
                      key={role}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role === 'admin'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : role === 'editor'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : role === 'clipteam'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {profile.discordUsername && (
              <div className="flex items-center gap-2 mb-2">
                <FaDiscord className="text-indigo-500" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {profile.discordUsername}
                </span>
              </div>
            )}
            
            {profile.bio && (
              <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 line-clamp-2">
                {profile.bio}
              </p>
            )}
            
            <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-4">
                <span>{profile.stats.clipsSubmitted} clips</span>
                <span>Joined {new Date(profile.joinDate).getFullYear()}</span>
              </div>
              
              {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
                <div className="flex items-center gap-2">
                  {Object.entries(profile.socialLinks).slice(0, 3).map(([platform, url]) => (
                    url && (
                      <div key={platform} className="text-lg">
                        {getSocialIcon(platform)}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
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
        height={4}
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
                    Found <strong>{totalResults}</strong> result{totalResults !== 1 ? 's' : ''}
                    {(streamerFilter || submitterFilter) && ' matching your filters'}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                {/* Search type filter */}
                <div className="relative inline-block">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'all' | 'clips' | 'profiles')}
                    className="appearance-none bg-white/20 hover:bg-white/30 text-white rounded px-4 py-2 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option className="text-neutral-900" value="all">All Results</option>
                    <option className="text-neutral-900" value="clips">Clips Only</option>
                    <option className="text-neutral-900" value="profiles">Profiles Only</option>
                  </select>
                  <FaSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
                
                {/* Sort dropdown - only show for clips */}
                {searchType !== 'profiles' && (
                  <div className="relative inline-block">
                    <select
                      value={sortOption}
                      onChange={handleSortChange}
                      className="appearance-none bg-white/20 hover:bg-white/30 text-white rounded px-4 py-2 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option className="text-neutral-900" value="newest">Newest First</option>
                      <option className="text-neutral-900" value="oldest">Oldest First</option>
                      <option className="text-neutral-900" value="upvotes">Most Upvotes</option>
                      <option className="text-neutral-900" value="downvotes">Most Downvotes</option>
                    </select>
                    <FaSortAmountDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
                
                {/* Filter button - only show for clips */}
                {searchType !== 'profiles' && (
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
                )}
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
        {loading && !clips.length && !profiles.length ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Searching...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : (clips.length > 0 || profiles.length > 0) ? (
          <>
            {/* Display profiles first if any */}
            {profiles.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
                  <FaUser className="mr-2" />
                  Profiles ({profiles.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {profiles.map((profile, index) => (
                    <motion.div
                      key={profile._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <Link
                        to={`/profile/${profile._id}`}
                        className="block p-6 text-center"
                      >
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          {profile.profilePicture ? (
                            <img 
                              src={profile.profilePicture} 
                              alt={profile.username} 
                              className="w-full h-full object-cover rounded-full"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                              <FaUser className="text-neutral-500 dark:text-neutral-400 text-2xl" />
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                          {highlightSearchTerm(profile.username)}
                        </h3>
                        
                        {profile.bio && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                            {highlightSearchTerm(profile.bio)}
                          </p>
                        )}
                        
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                          Joined {format(new Date(profile.createdAt))}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Display clips if any */}
            {clips.length > 0 && (
              <div>
                {profiles.length > 0 && (
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
                    <FaPlay className="mr-2" />
                    Clips ({clips.length})
                  </h2>
                )}
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
              </div>
            )}
            
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
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">No results found</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              We couldn't find any {searchType === 'clips' ? 'clips' : searchType === 'profiles' ? 'profiles' : 'results'} matching "{searchTerm}". Please try different keywords or filters.
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
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Search for content</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Enter a search term above to find clips by streamer, title, submitter, or search for user profiles.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ClipSearch;
