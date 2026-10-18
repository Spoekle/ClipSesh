'use client';

import { safeLocalStorage } from '@/utils/storage';
import React, { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNotification } from '@/context/AlertContext';

import ClipViewerContent from './components/ClipViewerContent';
import { ClipViewerHeader, Season } from './components/ClipViewerHeader';

import { useInfiniteClips, useClip } from '@/hooks/useClips';
import { useBulkRatings } from '@/hooks/useRatings';
import { useCombinedConfig } from '@/hooks/useConfig';
import { useCurrentUser } from '@/hooks/useUser';
import { ClipQueryParams } from '@/types/clipTypes';
import { Rating } from '@/types/adminTypes';
import { getCurrentSeason as getSeasonalInfo } from '@/lib/seasonHelpers';

const getCurrentSeason = (): Season => {
  const { season } = getSeasonalInfo();
  switch (season) {
    case 'spring':
      return 'Spring';
    case 'summer':
      return 'Summer';
    case 'fall':
      return 'Fall';
    case 'winter':
    default:
      return 'Winter';
  }
};

function ClipViewer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const clipId = typeof params?.clipId === 'string' ? params.clipId : undefined;
  const searchParams = useSearchParams();
  const sortOption = searchParams?.get('sort') || 'newest';
  const searchTerm = searchParams?.get('q') || '';
  const filterStreamer = searchParams?.get('streamer') || '';

  const setSearchParams = useCallback((newParams: URLSearchParams, options?: { replace?: boolean }) => {
    const url = `${pathname || '/clips'}?${newParams.toString()}`;
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router, pathname]);

  const { showError } = useNotification();

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { isLoading: configLoading } = useCombinedConfig(user);

  const [filterRatedClips, setFilterRatedClips] = useState<boolean>(() => {
    const storedValue = safeLocalStorage.getItem('filterRatedClips');
    return storedValue === 'true';
  });

  const [filterDeniedClips, setFilterDeniedClips] = useState<boolean>(() => {
    const storedValue = safeLocalStorage.getItem('filterDeniedClips');
    return storedValue === 'true';
  });

  const [expandedClip, setExpandedClip] = useState<string | null>(clipId || null);

  const buildClipParams = useCallback((): ClipQueryParams => {
    const queryParams: ClipQueryParams = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    if (sortOption.includes('_')) {
      const [field, direction] = sortOption.split('_');
      queryParams.sortBy = field;
      queryParams.sortOrder = direction === 'asc' ? 'asc' : 'desc';
    } else {
      switch (sortOption) {
        case 'newest':
          queryParams.sortBy = 'createdAt';
          queryParams.sortOrder = 'desc';
          break;
        case 'mostViewed':
          queryParams.sortBy = 'views';
          queryParams.sortOrder = 'desc';
          break;
        case 'oldest':
          queryParams.sortBy = 'createdAt';
          queryParams.sortOrder = 'asc';
          break;
        case 'highestUpvotes':
          queryParams.sortBy = 'upvotes';
          queryParams.sortOrder = 'desc';
          break;
        case 'highestDownvotes':
          queryParams.sortBy = 'downvotes';
          queryParams.sortOrder = 'desc';
          break;
        case 'lowestRatio':
          queryParams.sortBy = 'ratio';
          queryParams.sortOrder = 'asc';
          break;
        case 'highestRatio':
          queryParams.sortBy = 'ratio';
          queryParams.sortOrder = 'desc';
          break;
        case 'highestAverageRating':
          queryParams.sortBy = 'averageRating';
          queryParams.sortOrder = 'desc';
          break;
        case 'mostRated':
          queryParams.sortBy = 'ratingCount';
          queryParams.sortOrder = 'desc';
          break;
        case 'mostDenied':
          queryParams.sortBy = 'denyCount';
          queryParams.sortOrder = 'desc';
          break;
      }
    }

    if (filterStreamer) queryParams.streamer = filterStreamer;
    if (searchTerm) queryParams.search = searchTerm;
    if (filterRatedClips && user?._id) queryParams.excludeRatedByUser = user._id;
    if (filterDeniedClips && user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
      queryParams.excludeDeniedClips = true;
    }
    if (user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
      queryParams.includeRatings = true;
    }

    return queryParams;
  }, [sortOption, filterStreamer, searchTerm, filterRatedClips, filterDeniedClips, user]);

  const {
    data: clipsData,
    isLoading: clipsLoading,
    error: clipsError,
    refetch: refetchClips,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteClips(buildClipParams());

  const {
    data: currentClip,
    isLoading: isClipLoading
  } = useClip(expandedClip || '');

  const { data: currentClipRatings } = useBulkRatings(
    expandedClip ? [expandedClip] : []
  );

  const unratedClips = clipsData?.pages.flatMap(page => page.clips || []).filter((clip): clip is NonNullable<typeof clip> => Boolean(clip)) || [];

  const ratings: Record<string, Rating> = clipsData?.pages.reduce((allRatings, page) => {
    return { ...allRatings, ...(page.ratings || {}) };
  }, {} as Record<string, Rating>) || (currentClipRatings || {});

  const totalClips = clipsData?.pages[0]?.total || 0;
  const isLoggedIn = Boolean(user);
  const isLoading = clipsLoading || userLoading || configLoading;

  const currentSeason = useMemo(() => getCurrentSeason(), []);

  useEffect(() => {
    if (clipsError) {
      showError("Could not load clips. Please try again later.");
    }
  }, [clipsError, showError]);

  const handleSetExpandedClip = useCallback((idOrFn: React.SetStateAction<string | null>) => {
    setExpandedClip((prev) => {
      const nextId = typeof idOrFn === 'function' ? idOrFn(prev) : idOrFn;
      if (nextId) {
        const currentQuery = searchParams?.toString() || '';
        const target = `/clips/${nextId}`;
        router.push(target + (currentQuery ? `?${currentQuery}` : ''));
      }
      return nextId;
    });
  }, [router, searchParams]);

  useEffect(() => {
    if (clipId && clipId !== expandedClip) {
      setExpandedClip(clipId);
    }
  }, [clipId, expandedClip]);

  useEffect(() => {
    safeLocalStorage.setItem('filterRatedClips', filterRatedClips.toString());
  }, [filterRatedClips]);

  useEffect(() => {
    safeLocalStorage.setItem('filterDeniedClips', filterDeniedClips.toString());
  }, [filterDeniedClips]);

  useEffect(() => {
    document.title = expandedClip && currentClip ? `${currentClip.title} • ClipSesh` : 'Clips • ClipSesh';
  }, [expandedClip, currentClip]);

  const triggerClipRefetch = useCallback(async () => {
    await refetchClips();
  }, [refetchClips]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="min-h-[calc(100vh-80px)] text-foreground flex flex-col bg-background transition-colors"
    >
      {/* Seasonal header - only show on clips grid list, NOT when viewing an individual clip */}
      {!expandedClip && (
        <ClipViewerHeader
          season={currentSeason}
          totalClips={totalClips}
          isFiltered={Boolean(searchTerm || filterStreamer || filterRatedClips || filterDeniedClips)}
        />
      )}

      {/* Main content container */}
      <div className={expandedClip ? "w-full grow flex flex-col" : "w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-6 overflow-x-clip grow flex flex-col"}>
        <ClipViewerContent
          expandedClip={expandedClip}
          setExpandedClip={handleSetExpandedClip}
          isClipLoading={isClipLoading}
          currentClip={currentClip || null}
          isLoggedIn={isLoggedIn}
          user={user || null}
          fetchClipsAndRatings={triggerClipRefetch}
          ratings={ratings}
          unratedClips={unratedClips}
          sortOptionState={sortOption}
          setSortOptionState={(option: string) => {
            const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
            newSearchParams.set('sort', option);
            newSearchParams.set('page', '1');
            setSearchParams(newSearchParams, { replace: true });
          }}
          searchTerm={searchTerm}
          setSearchTerm={(term: string) => {
            const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
            if (term) {
              newSearchParams.set('q', term);
            } else {
              newSearchParams.delete('q');
            }
            setSearchParams(newSearchParams);
          }}
          filterStreamer={filterStreamer}
          setFilterStreamer={(streamer: string) => {
            const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
            if (streamer) {
              newSearchParams.set('streamer', streamer);
            } else {
              newSearchParams.delete('streamer');
            }
            setSearchParams(newSearchParams);
          }}
          filterRatedClips={filterRatedClips}
          setFilterRatedClips={setFilterRatedClips}
          filterDeniedClips={filterDeniedClips}
          setFilterDeniedClips={setFilterDeniedClips}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          useInfiniteScroll={true}
          currentPage={1}
          setCurrentPage={() => { }}
          setSearchParams={setSearchParams}
          isLoading={isLoading}
          config={{
            clipAmount: totalClips,
            itemsPerPage: 12
          }}
          itemsPerPage={12}
          sortOption={sortOption}
        />
      </div>
    </motion.div>
  );
}

export default function ClipsPage() {
  return (
    <Suspense fallback={null}>
      <ClipViewer />
    </Suspense>
  );
}