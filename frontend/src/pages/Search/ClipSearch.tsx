import { useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import debounce from 'lodash.debounce';
import LoadingBar from 'react-top-loading-bar';
import { getCurrentSeason } from '../../utils/seasonHelpers';
import { getClipFilterOptions } from '../../services/clipService';
import { unifiedSearch } from '../../services/searchService';
import { Clip } from '../../types/adminTypes';
import { SearchProfile, SeasonGroup } from '../../types/searchTypes';
import PageLayout from '../../components/layouts/PageLayout';

// Seasonal images
import winterImg from '../../media/winter.webp';
import springImg from '../../media/spring.jpg';
import summerImg from '../../media/summer.jpg';
import fallImg from '../../media/fall.jpg';

// Components
import SearchFilterBar from './components/SearchFilterBar';
import SearchClipCard from './components/SearchClipCard';
import SearchProfileCard from './components/SearchProfileCard';

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

  // Display controls
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [currentSeasonDisplayCount, setCurrentSeasonDisplayCount] = useState<number>(8);

  const location = useLocation();
  const navigate = useNavigate();
  const isInitialLoad = useRef(true);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async (): Promise<void> => {
    try {
      const filterData = await getClipFilterOptions();
      setStreamers(filterData.streamers || []);
      setSubmitters(filterData.submitters || []);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  // Main fetch function
  const fetchResults = useCallback(async (): Promise<void> => {
    if (!searchTerm.trim()) {
      setClips([]);
      setProfiles([]);
      setCurrentSeasonClips([]);
      setOtherSeasonsClips({});
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

      setClips(response.clips || []);
      setProfiles(response.profiles || []);
      setCurrentSeasonClips(response.currentSeasonClips || []);
      setOtherSeasonsClips(response.otherSeasonsClips || {});
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

  useEffect(() => { fetchResults(); }, [fetchResults]);
  useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);
  useEffect(() => { setCurrentSeasonDisplayCount(8); }, [searchTerm, searchType, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter]);

  // URL sync
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

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

    if (newUrl !== currentUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [searchTerm, searchType, currentPage, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter, navigate, location.pathname, location.search]);

  // Handlers
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      const params = new URLSearchParams(location.search);
      term.trim() ? params.set('query', term) : params.delete('query');
      params.delete('page');
      navigate(`/search?${params.toString()}`);
    }, 800),
    [location.search, navigate]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const params = new URLSearchParams(location.search);
    params.delete('query');
    params.delete('page');
    navigate(`/search?${params.toString()}`);
  };

  const resetFilters = () => {
    setStreamerFilter('');
    setSubmitterFilter('');
    setSortOption('newest');
    setSeasonFilter('');
    setYearFilter('');
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value as SortOption);
    setCurrentPage(1);
  };

  const highlightSearchTerm = (text: string): ReactNode => {
    if (!searchTerm || !text) return text;
    try {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? <mark key={i} className="bg-yellow-300/50 dark:bg-yellow-600/50 px-0.5 rounded">{part}</mark> : part
      );
    } catch {
      return text;
    }
  };

  const getSeasonInfo = (season: string) => {
    const info: Record<string, { emoji: string; bgColor: string }> = {
      spring: { emoji: '🌸', bgColor: 'bg-green-500/90' },
      summer: { emoji: '☀️', bgColor: 'bg-yellow-500/90' },
      fall: { emoji: '🍂', bgColor: 'bg-orange-500/90' },
      winter: { emoji: '❄️', bgColor: 'bg-blue-500/90' },
    };
    return info[season.toLowerCase()] || { emoji: '📅', bgColor: 'bg-gray-500/90' };
  };

  const toggleSeasonExpansion = (seasonKey: string) => {
    const newExpanded = new Set(expandedSeasons);
    newExpanded.has(seasonKey) ? newExpanded.delete(seasonKey) : newExpanded.add(seasonKey);
    setExpandedSeasons(newExpanded);
  };

  // Get seasonal background image
  const getSeasonalBackground = () => {
    const { season } = getCurrentSeason();
    if (season === 'spring') return springImg;
    if (season === 'summer') return summerImg;
    if (season === 'fall') return fallImg;
    return winterImg;
  };

  const hasResults = currentSeasonClips.length > 0 || Object.keys(otherSeasonsClips).length > 0 || profiles.length > 0 || clips.length > 0;

  return (
    <PageLayout
      title="Search"
      subtitle={searchTerm ? `Results for "${searchTerm}"${totalResults ? ` (${totalResults} found)` : ''}` : 'Find clips, streamers, and profiles'}
      backgroundImage={getSeasonalBackground()}
      metaDescription={`Search results for ${searchTerm} on ClipSesh`}
    >
      <LoadingBar color="#3b82f6" progress={progress} onLoaderFinished={() => setProgress(0)} shadow={true} height={4} />

      {/* Filter Bar */}
      <SearchFilterBar
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
        filterOpen={filterOpen}
        onFilterToggle={() => setFilterOpen(!filterOpen)}
        streamerFilter={streamerFilter}
        submitterFilter={submitterFilter}
        seasonFilter={seasonFilter}
        yearFilter={yearFilter}
        onStreamerChange={setStreamerFilter}
        onSubmitterChange={setSubmitterFilter}
        onSeasonChange={setSeasonFilter}
        onYearChange={setYearFilter}
        onResetFilters={resetFilters}
        onApplyFilters={() => setFilterOpen(false)}
        sortOption={sortOption}
        onSortChange={handleSortChange}
        streamers={streamers}
        submitters={submitters}
        searchTerm={searchTerm}
        totalResults={totalResults}
        loading={loading}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading && !clips.length && !profiles.length ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">Searching...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : hasResults ? (
          <div className="space-y-12">
            {/* Profiles Section */}
            {profiles.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-neutral-200/50 dark:border-neutral-700/50">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                    <FaUser className="text-blue-500" />
                    Profiles
                    <span className="text-sm font-normal text-neutral-500">({profiles.length})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {profiles.map((profile, index) => (
                    <SearchProfileCard key={profile._id} profile={profile} index={index} highlightSearchTerm={highlightSearchTerm} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Filtered Clips */}
            {(seasonFilter || yearFilter) && clips.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FaSearch />
                    Filtered Results
                    {seasonFilter && <span className="ml-2">{getSeasonInfo(seasonFilter).emoji} {seasonFilter}</span>}
                    {yearFilter && <span className="ml-1">{yearFilter}</span>}
                    <span className="text-sm font-normal opacity-80 ml-2">({clips.length} clips)</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {clips.map((clip, index) => (
                    <SearchClipCard key={clip._id} clip={clip} index={index} highlightSearchTerm={highlightSearchTerm} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Current Season Clips */}
            {!seasonFilter && !yearFilter && currentSeasonClips.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className={`${getSeasonInfo(currentSeason.season).bgColor} text-white rounded-xl shadow-lg p-6 mb-6`}>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {getSeasonInfo(currentSeason.season).emoji}
                    {currentSeason.season} {currentSeason.year}
                    <span className="text-sm font-normal opacity-80 ml-2">Current Season ({currentSeasonClips.length} clips)</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentSeasonClips.slice(0, currentSeasonDisplayCount).map((clip, index) => (
                    <SearchClipCard key={clip._id} clip={clip} index={index} highlightSearchTerm={highlightSearchTerm} />
                  ))}
                </div>
                {currentSeasonClips.length > currentSeasonDisplayCount && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setCurrentSeasonDisplayCount(prev => prev + 8)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Show More Clips
                    </button>
                  </div>
                )}
              </motion.section>
            )}

            {/* Other Seasons */}
            {!seasonFilter && !yearFilter && Object.keys(otherSeasonsClips).length > 0 && (
              <div className="space-y-6">
                {Object.entries(otherSeasonsClips).map(([seasonKey, seasonData]) => (
                  <motion.section key={seasonKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <button
                      onClick={() => toggleSeasonExpansion(seasonKey)}
                      className="w-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition-all duration-200 border border-neutral-200/50 dark:border-neutral-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getSeasonInfo(seasonData.season).emoji}</span>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                          {seasonData.season} {seasonData.year}
                        </h3>
                        <span className="text-sm text-neutral-500">({seasonData.clips.length} clips)</span>
                      </div>
                      {expandedSeasons.has(seasonKey) ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    {expandedSeasons.has(seasonKey) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      >
                        {seasonData.clips.map((clip, index) => (
                          <SearchClipCard key={clip._id} clip={clip} index={index} highlightSearchTerm={highlightSearchTerm} />
                        ))}
                      </motion.div>
                    )}
                  </motion.section>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mb-6">
              <FaSearch className="text-3xl text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              {searchTerm ? 'No results found' : 'Start searching'}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
              {searchTerm
                ? `We couldn't find any results for "${searchTerm}". Try different keywords or filters.`
                : 'Enter a search term above to find clips, streamers, and profiles.'}
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ClipSearch;
