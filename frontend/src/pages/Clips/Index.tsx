import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/AlertContext';
import LoadingBar from 'react-top-loading-bar';

import ClipViewerHeader from './components/ClipViewerHeader';
import ClipViewerContent from './components/ClipViewerContent';

import { useInfiniteClips, useClip } from '../../hooks/useClips';
import { useBulkRatings } from '../../hooks/useRatings';
import { useCombinedConfig } from '../../hooks/useConfig';
import { useCurrentUser } from '../../hooks/useUser';

function ClipViewer() {
  const { clipId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortOption = searchParams.get('sort') || 'newest';
  const searchTerm = searchParams.get('q') || '';
  const filterStreamer = searchParams.get('streamer') || '';

  const { showError } = useNotification();

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { isLoading: configLoading } = useCombinedConfig(user);
  
  const [filterRatedClips, setFilterRatedClips] = useState<boolean>(() => {
    const storedValue = localStorage.getItem('filterRatedClips');
    return storedValue === 'true';
  });
  
  const [filterDeniedClips, setFilterDeniedClips] = useState<boolean>(() => {
    const storedValue = localStorage.getItem('filterDeniedClips');
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

  useEffect(() => {
    if (clipId && clipId !== expandedClip) {
      setExpandedClip(clipId);
    }
  }, [clipId, expandedClip]);

  useEffect(() => {
    if (expandedClip && expandedClip !== clipId) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      const path = expandedClip === 'new' ? '/clips/new' : `/clips/${expandedClip}`;
      const queryString = newSearchParams.toString();
      const url = path + (queryString ? `?${queryString}` : '');
      window.history.pushState({}, '', url);
    }
  }, [expandedClip, clipId, searchParams]);

  useEffect(() => {
    localStorage.setItem('filterRatedClips', filterRatedClips.toString());
  }, [filterRatedClips]);

  useEffect(() => {
    localStorage.setItem('filterDeniedClips', filterDeniedClips.toString());
  }, [filterDeniedClips]);

  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (sortOption !== 'newest') newSearchParams.set('sort', sortOption);
    if (searchTerm) newSearchParams.set('q', searchTerm);
    if (filterStreamer) newSearchParams.set('streamer', filterStreamer);
    if (filterRatedClips && user?._id) newSearchParams.set('excludeRatedByUser', user._id);
    if (filterDeniedClips && user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
      newSearchParams.set('excludeDeniedClips', 'true');
    }
    
    setSearchParams(newSearchParams, { replace: true });
  }, [sortOption, searchTerm, filterStreamer, filterRatedClips, filterDeniedClips, user, setSearchParams]);

  const triggerClipRefetch = useCallback(async () => {
    await refetchClips();
  }, [refetchClips]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200"
    >
      <Helmet>
        <title>Clip Viewer | ClipSesh</title>
        <meta
          name="description"
          content="Discover, watch, and rate the best gaming clips on ClipSesh."
        />
      </Helmet>

      <div className="w-full">
        <LoadingBar
          color="#3b82f6"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
          shadow={true}
          height={3}
        />
      </div>

      {/* Seasonal header */}
      <ClipViewerHeader 
        season={(seasonInfo.season as 'Winter' | 'Spring' | 'Summer' | 'Fall') || 'Winter'} 
        totalClips={totalClips}
        isFiltered={!!(searchTerm || filterStreamer || filterRatedClips || filterDeniedClips)}
      />

      {/* Main content container */}
      <div className="container mx-auto px-4 py-8 bg-neutral-200 dark:bg-neutral-900 transition duration-200">
        <ClipViewerContent
          expandedClip={expandedClip}
          setExpandedClip={setExpandedClip}
          isClipLoading={isClipLoading}
          currentClip={currentClip || null}
          isLoggedIn={isLoggedIn}
          user={user || null}
          fetchClipsAndRatings={triggerClipRefetch}
          ratings={ratings}
          unratedClips={unratedClips}
          sortOptionState={sortOption}
          setSortOptionState={(option: string) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.set('sort', option);
            setSearchParams(newSearchParams);
          }}
          searchTerm={searchTerm}
          setSearchTerm={(term: string) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            if (term) {
              newSearchParams.set('q', term);
            } else {
              newSearchParams.delete('q');
            }
            setSearchParams(newSearchParams);
          }}
          filterStreamer={filterStreamer}
          setFilterStreamer={(streamer: string) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());
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
          setCurrentPage={() => {}}
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

export default ClipViewer;
