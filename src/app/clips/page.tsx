'use client';

import { safeLocalStorage } from '@/utils/storage';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNotification } from '@/context/AlertContext';

import ClipViewerContent, { ClipViewerHeader } from './components/ClipViewerContent';

import { useInfiniteClips, useClip } from '@/hooks/useClips';
import { useBulkRatings } from '@/hooks/useRatings';
import { useCombinedConfig } from '@/hooks/useConfig';
import { useCurrentUser } from '@/hooks/useUser';

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
  const [progress, setProgress] = useState<number>(0);
  const [seasonInfo, setSeasonInfo] = useState<{ season: string }>({ season: '' });

  const buildClipParams = useCallback(() => {
    const params: any = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      sortOption: sortOption,
    };

    if (sortOption.includes('_')) {
      const [field, direction] = sortOption.split('_');
      params.sortBy = field;
      params.sortOrder = direction;
    } else {
      switch (sortOption) {
        case 'newest':
          params.sortBy = 'createdAt';
          params.sortOrder = 'desc';
          break;
        case 'mostViewed':
          params.sortBy = 'views';
          params.sortOrder = 'desc';
          break;
        case 'oldest':
          params.sortBy = 'createdAt';
          params.sortOrder = 'asc';
          break;
        case 'highestUpvotes':
          params.sortBy = 'upvotes';
          params.sortOrder = 'desc';
          break;
        case 'highestDownvotes':
          params.sortBy = 'downvotes';
          params.sortOrder = 'desc';
          break;
        case 'lowestRatio':
          params.sortBy = 'ratio';
          params.sortOrder = 'asc';
          break;
        case 'highestRatio':
          params.sortBy = 'ratio';
          params.sortOrder = 'desc';
          break;
        case 'highestAverageRating':
          params.sortBy = 'averageRating';
          params.sortOrder = 'desc';
          break;
        case 'mostRated':
          params.sortBy = 'ratingCount';
          params.sortOrder = 'desc';
          break;
        case 'mostDenied':
          params.sortBy = 'denyCount';
          params.sortOrder = 'desc';
          break;
      }
    }

    if (filterStreamer) params.streamer = filterStreamer;
    if (searchTerm) params.search = searchTerm;
    if (filterRatedClips && user?._id) params.excludeRatedByUser = user._id;
    if (filterDeniedClips && user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
      params.excludeDeniedClips = true;
    }
    if (user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
      params.includeRatings = true;
    }

    return params;
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

  const ratings = clipsData?.pages.reduce((allRatings, page) => {
    return { ...allRatings, ...(page.ratings || {}) };
  }, {} as Record<string, any>) || (currentClipRatings || {});

  const totalClips = clipsData?.pages[0]?.total || 0;
  const isLoggedIn = Boolean(user);
  const isLoading = clipsLoading || userLoading || configLoading;

  const getSeason = useCallback(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    let season = '';

    if ((month === 3 && day >= 20) || (month > 3 && month < 6) || (month === 6 && day <= 20)) {
      season = 'Spring';
    } else if ((month === 6 && day >= 21) || (month > 6 && month < 9) || (month === 9 && day <= 20)) {
      season = 'Summer';
    } else if ((month === 9 && day >= 21) || (month > 9 && month < 12) || (month === 12 && day <= 20)) {
      season = 'Fall';
    } else {
      season = 'Winter';
    }

    setSeasonInfo({ season });
  }, []);

  useEffect(() => {
    if (clipsError) {
      showError("Could not load clips. Please try again later.");
    }
  }, [clipsError, showError]);

  useEffect(() => {
    getSeason();
  }, [getSeason]);

  useEffect(() => {
    if (isLoading) {
      setProgress(50);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

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
      className="min-h-[calc(100vh-80px)] text-[#e6e6e6] flex flex-col bg-[#0b0b0b] transition-colors"
    >
      {/* Seasonal header - only show on clips grid list, NOT when viewing an individual clip */}
      {!expandedClip && (
        <ClipViewerHeader
          season={(seasonInfo.season as 'Winter' | 'Spring' | 'Summer' | 'Fall') || 'Winter'}
          totalClips={totalClips}
          isFiltered={!!(searchTerm || filterStreamer || filterRatedClips || filterDeniedClips)}
        />
      )}

      {/* Main content container */}
      <div className={expandedClip ? "w-full grow flex flex-col" : "w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-6 grow flex flex-col"}>
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