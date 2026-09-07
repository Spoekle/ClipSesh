'use client';

import { useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useLocation } from '@/lib/routerCompat';
import { motion } from 'framer-motion';
import {
  FaUser,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaSeedling,
  FaSun,
  FaLeaf,
  FaSnowflake,
  FaCalendarAlt,
} from 'react-icons/fa';
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

type SortOption = 'newest' | 'oldest' | 'upvotes' | 'downvotes' | 'ratio';

const getSeasonIcon = (season: string) => {
  switch (season?.toLowerCase()) {
    case 'spring':
      return <FaSeedling className="text-emerald-400" size={14} />;
    case 'summer':
      return <FaSun className="text-amber-400" size={14} />;
    case 'fall':
      return <FaLeaf className="text-orange-400" size={14} />;
    case 'winter':
      return <FaSnowflake className="text-sky-400" size={14} />;
    default:
      return <FaCalendarAlt className="text-neutral-400" size={13} />;
  }
};

const ClipSearch: React.FC = () => {
  const location = useLocation();

  // Parse initial values on mount
  const initialParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(location.search || '');
  }, []);

  const initialSearchTerm = initialParams.get('query') || initialParams.get('q') || '';
  const initialSearchType = (initialParams.get('type') as 'all' | 'clips' | 'profiles') || 'all';
  const initialStreamer = initialParams.get('streamer') || '';
  const initialSubmitter = initialParams.get('submitter') || '';
  const initialSort = (initialParams.get('sort') as SortOption) || 'newest';
  const initialSeason = initialParams.get('season') || '';
  const initialYear = initialParams.get('year') || '';
  const initialPage = parseInt(initialParams.get('page') || '1', 10);

  // Active search query & filter states
  const [searchInput, setSearchInput] = useState<string>(initialSearchTerm);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [searchType, setSearchType] = useState<'all' | 'clips' | 'profiles'>(initialSearchType);
  const [streamerFilter, setStreamerFilter] = useState<string>(initialStreamer);
  const [submitterFilter, setSubmitterFilter] = useState<string>(initialSubmitter);
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);
  const [seasonFilter, setSeasonFilter] = useState<string>(initialSeason);
  const [yearFilter, setYearFilter] = useState<string>(initialYear);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // Results state
  const [clips, setClips] = useState<Clip[]>([]);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [currentSeasonClips, setCurrentSeasonClips] = useState<Clip[]>([]);
  const [otherSeasonsClips, setOtherSeasonsClips] = useState<Record<string, SeasonGroup>>({});
  const [currentSeason, setCurrentSeason] = useState<{ season: string; year: number }>({ season: '', year: 2026 });

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [totalResults, setTotalResults] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [streamers, setStreamers] = useState<string[]>([]);
  const [submitters, setSubmitters] = useState<string[]>([]);

  // Display controls
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [currentSeasonDisplayCount, setCurrentSeasonDisplayCount] = useState<number>(8);

  // Sync browser URL bar cleanly using history.replaceState (prevents Next.js loops & rate-limits)
  const syncUrl = useCallback((
    term: string,
    type: string,
    streamer: string,
    submitter: string,
    sort: string,
    season: string,
    year: string,
    page: number
  ) => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams();
      if (term.trim()) sp.set('query', term.trim());
      if (type && type !== 'all') sp.set('type', type);
      if (streamer) sp.set('streamer', streamer);
      if (submitter) sp.set('submitter', submitter);
      if (sort && sort !== 'newest') sp.set('sort', sort);
      if (season) sp.set('season', season);
      if (year) sp.set('year', year);
      if (page > 1) sp.set('page', page.toString());

      const qs = sp.toString();
      const targetUrl = qs ? `/search?${qs}` : '/search';
      const currentUrl = window.location.pathname + (window.location.search || '');
      if (targetUrl !== currentUrl) {
        window.history.replaceState(null, '', targetUrl);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const filterData = await getClipFilterOptions();
        setStreamers(filterData.streamers || []);
        setSubmitters(filterData.submitters || []);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Main search execution function
  const executeSearch = useCallback(async () => {
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

      const params = {
        q: searchTerm.trim(),
        type: searchType,
        page: currentPage,
        limit: 12,
        ...(searchType !== 'profiles' && {
          streamer: streamerFilter,
          submitter: submitterFilter,
          sort: sortOption,
          ...(seasonFilter && { season: seasonFilter }),
          ...(yearFilter && { year: parseInt(yearFilter, 10) }),
        }),
      };

      const response = await unifiedSearch(params);
      setProgress(70);

      setClips(response.clips || []);
      setProfiles(response.profiles || []);
      setCurrentSeasonClips(response.currentSeasonClips || []);
      setOtherSeasonsClips(response.otherSeasonsClips || {});
      setCurrentSeason(response.currentSeason || { season: '', year: 2026 });
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

  // Execute search whenever search parameters change
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // Reset display count when query changes
  useEffect(() => {
    setCurrentSeasonDisplayCount(8);
  }, [searchTerm, searchType, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter]);

  // Debounced commit for typing
  const debouncedCommitRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    debouncedCommitRef.current = debounce((val: string) => {
      const trimmed = val.trim();
      setSearchTerm(trimmed);
      setCurrentPage(1);
      syncUrl(trimmed, searchType, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter, 1);
    }, 350);

    return () => {
      debouncedCommitRef.current?.cancel();
    };
  }, [searchType, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter, syncUrl]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    debouncedCommitRef.current?.(val);
  };

  const handleSearchSubmit = () => {
    debouncedCommitRef.current?.cancel();
    const trimmed = searchInput.trim();
    setSearchTerm(trimmed);
    setCurrentPage(1);
    syncUrl(trimmed, searchType, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter, 1);
  };

  const handleClearSearch = () => {
    debouncedCommitRef.current?.cancel();
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
    syncUrl('', searchType, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter, 1);
  };

  const handleSearchTypeChange = (type: 'all' | 'clips' | 'profiles') => {
    setSearchType(type);
    setCurrentPage(1);
    syncUrl(searchTerm, type, streamerFilter, submitterFilter, sortOption, seasonFilter, yearFilter, 1);
  };

  const handleStreamerChange = (val: string) => {
    setStreamerFilter(val);
    setCurrentPage(1);
    syncUrl(searchTerm, searchType, val, submitterFilter, sortOption, seasonFilter, yearFilter, 1);
  };

  const handleSubmitterChange = (val: string) => {
    setSubmitterFilter(val);
    setCurrentPage(1);
    syncUrl(searchTerm, searchType, streamerFilter, val, sortOption, seasonFilter, yearFilter, 1);
  };

  const handleSeasonChange = (val: string) => {
    setSeasonFilter(val);
    setCurrentPage(1);
    syncUrl(searchTerm, searchType, streamerFilter, submitterFilter, sortOption, val, yearFilter, 1);
  };

  const handleYearChange = (val: string) => {
    setYearFilter(val);
    setCurrentPage(1);
    syncUrl(searchTerm, searchType, streamerFilter, submitterFilter, sortOption, seasonFilter, val, 1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as SortOption;
    setSortOption(val);
    setCurrentPage(1);
    syncUrl(searchTerm, searchType, streamerFilter, submitterFilter, val, seasonFilter, yearFilter, 1);
  };

  const resetFilters = () => {
    setStreamerFilter('');
    setSubmitterFilter('');
    setSortOption('newest');
    setSeasonFilter('');
    setYearFilter('');
    setCurrentPage(1);
    syncUrl(searchTerm, searchType, '', '', 'newest', '', '', 1);
  };

  const highlightSearchTerm = (text: string): ReactNode => {
    if (!searchTerm || !text) return text;
    try {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#f23030]/20 text-[#f1f1f1] px-0.5 rounded font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  const toggleSeasonExpansion = (seasonKey: string) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonKey)) {
      newExpanded.delete(seasonKey);
    } else {
      newExpanded.add(seasonKey);
    }
    setExpandedSeasons(newExpanded);
  };

  const getSeasonalBackground = () => {
    const { season } = getCurrentSeason();
    if (season === 'spring') return springImg;
    if (season === 'summer') return summerImg;
    if (season === 'fall') return fallImg;
    return winterImg;
  };

  const hasResults =
    currentSeasonClips.length > 0 ||
    Object.keys(otherSeasonsClips).length > 0 ||
    profiles.length > 0 ||
    clips.length > 0;

  return (
    <PageLayout
      title="Search"
      subtitle={
        searchTerm
          ? `Results for "${searchTerm}"${totalResults ? ` (${totalResults} found)` : ''}`
          : 'Find clips, streamers, and profiles'
      }
      backgroundImage={getSeasonalBackground()}
      metaDescription={`Search results for ${searchTerm} on ClipSesh`}
    >
      <LoadingBar
        color="#f23030"
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
        shadow={true}
        height={3}
      />

      {/* YouTube-style Filter Bar */}
      <SearchFilterBar
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        searchType={searchType}
        onSearchTypeChange={handleSearchTypeChange}
        filterOpen={filterOpen}
        onFilterToggle={() => setFilterOpen(!filterOpen)}
        streamerFilter={streamerFilter}
        submitterFilter={submitterFilter}
        seasonFilter={seasonFilter}
        yearFilter={yearFilter}
        onStreamerChange={handleStreamerChange}
        onSubmitterChange={handleSubmitterChange}
        onSeasonChange={handleSeasonChange}
        onYearChange={handleYearChange}
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

      {/* Main Content Area */}
      <div className="w-full pb-12">
        {loading && !clips.length && !profiles.length ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-3 border-[#f23030] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-[#aaaaaa]">Searching ClipSesh...</p>
          </div>
        ) : error ? (
          <div className="bg-[#181818] border border-[#f23030]/40 p-4 rounded-xl text-[#f23030] text-sm text-center max-w-md mx-auto my-8">
            <p>{error}</p>
          </div>
        ) : hasResults ? (
          <div className="space-y-10">
            {/* Profiles Section */}
            {profiles.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="bg-[#181818] rounded-xl p-3.5 sm:p-4 mb-4 flex items-center justify-between border border-[#262626]">
                  <h2 className="text-base font-semibold text-[#f1f1f1] flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
                      <FaUser size={13} />
                    </div>
                    <span>Profiles</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#aaaaaa] font-medium">
                      {profiles.length}
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profiles.map((profile, index) => (
                    <SearchProfileCard
                      key={profile._id}
                      profile={profile}
                      index={index}
                      highlightSearchTerm={highlightSearchTerm}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Filtered Clips Section */}
            {(seasonFilter || yearFilter) && clips.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="bg-[#181818] rounded-xl p-3.5 sm:p-4 mb-4 flex items-center justify-between border border-[#262626] flex-wrap gap-2">
                  <h2 className="text-base font-semibold text-[#f1f1f1] flex items-center gap-2.5 flex-wrap">
                    <div className="w-7 h-7 rounded-lg bg-[#f23030] text-white flex items-center justify-center">
                      <FaSearch size={12} />
                    </div>
                    <span>Filtered Clips</span>
                    {seasonFilter && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#121212] text-[#f1f1f1] border border-[#2a2a2a] font-medium flex items-center gap-1.5">
                        {getSeasonIcon(seasonFilter)}
                        <span className="capitalize">{seasonFilter}</span>
                      </span>
                    )}
                    {yearFilter && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#aaaaaa] font-medium">
                        {yearFilter}
                      </span>
                    )}
                    <span className="text-xs text-[#717171] font-normal">({clips.length} found)</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {clips.map((clip, index) => (
                    <SearchClipCard
                      key={clip._id}
                      clip={clip}
                      index={index}
                      highlightSearchTerm={highlightSearchTerm}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {/* General Clips Section (when seasonal buckets are empty but clips were returned) */}
            {!seasonFilter && !yearFilter && !currentSeasonClips.length && !Object.keys(otherSeasonsClips).length && clips.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="bg-[#181818] rounded-xl p-3.5 sm:p-4 mb-4 flex items-center justify-between border border-[#262626]">
                  <h2 className="text-base font-semibold text-[#f1f1f1] flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#f23030] text-white flex items-center justify-center">
                      <FaSearch size={12} />
                    </div>
                    <span>Clips</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#aaaaaa] font-medium">
                      {clips.length}
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {clips.map((clip, index) => (
                    <SearchClipCard
                      key={clip._id}
                      clip={clip}
                      index={index}
                      highlightSearchTerm={highlightSearchTerm}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Current Season Clips */}
            {!seasonFilter && !yearFilter && currentSeasonClips.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="bg-[#181818] rounded-xl p-3.5 sm:p-4 mb-4 flex items-center justify-between border border-[#262626]">
                  <h2 className="text-base font-semibold text-[#f1f1f1] flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#121212] border border-[#2a2a2a] flex items-center justify-center">
                      {getSeasonIcon(currentSeason.season)}
                    </div>
                    <span className="capitalize">
                      {currentSeason.season} {currentSeason.year}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f23030]/15 text-[#f23030] border border-[#f23030]/30 font-medium">
                      Current Season ({currentSeasonClips.length})
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {currentSeasonClips.slice(0, currentSeasonDisplayCount).map((clip, index) => (
                    <SearchClipCard
                      key={clip._id}
                      clip={clip}
                      index={index}
                      highlightSearchTerm={highlightSearchTerm}
                    />
                  ))}
                </div>
                {currentSeasonClips.length > currentSeasonDisplayCount && (
                  <div className="flex justify-center mt-6">
                    <button
                      type="button"
                      onClick={() => setCurrentSeasonDisplayCount((prev) => prev + 8)}
                      className="px-6 py-2 rounded-full text-xs font-semibold bg-[#1e1e1e] hover:bg-[#282828] text-[#f1f1f1] border border-[#2e2e2e] transition-colors"
                    >
                      Show More Clips
                    </button>
                  </div>
                )}
              </motion.section>
            )}

            {/* Other / Past Seasons Accordion */}
            {!seasonFilter && !yearFilter && Object.keys(otherSeasonsClips).length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#717171] px-1">
                  Past Seasons
                </div>
                {Object.entries(otherSeasonsClips).map(([seasonKey, seasonData]) => (
                  <motion.section
                    key={seasonKey}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSeasonExpansion(seasonKey)}
                      className="w-full bg-[#181818] hover:bg-[#1e1e1e] rounded-xl p-3.5 sm:p-4 flex items-center justify-between border border-[#262626] hover:border-[#383838] text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#121212] border border-[#2a2a2a] flex items-center justify-center">
                          {getSeasonIcon(seasonData.season)}
                        </div>
                        <h3 className="text-sm font-semibold text-[#f1f1f1] capitalize">
                          {seasonData.season} {seasonData.year}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#aaaaaa] font-medium">
                          {seasonData.clips.length} clips
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-[#121212] border border-[#2a2a2a] flex items-center justify-center text-[#aaaaaa]">
                        {expandedSeasons.has(seasonKey) ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                      </div>
                    </button>
                    {expandedSeasons.has(seasonKey) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      >
                        {seasonData.clips.map((clip, index) => (
                          <SearchClipCard
                            key={clip._id}
                            clip={clip}
                            index={index}
                            highlightSearchTerm={highlightSearchTerm}
                          />
                        ))}
                      </motion.div>
                    )}
                  </motion.section>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Empty / Initial State */
          <div className="bg-[#181818] rounded-xl border border-[#262626] p-10 sm:p-12 text-center max-w-md mx-auto my-8 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#f23030] flex items-center justify-center mx-auto mb-3.5">
              <FaSearch size={20} />
            </div>
            <h3 className="text-base font-semibold text-[#f1f1f1] mb-1.5">
              {searchTerm ? 'No results found' : 'Search ClipSesh'}
            </h3>
            <p className="text-xs text-[#aaaaaa] leading-relaxed">
              {searchTerm
                ? `We couldn't find any results matching "${searchTerm}". Try adjusting your keywords or filters.`
                : 'Search across clip titles, streamers, submitters, or community profiles.'}
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ClipSearch;
