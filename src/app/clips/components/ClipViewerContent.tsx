'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import ClipContent from './ClipView/Index';
import ClipFilterBar from './ClipGrid/components/ClipFilterBar';
import ClipGrid from './ClipGrid/Index';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { FaSearch } from 'react-icons/fa';
import { Clip, User, Rating } from '@/types/adminTypes';
import { getClipFilterOptions } from '@/services/clipService';
import { ClipViewerHeader } from './ClipViewerHeader';

export { ClipViewerHeader };
export type { Season, ClipViewerHeaderProps } from './ClipViewerHeader';

interface ClipViewerContentProps {
  expandedClip: string | null;
  setExpandedClip: React.Dispatch<React.SetStateAction<string | null>>;
  isClipLoading: boolean;
  currentClip: Clip | null;
  isLoggedIn: boolean;
  user: User | null;
  fetchClipsAndRatings: (user: User | null) => Promise<void>;
  ratings: Record<string, Rating>;
  unratedClips: Clip[];
  sortOptionState: string;
  setSortOptionState: (option: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStreamer: string;
  setFilterStreamer: (streamer: string) => void;
  filterRatedClips: boolean;
  setFilterRatedClips: (rated: boolean) => void;
  filterDeniedClips: boolean;
  setFilterDeniedClips: (denied: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  setSearchParams: (params: URLSearchParams, options?: { replace?: boolean }) => void;
  isLoading: boolean;
  config: {
    clipAmount: number;
    itemsPerPage: number;
  };
  itemsPerPage: number;
  sortOption: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  useInfiniteScroll?: boolean;
}

const ClipViewerContent: React.FC<ClipViewerContentProps> = ({
  expandedClip,
  setExpandedClip,
  isClipLoading,
  currentClip,
  isLoggedIn,
  user,
  fetchClipsAndRatings,
  ratings,
  unratedClips,
  sortOptionState,
  setSortOptionState,
  searchTerm,
  setSearchTerm,
  filterStreamer,
  setFilterStreamer,
  filterRatedClips,
  setFilterRatedClips,
  filterDeniedClips,
  setFilterDeniedClips,
  currentPage,
  setCurrentPage,
  setSearchParams,
  isLoading,
  config,
  itemsPerPage,
  sortOption,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  useInfiniteScroll = false,
}) => {
  const [allStreamers, setAllStreamers] = useState<string[]>([]);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (fetchAttempted.current) {
      return;
    }

    const fetchStreamers = async () => {
      fetchAttempted.current = true;
      try {
        const filterOptions = await getClipFilterOptions();
        if (filterOptions && filterOptions.streamers) {
          setAllStreamers(filterOptions.streamers);
        }
      } catch (error: unknown) {
        console.error('Error fetching streamers:', error);
        const uniqueStreamers = [...new Set(unratedClips.map((clip) => clip.streamer))];
        setAllStreamers(uniqueStreamers);
      }
    };

    fetchStreamers();
  }, [unratedClips]);

  const streamers = useMemo(() => {
    if (allStreamers.length > 0) {
      return allStreamers;
    }
    return [...new Set(unratedClips.map((clip) => clip.streamer))];
  }, [allStreamers, unratedClips]);

  const filteredClips = unratedClips;

  const totalPages = useMemo(() => {
    const totalClips = config.clipAmount || filteredClips.length;
    return Math.max(1, Math.ceil(totalClips / itemsPerPage));
  }, [config.clipAmount, filteredClips.length, itemsPerPage]);

  const handleFilterReset = () => {
    setSearchTerm('');
    setFilterStreamer('');
    setCurrentPage(1);

    const userData = user;
    fetchClipsAndRatings(userData);
  };

  const handleSortChange = (newSortOption: string) => {
    setSortOptionState(newSortOption);
    const userData = user;
    fetchClipsAndRatings(userData);
  };

  const paginate = (pageNumber: number) => {
    const newParams = new URLSearchParams();
    newParams.append('sort', sortOption);
    newParams.append('page', pageNumber.toString());
    if (searchTerm) newParams.append('q', searchTerm);
    if (filterStreamer) newParams.append('streamer', filterStreamer);

    setSearchParams(newParams, { replace: true });

    setCurrentPage(pageNumber);

    document.querySelector('.clip-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (expandedClip) {
    if (isClipLoading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-primary"></div>
        </div>
      );
    }
    if (currentClip) {
      return (
        <ClipContent
          clip={currentClip}
          setExpandedClip={setExpandedClip}
          user={user}
          fetchClipsAndRatings={fetchClipsAndRatings}
          ratings={ratings}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-cc-card p-8 rounded-2xl shadow-sm border border-border">
        <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground text-3xl mb-4 shadow-inner">
          <FaSearch />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Clip Not Found</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          The clip you're looking for may have been deleted or doesn't exist.
        </p>
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Clips', path: '/clips' },
            { label: 'Not Found' },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <ClipFilterBar
        sortOptionState={sortOptionState}
        setSortOptionState={setSortOptionState}
        handleSortChange={handleSortChange}
        filterRatedClips={filterRatedClips}
        setFilterRatedClips={setFilterRatedClips}
        filterDeniedClips={filterDeniedClips}
        setFilterDeniedClips={setFilterDeniedClips}
        user={user}
        setExpandedClip={setExpandedClip}
        isLoggedIn={isLoggedIn}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStreamer={filterStreamer}
        setFilterStreamer={setFilterStreamer}
        streamers={streamers}
        handleFilterReset={handleFilterReset}
        fetchClipsAndRatings={fetchClipsAndRatings}
        setSearchParams={setSearchParams}
      />

      <ClipGrid
        isLoading={isLoading}
        filteredClips={filteredClips}
        currentClips={filteredClips}
        user={user}
        ratings={ratings}
        config={config}
        filterRatedClips={filterRatedClips}
        filterDeniedClips={filterDeniedClips}
        setExpandedClip={setExpandedClip}
        currentPage={currentPage}
        totalPages={totalPages}
        paginate={paginate}
        itemsPerPage={itemsPerPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        useInfiniteScroll={useInfiniteScroll}
      />
    </div>
  );
};

export default ClipViewerContent;
