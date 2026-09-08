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
      {/* Top Banner / Breadcrumb Area */}
      <div className="border-b border-[#262626] bg-[#141414]/95 backdrop-blur-md sticky top-14 z-20 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Back button & Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-[#2a2a2a] text-[#f1f1f1] text-xs font-semibold border border-[#333333] transition-colors shrink-0"
              >
                <FaArrowLeft size={11} />
                <span>All Seasons</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-[#717171] truncate">
                <span>/</span>
                <span className="text-[#aaaaaa]">{section.year}</span>
                <span>/</span>
                <span className="text-white font-bold truncate">
                  {section.season} {section.year}
                </span>
              </div>
            </div>

            {/* Quick Zip Download Button (if ready) */}
            {section.zip && (
              <a
                href={section.zip.url}
                download={section.zip.name}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm shrink-0"
                title={`Download batch archive: ${section.zip.name}`}
              >
                <FaDownload size={12} />
                <span>Download Season Zip ({formatBytes(section.zip.size)})</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Hero Header for this season */}
      <div className="border-b border-[#262626] bg-[#121212] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-bold bg-cc-red/15 text-cc-red border border-cc-red/30 uppercase tracking-wider mb-2">
                <FaCalendarAlt size={11} />
                <span>Season Archive</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {section.season} {section.year} Archive
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#aaaaaa]">
                <span className="flex items-center gap-1.5 font-mono">
                  <FaFilm size={12} className="text-cc-red" />
                  <strong className="text-white font-bold">{totalClips}</strong> clips recorded
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <FaCalendarAlt size={11} className="text-neutral-400" />
                  <span>Submissions: <strong className="text-white font-medium">{dateRange.fullFormatted}</strong></span>
                </span>
                {section.isCurrent && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cc-red text-white">
                      Active
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* In-season Filter / Search Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search input */}
              <div className="relative min-w-[220px] sm:min-w-[260px]">
                <FaSearch
                  size={12}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717171] pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Filter clips or streamers..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-[#181818] border border-[#2e2e2e] focus:border-cc-red focus:ring-1 focus:ring-cc-red/40 rounded-xl text-[#f1f1f1] placeholder-[#717171] outline-hidden transition-colors"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717171] hover:text-white p-1"
                    title="Clear filter"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>

              {/* Streamer Dropdown */}
              {streamers.length > 0 && (
                <select
                  value={streamerFilter}
                  onChange={(e) => {
                    setStreamerFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl text-xs bg-[#181818] border border-[#2e2e2e] text-[#f1f1f1] outline-hidden focus:border-cc-red cursor-pointer"
                >
                  <option value="">All Streamers</option>
                  {streamers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort Dropdown */}
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
                className="px-3 py-2 rounded-xl text-xs bg-[#181818] border border-[#2e2e2e] text-[#f1f1f1] outline-hidden focus:border-cc-red cursor-pointer"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="upvotes_desc">Most Upvoted</option>
                <option value="createdAt_asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Clips Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
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
