import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/AlertContext';
import LoadingBar from 'react-top-loading-bar';

// Component imports
import ClipViewerHeader from './components/ClipViewerHeader';
import ClipViewerContent from './components/ClipViewerContent';

// Import shared types
import { User, Clip, Rating } from '../../types/adminTypes';

// Import services
import { getClips, getClipById } from '../../services/clipService';
import { getCombinedConfig } from '../../services/configService';
import { getCurrentUser } from '../../services/userService';
import { getBulkRatings } from '../../services/ratingService';

interface RatingMap {
  [clipId: string]: Rating;
}

interface Config {
  denyThreshold: number;
  allowedFileTypes: string[];
  clipAmount: number;
  itemsPerPage?: number;
}

function ClipViewer() {
  const { clipId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortOption = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const token = localStorage.getItem('token');

  // Use the notification system
  const { showError } = useNotification();

  // State management with proper types
  const [unratedClips, setUnratedClips] = useState<Clip[]>([]);
  const [filterRatedClips, setFilterRatedClips] = useState<boolean>(() => {
    // Initialize from localStorage with proper boolean conversion
    const storedValue = localStorage.getItem('filterRatedClips');
    return storedValue === 'true';
  });
  const [filterDeniedClips, setFilterDeniedClips] = useState<boolean>(() => {
    // Initialize from localStorage with proper boolean conversion
    const storedValue = localStorage.getItem('filterDeniedClips');
    return storedValue === 'true';
  });

  // These state variables are maintained for UI features that might use them later
  const [, setRatedClips] = useState<Clip[]>([]);
  const [, setDeniedClips] = useState<Clip[]>([]);
  const [ratings, setRatings] = useState<RatingMap>({});
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [expandedClip, setExpandedClip] = useState<string | null>(clipId || null);
  const [sortOptionState, setSortOptionState] = useState<string>(sortOption || 'newest');
  const [config, setConfig] = useState<Config>({
    denyThreshold: 3,
    allowedFileTypes: ['video/mp4', 'video/webm'],
    clipAmount: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [seasonInfo, setSeasonInfo] = useState<{ season: string }>({ season: '' });
  const [itemsPerPage] = useState<number>(12);
  const [isClipLoading, setIsClipLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('q') || '');
  const [filterStreamer, setFilterStreamer] = useState<string>(searchParams.get('streamer') || '');
  // Track if initial data load has happened
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  const [, setTotalPages] = useState<number>(1);
  // Define fetchConfig function with default values for when response data is undefined
  const fetchConfig = useCallback(async () => {
    try {
      setProgress(10);

      const configData = await getCombinedConfig(user);
        // Update total pages based on clipAmount for pagination
      if (configData.clipAmount) {
        const totalPagesCount = Math.ceil(configData.clipAmount / itemsPerPage);
        setTotalPages(totalPagesCount);
      }

      setConfig(configData);
      setProgress(30);
    } catch (error) {
      console.error('Error fetching config:', error);
      showError("Could not load configuration settings, using defaults");
    }
  }, [user, showError, itemsPerPage]);
  // Fetch user data
  const fetchUser = useCallback(async () => {
    if (token) {
      try {
        const userData = await getCurrentUser();
        setIsLoggedIn(true);
        setUser(userData);
        return userData;
      } catch (error) {
        console.error('Error fetching user:', error);
        setIsLoggedIn(false);
        setUser(null);
        return null;
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
      return null;
    }
  }, [token]);

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

    setSeasonInfo((prevSeasonInfo) => ({
      ...prevSeasonInfo,
      season,
    }));
  }, []);

  // Fetch clips and ratings - with fixed TypeScript types
  const fetchClipsAndRatings = useCallback(async (userData: User | null = null, filterRated: boolean | null = null, pageToFetch: number | null = null) => {
    // Use the passed userData or fall back to current user state if available
    const currentUser = userData || user;
    const shouldFilterRated = filterRated !== null ? filterRated : filterRatedClips;
    const pageNumber = pageToFetch !== null ? pageToFetch : currentPage;

    // Get current values from URL params to ensure we're using the most up-to-date values
    const currentSearchParams = new URLSearchParams(window.location.search);
    const currentSortOption = currentSearchParams.get('sort') || 'newest';
    const currentSearchTerm = currentSearchParams.get('q') || '';
    const currentFilterStreamer = currentSearchParams.get('streamer') || '';

    try {
      // Build query parameters for filtering, sorting and pagination
      const params = new URLSearchParams();
      params.append('page', pageNumber.toString());
      params.append('limit', itemsPerPage.toString());

      // Parse the new sort format: field_direction
      let sortBy = 'createdAt';
      let sortOrder = 'desc';

      if (currentSortOption.includes('_')) {
        const [field, direction] = currentSortOption.split('_');
        sortBy = field;
        sortOrder = direction;
      } else {
        // Handle legacy format for backward compatibility
        switch (currentSortOption) {
          case 'newest':
            sortBy = 'createdAt';
            sortOrder = 'desc';
            break;
          case 'oldest':
            sortBy = 'createdAt';
            sortOrder = 'asc';
            break;
          case 'highestUpvotes':
            sortBy = 'upvotes';
            sortOrder = 'desc';
            break;
          case 'highestDownvotes':
            sortBy = 'downvotes';
            sortOrder = 'desc';
            break;
          case 'lowestRatio':
            sortBy = 'ratio';
            sortOrder = 'asc';
            break;
          case 'highestRatio':
            sortBy = 'ratio';
            sortOrder = 'desc';
            break;
          case 'highestAverageRating':
            sortBy = 'averageRating';
            sortOrder = 'desc';
            break;
          case 'mostRated':
            sortBy = 'ratingCount';
            sortOrder = 'desc';
            break;
        }
      }

      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('sortOption', currentSortOption);

      // Add filter parameters if they exist
      if (currentFilterStreamer) {
        params.append('streamer', currentFilterStreamer);
      }

      if (currentSearchTerm) {
        params.append('search', currentSearchTerm);
      }

      // If filterRated is true and user is logged in, exclude clips rated by user
      if (shouldFilterRated && currentUser?._id) {
        params.append('excludeRatedByUser', currentUser._id);
      }      // Only include ratings for users with clipteam role or higher
      if (currentUser && (currentUser.roles?.includes('admin') || currentUser.roles?.includes('clipteam'))) {
        params.append('includeRatings', 'true');
      }

      // Get paginated clips with filters and sorting applied by the backend
      const clipResponse = await getClips(Object.fromEntries(params));// Process the response data
      if (clipResponse) {
        const { clips = [], total: totalClips, page: newCurrentPage, pages: newTotalPages } = clipResponse;

        // Update pagination state
        if (newTotalPages !== undefined) {
          setTotalPages(newTotalPages);
        }

        if (newCurrentPage !== undefined) {
          setCurrentPage(newCurrentPage);
        }        // Update config's clipAmount
        if (totalClips !== undefined) {
          setConfig(current => ({
            ...current,
            clipAmount: totalClips
          }));
        }

        // For now, let's check if ratings are included in the response in the future
        // but for now fetch them separately if user has permission
        if (currentUser && (currentUser.roles?.includes('admin') || currentUser.roles?.includes('clipteam'))) {
          const fetchRatings = async () => {
            try {
              // Only fetch ratings for the current page of clips
              const clipIds = clips.map((clip: Clip) => clip._id);
              const ratingsData = await getBulkRatings(clipIds);
              setRatings(ratingsData);
            } catch (error) {
              console.error('Error fetching ratings:', error);
            }
          };

          fetchRatings();
        }

        // Use the server-filtered clips directly
        setUnratedClips(clips);        // Even with server-side filtering, track which clips have been rated by the user for UI purposes
        if (currentUser && ratings && Object.keys(ratings).length > 0) {
          const rated: Clip[] = [];

          clips.forEach((clip: Clip) => {
            // Check if the user has rated this clip
            const clipRating = ratings[clip._id];
            if (clipRating && clipRating.ratings) {
              // Check each rating category (1-4 and deny)
              const allRatingCategories = ['1', '2', '3', '4', 'deny'] as const;

              for (const category of allRatingCategories) {
                const ratingUsers = clipRating.ratings[category] || [];
                if (ratingUsers.some((u: any) => u && u.userId === currentUser._id)) {
                  rated.push(clip);
                  break;
                }
              }
            }
          });

          setRatedClips(rated);
        } else {
          setRatedClips([]);
        }

        // Filter denied clips if user is authorized
        if (currentUser && (currentUser.roles?.includes('admin') || currentUser.roles?.includes('clipteam'))) {
          const denied: Clip[] = [];
          const threshold = config.denyThreshold || 3;

          clips.forEach((clip: Clip) => {
            const ratingData = ratings[clip._id];
            if (ratingData && ratingData.ratingCounts?.some(
              (rateData: { rating: string; count: number }) => rateData.rating === 'deny' && rateData.count >= threshold
            )) {
              denied.push(clip);
            }
          });

          setDeniedClips(denied);
        } else {
          setDeniedClips([]);
        }
      } else {
        // Handle empty response
        setUnratedClips([]);
        setRatedClips([]);
        setDeniedClips([]);
      }

    } catch (error) {
      console.error('Error in fetchClipsAndRatings:', error);
      showError("Could not load clips. Please try again later.");
      setUnratedClips([]);
      setRatedClips([]);
      setDeniedClips([]);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, token, config.denyThreshold, showError]);

  // Simplified effect for URL parameter changes
  useEffect(() => {
    if (initialDataLoaded) {
      // Debounce to avoid multiple rapid calls
      const timer = setTimeout(() => {
        fetchClipsAndRatings(user, filterRatedClips, currentPage);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentPage, sortOption, searchTerm, filterStreamer, initialDataLoaded, fetchClipsAndRatings, user, filterRatedClips]);
  // When filterRatedClips changes, update localStorage and trigger a refetch
  useEffect(() => {
    localStorage.setItem('filterRatedClips', filterRatedClips.toString());

    if (initialDataLoaded) {
      fetchClipsAndRatings(user, filterRatedClips, 1);
      setCurrentPage(1);
    }
  }, [filterRatedClips, user, initialDataLoaded, fetchClipsAndRatings]);

  // When filterDeniedClips changes, update localStorage and trigger a refetch
  useEffect(() => {
    localStorage.setItem('filterDeniedClips', filterDeniedClips.toString());

    if (initialDataLoaded) {
      fetchClipsAndRatings(user, filterRatedClips, 1);
      setCurrentPage(1);
    }
  }, [filterDeniedClips, user, initialDataLoaded, fetchClipsAndRatings, filterRatedClips]);

  // Initial data fetch - runs just once
  const fetchInitialData = useCallback(async () => {
    try {
      setProgress(10);
      await fetchConfig();
      const userData = await fetchUser();
      localStorage.setItem('filterRatedClips', filterRatedClips.toString());
      localStorage.setItem('filterDeniedClips', filterDeniedClips.toString());
      setProgress(50);
      getSeason();
      setProgress(70);
      await fetchClipsAndRatings(userData, filterRatedClips, page); // Use the page from URL params, not filterDeniedClips
      setInitialDataLoaded(true);
      setProgress(100);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showError("Failed to load initial data. Please try again later.");
      setProgress(100);
    }
  }, [fetchUser, fetchClipsAndRatings, filterRatedClips, filterDeniedClips, getSeason, showError, fetchConfig, page]);

  // This effect runs only once, for the initial data load
  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update expanded clip when clipId param changes
  useEffect(() => {
    if (clipId && clipId !== expandedClip) {
      setExpandedClip(clipId);
    }
  }, [clipId, expandedClip]);

  // Update URL when expandedClip changes
  useEffect(() => {
    if (expandedClip && expandedClip !== clipId) {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      // Preserve existing search params
      const path = expandedClip === 'new' ? '/clips/new' : `/clips/${expandedClip}`;

      const queryString = newSearchParams.toString();
      const url = path + (queryString ? `?${queryString}` : '');
      window.history.pushState({}, '', url);
    }
  }, [expandedClip, clipId, searchParams]);
  // Fetch clip data when expanded clip changes
  useEffect(() => {
    if (expandedClip && expandedClip !== 'new') {
      setIsClipLoading(true);
        // Fetch both clip data and ratings concurrently
      const fetchClipData = getClipById(expandedClip);
      // Always fetch ratings for individual clips as they contain public aggregate data
      const fetchRatings = getBulkRatings([expandedClip]);      Promise.all([fetchClipData, fetchRatings])
        .then(([clipData, ratingsData]) => {
          setCurrentClip(clipData);
          
          if (ratingsData && ratingsData[expandedClip]) {
            setRatings(prevRatings => ({
              ...prevRatings,
              [expandedClip]: ratingsData[expandedClip]
            }));
          }
          
          setIsClipLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching clip data or ratings:', error);
          if (error.message?.includes('404') || error.message?.includes('not found')) {
            showError("Clip not found. It may have been deleted or is unavailable.");
          } else {
            showError("Could not load clip. Please try again later.");
          }
          setIsClipLoading(false);
          setExpandedClip(null);
        });
    }
  }, [expandedClip, user, token, showError]);

  // Create a wrapper function for fetchClipsAndRatings to be passed to child components
  const triggerClipRefetch = useCallback(async (user: User | null = null) => {
    await fetchClipsAndRatings(user, filterRatedClips, currentPage);
  }, [fetchClipsAndRatings, filterRatedClips, currentPage]);

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
          color="#3b82f6" // Blue color
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
          shadow={true}
          height={3}
        />
      </div>      {/* Seasonal header */}
      <ClipViewerHeader season={(seasonInfo.season as 'Winter' | 'Spring' | 'Summer' | 'Fall') || 'Winter'} />

      {/* Main content container */}
      <div className="container mx-auto px-4 py-8 bg-neutral-200 dark:bg-neutral-900 transition duration-200">        <ClipViewerContent
          expandedClip={expandedClip}
          setExpandedClip={setExpandedClip}
          isClipLoading={isClipLoading}
          currentClip={currentClip}
          isLoggedIn={isLoggedIn}
          user={user}
          fetchClipsAndRatings={triggerClipRefetch}
          ratings={ratings}
          searchParams={searchParams}
          unratedClips={unratedClips}
          sortOptionState={sortOptionState}
          setSortOptionState={setSortOptionState}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStreamer={filterStreamer}
          setFilterStreamer={setFilterStreamer}
          filterRatedClips={filterRatedClips}
          setFilterRatedClips={setFilterRatedClips}
          filterDeniedClips={filterDeniedClips}
          setFilterDeniedClips={setFilterDeniedClips}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setSearchParams={setSearchParams}
          isLoading={isLoading}
          config={{
            clipAmount: config.clipAmount,
            itemsPerPage: itemsPerPage
          }}
          itemsPerPage={itemsPerPage}
          sortOption={sortOption}
        />
      </div>
    </motion.div>
  );
}

export default ClipViewer;