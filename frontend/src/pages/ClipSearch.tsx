import { useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaArrowUp, FaArrowDown, FaFilter, 
  FaTimes, FaPlay, FaCalendarAlt, FaSortAmountDown,
  FaUser, FaDiscord, FaGlobe, FaYoutube, FaTwitch, FaTwitter, FaInstagram, FaGithub,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { format } from 'timeago.js';
import debounce from 'lodash.debounce';
import LoadingBar from 'react-top-loading-bar';
import { getClipFilterOptions } from '../services/clipService';
import { unifiedSearch } from '../services/searchService';
import { Clip } from '../types/adminTypes';
import { SearchProfile, SeasonGroup } from '../types/searchTypes';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

type SortOption = 'newest' | 'oldest' | 'upvotes' | 'downvotes' | 'ratio';

const ClipSearch: React.FC = () => {
  const query = useQuery();
  const searchTerm = query.get('query') || '';
  const pageParam = parseInt(query.get('page') || '1');
  const streamerFilterParam = query.get('streamer') || '';
  const submitterFilterParam = query.get('submitter') || '';
  const sortOptionParam = (query.get('sort') as SortOption) || 'newest';
  const seasonFilterParam = query.get('season') || '';
  const yearFilterParam = query.get('year') || '';
  
  // Core state
  const [clips, setClips] = useState<Clip[]>([]);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [currentSeasonClips, setCurrentSeasonClips] = useState<Clip[]>([]);
  const [otherSeasonsClips, setOtherSeasonsClips] = useState<Record<string, SeasonGroup>>({});
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [currentSeason, setCurrentSeason] = useState<{ season: string; year: number }>({ season: '', year: 2025 });
  
  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [totalResults, setTotalResults] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(pageParam);
  const [searchType, setSearchType] = useState<'all' | 'clips' | 'profiles'>('all');
  
  // Filter state
  const [streamerFilter, setStreamerFilter] = useState<string>(streamerFilterParam);
  const [submitterFilter, setSubmitterFilter] = useState<string>(submitterFilterParam);
  const [sortOption, setSortOption] = useState<SortOption>(sortOptionParam);
  const [seasonFilter, setSeasonFilter] = useState<string>(seasonFilterParam);
  const [yearFilter, setYearFilter] = useState<string>(yearFilterParam);
  
  // UI controls
  const [progress, setProgress] = useState<number>(0);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>(searchTerm);
  const [streamers, setStreamers] = useState<string[]>([]);
  const [submitters, setSubmitters] = useState<string[]>([]);
  
  // Seasonal tabs state
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [currentSeasonDisplayCount, setCurrentSeasonDisplayCount] = useState<number>(8);
  
  const location = useLocation();
  const navigate = useNavigate();
  const isInitialLoad = useRef(true);
  // Fetch unique streamers and submitters for filters
  const fetchFilterOptions = useCallback(async (): Promise<void> => {
    try {
      const filterData = await getClipFilterOptions();
      setStreamers(filterData.streamers || []);
      setSubmitters(filterData.submitters || []);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  // Main fetch function for unified search
  const fetchResults = useCallback(async (): Promise<void> => {
    if (!searchTerm.trim()) {
      setClips([]);
      setProfiles([]);
      setCurrentSeasonClips([]);
      setOtherSeasonsClips({});
      setAvailableSeasons([]);
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
          sort: sortOption,
          ...(seasonFilter && { season: seasonFilter }),
          ...(yearFilter && { year: parseInt(yearFilter) })
        })
      };

      const response = await unifiedSearch(searchParams);
      setProgress(70);
      
      // Set the new seasonal data
      setClips(response.clips || []);
      setProfiles(response.profiles || []);
      setCurrentSeasonClips(response.currentSeasonClips || []);
      setOtherSeasonsClips(response.otherSeasonsClips || {});
      setAvailableSeasons(response.availableSeasons || []);
      setCurrentSeason(response.currentSeason || { season: '', year: 2000 });
      setTotalResults(response.total || 0);
      
      setProgress(100);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('An error occurred while fetching search results.');
      setProgress(100);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchType, currentPage, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter]);

  // Initial load and parameter changes
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Fetch filter options once on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Reset current season display count when search changes
  useEffect(() => {
    setCurrentSeasonDisplayCount(8);
  }, [searchTerm, searchType, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter]);

  // Sync state with URL parameters and update URL when state changes
  useEffect(() => {
    // Skip URL update on initial load to prevent double fetch
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    
    // Update URL when state changes
    const params = new URLSearchParams();
    if (searchTerm) params.set('query', searchTerm);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (searchType !== 'all') params.set('type', searchType);
    if (streamerFilter) params.set('streamer', streamerFilter);
    if (submitterFilter) params.set('submitter', submitterFilter);
    if (sortOption !== 'newest') params.set('sort', sortOption);
    if (seasonFilter) params.set('season', seasonFilter);
    if (yearFilter) params.set('year', yearFilter);
    
    const newUrl = `/search?${params.toString()}`;
    const currentUrl = `${location.pathname}${location.search}`;
    
    // Only update URL if it's different to prevent unnecessary re-renders
    if (newUrl !== currentUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [searchTerm, searchType, currentPage, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter, navigate, location.pathname, location.search]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      const params = new URLSearchParams(location.search);
      if (term.trim()) {
        params.set('query', term);
      } else {
        params.delete('query');
      }
      params.delete('page'); // Reset to page 1 on new search
      navigate(`/search?${params.toString()}`);
    }, 800),
    [location.search, navigate]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Handle clearing search
  const handleClearSearch = (): void => {
    setSearchInput('');
    // Direct URL update instead of using debounced search
    const params = new URLSearchParams(location.search);
    params.delete('query');
    params.delete('page'); // Reset to page 1
    navigate(`/search?${params.toString()}`);
  };

  // Reset filters
  const resetFilters = (): void => {
    setStreamerFilter('');
    setSubmitterFilter('');
    setSortOption('newest');
    setSeasonFilter('');
    setYearFilter('');
    setCurrentPage(1); // Reset to page 1 when filters are reset
  };

  // Apply filters (just close the filter panel since filters are applied automatically)
  const applyFilters = (): void => {
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

  // Helper function to get season emoji/color
  const getSeasonInfo = (season: string) => {
    switch (season.toLowerCase()) {
      case 'spring':
        return { emoji: '🌸', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900' };
      case 'summer':
        return { emoji: '☀️', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900' };
      case 'fall':
        return { emoji: '🍂', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900' };
      case 'winter':
        return { emoji: '❄️', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900' };
      default:
        return { emoji: '📅', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900' };
    }
  };

  // Toggle season expansion
  const toggleSeasonExpansion = (seasonKey: string) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonKey)) {
      newExpanded.delete(seasonKey);
    } else {
      newExpanded.add(seasonKey);
    }
    setExpandedSeasons(newExpanded);
  };

  // Show more current season clips
  const showMoreCurrentSeasonClips = () => {
    setCurrentSeasonDisplayCount(prev => prev + 8);
  };

  // Clip Card Component for reusability
  const ClipCard: React.FC<{ clip: Clip; index?: number }> = ({ clip, index = 0 }) => (
    <motion.div
      key={clip._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 group"
    >
      <Link
        to={`/clips/${clip._id}`}
        state={{ from: location }}
        className="block relative aspect-video bg-neutral-200 dark:bg-neutral-900"
      >
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
        
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full group-hover:scale-110 transition-transform">
            <FaPlay className="text-white text-2xl" />
          </div>
        </div>
        
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
  );

  // Profile Card Component
  const ProfileCard: React.FC<{ profile: SearchProfile; index?: number }> = ({ profile, index = 0 }) => {
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
        key={profile._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
        onClick={() => window.open(`/profile/${profile._id}`, '_blank')}
      >
        <div className="flex items-start gap-4">
          <img
            src={profile.profilePicture}
            alt={profile.username}
            className="w-16 h-16 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700 group-hover:border-blue-400 transition-colors"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {highlightSearchTerm(profile.username)}
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
            
            {profile.profile?.bio && (
              <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 line-clamp-2">
                {highlightSearchTerm(profile.profile.bio)}
              </p>
            )}
            
            <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-4">
                <span>{profile.stats.clipsSubmitted} clips</span>
                <span>Joined {new Date(profile.createdAt || profile.stats.joinDate).getFullYear()}</span>
              </div>
              {profile.profile?.socialLinks && Object.values(profile.profile.socialLinks).some(link => link) && (
                <div className="flex items-center gap-2">
                  {Object.entries(profile.profile.socialLinks).slice(0, 3).map(([platform, url]) => (
                    url && (
                      <div key={platform} className="text-lg opacity-70 group-hover:opacity-100 transition-opacity">
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
      
      {/* Modern Filter Bar */}
      <div className="bg-white dark:bg-neutral-800 sticky top-14 z-10 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <FaSearch className="absolute top-1/2 left-4 transform -translate-y-1/2 text-neutral-400" size={18} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="Search for clips, streamers, titles, or user profiles..."
                  className="w-full py-3 pl-12 pr-4 bg-neutral-100 dark:bg-neutral-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-neutral-600 text-neutral-900 dark:text-white border border-transparent focus:border-blue-500 transition-all duration-200"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Type Toggle */}
              <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
                {(['all', 'clips', 'profiles'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      searchType === type
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {type === 'all' ? 'All Results' : type === 'clips' ? 'Clips Only' : 'Profiles Only'}
                  </button>
                ))}
              </div>
              
              {/* Filter Toggle */}
              {searchType !== 'profiles' && (
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filterOpen || streamerFilter || submitterFilter || seasonFilter || yearFilter
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  <FaFilter />
                  <span>Filters</span>
                  {(streamerFilter || submitterFilter || seasonFilter || yearFilter) && (
                    <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                      {(streamerFilter ? 1 : 0) + (submitterFilter ? 1 : 0) + (seasonFilter ? 1 : 0) + (yearFilter ? 1 : 0)}
                    </span>
                  )}
                </button>
              )}
              
              {/* Sort Dropdown */}
              {searchType !== 'profiles' && (
                <div className="relative inline-block">
                  <select
                    value={sortOption}
                    onChange={handleSortChange}
                    className="appearance-none bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg px-4 py-2 pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="upvotes">Most Upvotes</option>
                    <option value="downvotes">Most Downvotes</option>
                    <option value="ratio">Best Ratio</option>
                  </select>
                  <FaSortAmountDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-neutral-400" />
                </div>
              )}
            </div>
          </div>
          
          {/* Results Summary */}
          {searchTerm && !loading && (
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              Found <strong>{totalResults}</strong> result{totalResults !== 1 ? 's' : ''} for "{searchTerm}"
              {(streamerFilter || submitterFilter || seasonFilter || yearFilter) && ' with active filters'}
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Filter Panel */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-neutral-200 dark:border-neutral-700"
          >
            <div className="bg-neutral-50 dark:bg-neutral-800">
              <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Advanced Filters
                  </h3>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  >
                    <FaTimes size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Streamer Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Filter by Streamer
                    </label>
                    <select
                      value={streamerFilter}
                      onChange={(e) => setStreamerFilter(e.target.value)}
                      className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                      Filter by Submitter
                    </label>
                    <select
                      value={submitterFilter}
                      onChange={(e) => setSubmitterFilter(e.target.value)}
                      className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">All Submitters</option>
                      {submitters.map((submitter) => (
                        <option key={submitter} value={submitter}>
                          {submitter}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Season Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Filter by Season
                    </label>
                    <select
                      value={seasonFilter}
                      onChange={(e) => setSeasonFilter(e.target.value)}
                      className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Filter by Year
                    </label>
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">All Years</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>
                  
                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Sort Order
                    </label>
                    <select
                      value={sortOption}
                      onChange={handleSortChange}
                      className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="upvotes">Most Upvotes</option>
                      <option value="downvotes">Most Downvotes</option>
                      <option value="ratio">Best Ratio</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200 font-medium"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                  >
                    Apply Filters
                  </button>
                </div>
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
        ) : (currentSeasonClips.length > 0 || Object.keys(otherSeasonsClips).length > 0 || profiles.length > 0 || clips.length > 0) ? (
          <>
            {/* Display profiles first if any */}
            {profiles.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-12"
              >
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1 flex items-center">
                    <FaUser className="mr-3 text-blue-500" />
                    Profiles
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Found {profiles.length} profile{profiles.length !== 1 ? 's' : ''} matching your search
                  </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {profiles.map((profile, index) => (
                    <ProfileCard key={profile._id} profile={profile} index={index} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Filtered Clips (when season/year filters are applied) */}
            {(seasonFilter || yearFilter) && clips.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: profiles.length > 0 ? 0.2 : 0 }}
                className="mb-12"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1 flex items-center">
                        <FaSearch className="mr-3" />
                        <span>Filtered Results</span>
                        {seasonFilter && (
                          <>
                            <span className="ml-2">- {getSeasonInfo(seasonFilter).emoji}</span>
                            <span className="ml-1 capitalize">{seasonFilter}</span>
                          </>
                        )}
                        {yearFilter && <span className="ml-1">{yearFilter}</span>}
                      </h2>
                      <p className="text-blue-100">
                        {clips.length} clip{clips.length !== 1 ? 's' : ''} matching your filters
                      </p>
                    </div>
                    <div className="text-4xl opacity-20">
                      {seasonFilter ? getSeasonInfo(seasonFilter).emoji : '🔍'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {clips.map((clip, index) => (
                    <ClipCard key={clip._id} clip={clip} index={index} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Current Season Clips (when no season/year filters are applied) */}
            {!seasonFilter && !yearFilter && currentSeasonClips.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: profiles.length > 0 ? 0.2 : 0 }}
                className="mb-12"
              >
                <div className={`${getSeasonInfo(currentSeason.season).bgColor} text-white rounded-xl shadow-lg p-6 mb-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1 flex items-center">
                        {getSeasonInfo(currentSeason.season).emoji}
                        <span className="ml-2">{currentSeason.season} {currentSeason.year} - Current Season</span>
                      </h2>
                      <p className="text-blue-100">
                        {currentSeasonClips.length} clip{currentSeasonClips.length !== 1 ? 's' : ''} from the current season
                      </p>
                    </div>
                    <div className="text-4xl opacity-20">
                      {getSeasonInfo(currentSeason.season).emoji}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentSeasonClips.slice(0, currentSeasonDisplayCount).map((clip, index) => (
                    <ClipCard key={clip._id} clip={clip} index={index} />
                  ))}
                </div>
                
                {/* Show More Button for Current Season */}
                {currentSeasonClips.length > currentSeasonDisplayCount && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={showMoreCurrentSeasonClips}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm flex items-center"
                    >
                      Show {Math.min(8, currentSeasonClips.length - currentSeasonDisplayCount)} More Clips
                      <FaChevronDown className="ml-2" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Other Seasons (when no season/year filters are applied) */}
            {!seasonFilter && !yearFilter && Object.keys(otherSeasonsClips).length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (profiles.length > 0 ? 0.2 : 0) + (currentSeasonClips.length > 0 ? 0.2 : 0) }}
                className="mb-12"
              >
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1 flex items-center">
                    <FaCalendarAlt className="mr-3 text-orange-500" />
                    Previous Seasons
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Clips from {Object.keys(otherSeasonsClips).length} other season{Object.keys(otherSeasonsClips).length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-6">
                  {availableSeasons.map((seasonKey) => {
                    const seasonData = otherSeasonsClips[seasonKey];
                    if (!seasonData) return null;
                    
                    const isExpanded = expandedSeasons.has(seasonKey);
                    const seasonInfo = getSeasonInfo(seasonData.season);
                    
                    return (
                      <motion.div 
                        key={seasonKey}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden"
                      >
                        <button
                          onClick={() => toggleSeasonExpansion(seasonKey)}
                          className={`w-full p-6 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${seasonInfo.bgColor}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{seasonInfo.emoji}</span>
                              <div>
                                <h3 className={`text-xl font-bold ${seasonInfo.color} capitalize`}>
                                  {seasonData.season} {seasonData.year}
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                  {seasonData.clips.length} clip{seasonData.clips.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {isExpanded ? (
                                <FaChevronUp className="text-neutral-500" />
                              ) : (
                                <FaChevronDown className="text-neutral-500" />
                              )}
                            </div>
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 pt-0 bg-white dark:bg-neutral-900 border-4 border-t-0 border-neutral-50 rounded-b-xl dark:border-neutral-800">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                                  {seasonData.clips.slice(0, 8).map((clip, index) => (
                                    <ClipCard key={clip._id} clip={clip} index={index} />
                                  ))}
                                </div>
                                {seasonData.clips.length > 8 && (
                                  <div className="text-center">
                                    <Link
                                      to={`/search?query=${encodeURIComponent(searchTerm)}&season=${seasonData.season}&year=${seasonData.year}`}
                                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                      View all {seasonData.clips.length} clips from {seasonData.season} {seasonData.year}
                                      <FaPlay className="ml-2" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
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
            {(streamerFilter || submitterFilter || seasonFilter || yearFilter) && (
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
