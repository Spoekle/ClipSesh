import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft,
  FaSearch,
  FaDownload,
  FaFilm,
  FaCalendarAlt,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { NavLink } from '@/lib/routerCompat';
import debounce from 'lodash.debounce';
import { ArchiveSeasonSection } from '../../../types/clipTypes';
import { Clip, User, Rating } from '../../../types/adminTypes';
import { getClips, getClipFilterOptions } from '../../../services/clipService';
import { getSeasonDateRange } from '../../../utils/seasonHelpers';
import ClipItem from '../../Clips/ClipGrid/components/ClipItem';

interface SeasonClipsViewProps {
  section: ArchiveSeasonSection;
  onBack: () => void;
  onSelectClip: (clipId: string) => void;
  user: User | null;
  ratings?: Record<string, Rating>;
}

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const SeasonClipsView: React.FC<SeasonClipsViewProps> = ({
  section,
  onBack,
  onSelectClip,
  user,
  ratings = {},
}) => {
  const dateRange = getSeasonDateRange(section.season, section.year);

  // Query and filter states
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [streamerFilter, setStreamerFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'views' | 'upvotes'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState<number>(1);
  const limit = 12;

  // Data states
  const [clips, setClips] = useState<Clip[]>([]);
  const [totalClips, setTotalClips] = useState<number>(section.clipCount);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [streamers, setStreamers] = useState<string[]>([]);

  // Fetch streamers for dropdown
  useEffect(() => {
    let isMounted = true;
    const loadStreamers = async () => {
      try {
        const options = await getClipFilterOptions();
        if (isMounted && options && options.streamers) {
          setStreamers(options.streamers);
        }
      } catch (err) {
        console.warn('Failed to load filter options:', err);
      }
    };
    loadStreamers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced search commit
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    debouncedSearchRef.current = debounce((val: string) => {
      setSearchTerm(val.trim());
      setPage(1);
    }, 350);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    debouncedSearchRef.current?.(val);
  };

  const handleClearSearch = () => {
    debouncedSearchRef.current?.cancel();
    setSearchInput('');
    setSearchTerm('');
    setPage(1);
  };

  // Fetch clips for this season
  useEffect(() => {
    let isMounted = true;
    const fetchSeasonClips = async () => {
      setLoading(true);
      try {
        const response = await getClips({
          season: section.season,
          year: section.year,
          search: searchTerm || undefined,
          streamer: streamerFilter || undefined,
          sortBy,
          sortOrder,
          page,
          limit,
          archived: 'all',
          includeRatings: true,
        });

        if (isMounted) {
          setClips(response.clips || []);
          setTotalClips(response.total ?? 0);
          setTotalPages(response.pages || Math.max(1, Math.ceil((response.total ?? 0) / limit)));
        }
      } catch (err) {
        console.error('Error fetching season clips:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSeasonClips();
    return () => {
      isMounted = false;
    };
  }, [section.season, section.year, searchTerm, streamerFilter, sortBy, sortOrder, page]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] pb-24">
      {/* CC Page Header Container (1200px centered) */}
      <div className="relative w-full overflow-hidden select-none">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
          {/* Breadcrumbs (matching CC default.vue) */}
          <nav className="flex items-center gap-1.5 text-sm text-[#b3b3b3] mb-2">
            <NavLink to="/" className="hover:text-white transition-colors">
              Home
            </NavLink>
            <span className="text-[#626262] select-none">/</span>
            <button
              type="button"
              onClick={onBack}
              className="hover:text-white transition-colors cursor-pointer"
            >
              The ClipVault
            </button>
            <span className="text-[#626262] select-none">/</span>
            <span className="text-white font-medium">{section.season} {section.year}</span>
          </nav>

          {/* Title row with signature CC Red Underline */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="relative pb-3 w-fit">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight uppercase">
                  {section.season} {section.year}
                </h1>
                {/* CC Red Bar: width 60%, height 2.5px */}
                <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-[#f23030] rounded-full" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-[#b3b3b3]">
                <span>
                  Season Window: <strong className="text-white font-medium">{dateRange.fullFormatted}</strong>
                </span>
                {section.isCurrent && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-[5px] bg-[#f23030]/15 text-[#f23030] border border-[#f23030]/30 uppercase tracking-wider">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Right Badges & Download Zip Button */}
            <div className="flex items-center gap-2.5 pb-1 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-[#181818] border border-[#2a2a2a] text-[#e6e6e6]">
                {totalClips.toLocaleString()} clips
              </span>
              {section.zip && (
                <a
                  href={section.zip.url}
                  download={section.zip.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-xs font-medium transition-colors shrink-0 shadow-xs"
                  title={`Download batch archive: ${section.zip.name}`}
                >
                  <FaDownload size={10} />
                  <span>Zip ({formatBytes(section.zip.size)})</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 grow flex flex-col">
        {/* In-season Filter Bar */}
        <div className="sticky top-14 z-10 bg-[#141414]/95 backdrop-blur-md rounded-2xl border border-[#262626] mb-6 p-3 sm:p-3.5 shadow-md select-none">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-sm">
              <input
                type="text"
                className="w-full pl-9 pr-8 py-2 bg-[#0e0e0e] border border-[#2a2a2a] focus:border-neutral-500 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
                placeholder="Search clips or streamers..."
                value={searchInput}
                onChange={handleSearchChange}
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs" />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  title="Clear filter"
                >
                  <FaTimes size={11} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {streamers.length > 0 && (
                <div className="relative">
                  <select
                    value={streamerFilter}
                    onChange={(e) => {
                      setStreamerFilter(e.target.value);
                      setPage(1);
                    }}
                    className="appearance-none pl-3 pr-8 py-2 bg-[#0e0e0e] hover:bg-[#181818] border border-[#2a2a2a] focus:border-neutral-500 rounded-xl text-xs sm:text-sm text-neutral-200 focus:outline-none cursor-pointer transition-colors"
                  >
                    <option value="">All Streamers</option>
                    {streamers.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative">
                <select
                  value={`${sortBy}_${sortOrder}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'upvotes_desc') {
                      setSortBy('upvotes');
                      setSortOrder('desc');
                    } else if (val === 'createdAt_asc') {
                      setSortBy('createdAt');
                      setSortOrder('asc');
                    } else {
                      setSortBy('createdAt');
                      setSortOrder('desc');
                    }
                    setPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2 bg-[#0e0e0e] hover:bg-[#181818] border border-[#2a2a2a] focus:border-neutral-500 rounded-xl text-xs sm:text-sm text-neutral-200 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="createdAt_desc">Upload Date (Desc)</option>
                  <option value="createdAt_asc">Upload Date (Asc)</option>
                  <option value="upvotes_desc">Most Upvoted</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden bg-[#181818] border border-[#262626] animate-pulse h-64"
              >
                <div className="aspect-video bg-[#222222]" />
                <div className="p-3.5 space-y-2.5">
                  <div className="h-3.5 bg-[#262626] rounded-sm w-3/4" />
                  <div className="h-3 bg-[#222222] rounded-sm w-1/2" />
                  <div className="h-2.5 bg-[#1f1f1f] rounded-sm w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : clips.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {clips.map((clip) => (
                <div key={clip._id} className="h-full">
                  <ClipItem
                    clip={clip}
                    user={user}
                    ratings={ratings}
                    setExpandedClip={(clipId) => onSelectClip(clipId)}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 180, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#181818] border border-[#2e2e2e] text-xs font-semibold text-[#cccccc] hover:text-white hover:bg-[#222222] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
                >
                  <FaChevronLeft size={10} />
                  <span>Previous</span>
                </button>

                <div className="px-4 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs font-mono text-[#aaaaaa]">
                  Page <strong className="text-white">{page}</strong> of{' '}
                  <strong className="text-white">{totalPages}</strong>
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 180, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#181818] border border-[#2e2e2e] text-xs font-semibold text-[#cccccc] hover:text-white hover:bg-[#222222] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <FaChevronRight size={10} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-[#141414] border border-[#262626] rounded-2xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] flex items-center justify-center text-[#717171] mb-4">
              <FaFilm size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Clips Found</h3>
            <p className="text-xs sm:text-sm text-[#888888] max-w-md mb-5">
              {searchTerm || streamerFilter
                ? 'No clips in this season match your current search or filter criteria.'
                : 'There are currently no clips recorded in this seasonal archive.'}
            </p>
            {(searchTerm || streamerFilter) && (
              <button
                onClick={() => {
                  handleClearSearch();
                  setStreamerFilter('');
                }}
                className="px-4 py-2 rounded-xl bg-cc-red text-white text-xs font-bold hover:bg-cc-red-hover transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonClipsView;
