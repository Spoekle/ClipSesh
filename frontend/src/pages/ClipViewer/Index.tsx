import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../../config/config';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import LoadingBar from 'react-top-loading-bar';

// Component imports
import ClipViewerHeader from './components/ClipViewerHeader';
import ClipViewerContent from './components/ClipViewerContent';

// Define TypeScript interfaces for better type safety
interface User {
  _id: string;
  roles: string[];
  username?: string;
  email?: string;
  avatar?: string;
  [key: string]: any;
}

interface Clip {
  _id: string;
  title?: string;
  description?: string;
  createdAt: string;
  streamer?: string;
  clipUrl?: string;
  thumbnailUrl?: string;
  [key: string]: any;
}

interface Rating {
  ratings: {
    [key: string]: Array<{ userId: string; timestamp?: string }>;
  };
  ratingCounts?: Array<{ rating: string; count: number }>;
  [key: string]: any;
}

interface RatingMap {
  [clipId: string]: Rating;
}

interface Config {
  denyThreshold: number;
  allowedFileTypes: string[];
  clipAmount: number;
  [key: string]: any;
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
  
  // These state variables are maintained for UI features that might use them later
  const [ratedClips, setRatedClips] = useState<Clip[]>([]);
  const [deniedClips, setDeniedClips] = useState<Clip[]>([]);
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
  // Track when manual refetch is needed
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Define fetchConfig function with default values for when response data is undefined
  const fetchConfig = useCallback(async () => {
    try {
      setProgress(10); // Show loading indicator
      
      // Default config values
      const defaultConfig = {
        denyThreshold: 3,
        allowedFileTypes: ['video/mp4', 'video/webm'],
        clipAmount: 0
      };
      
      // First fetch public config - available to all users
      const publicResponse = await axios.get(`${apiUrl}/api/config/public`);
      
      // Get public config which contains clipAmount
      const publicConfig = publicResponse.data || {};
      
      // Initialize with defaults and public config
      let configData = {
        ...defaultConfig,
        clipAmount: publicConfig.clipAmount || 0
      };
      
      // Update total pages based on clipAmount for pagination
      if (publicConfig.clipAmount) {
        const totalPagesCount = Math.ceil(publicConfig.clipAmount / itemsPerPage);
        setTotalPages(totalPagesCount);
      }
      
      // Only fetch admin config if user is logged in and has admin or clipteam role
      if (token && user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
        try {
          const adminResponse = await axios.get(`${apiUrl}/api/admin/config`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (adminResponse.data && adminResponse.data[0]) {
            // Merge admin config with our current config
            configData = {
              ...configData,
              ...adminResponse.data[0]
            };
          }
        } catch (adminError) {
          console.warn('Could not fetch admin config - user may not have permission:', adminError);
          // Continue with just public config
        }
      }
      
      // Set the final config
      setConfig(configData);
      setProgress(30); // Update progress
      
    } catch (error) {
      console.error('Error fetching config:', error);
      showError("Could not load configuration settings, using defaults");
      
      // Set default config on error
      setConfig({
        denyThreshold: 3,
        allowedFileTypes: ['video/mp4', 'video/webm'],
        clipAmount: 0
      });
      setProgress(40); // Update progress despite error
    }
  }, [token, user, showError, itemsPerPage]);

  // Fetch user data
  const fetchUser = useCallback(async () => {
    if (token) {
      try {
        const response = await axios.get(`${apiUrl}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsLoggedIn(true);
        setUser(response.data);
        return response.data;
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
  const fetchClipsAndRatings = useCallback(async (userData: User | null = null, filterRated: boolean | null = null) => {
    // Use the passed userData or fall back to current user state if available
    const currentUser = userData || user;
    const shouldFilterRated = filterRated !== null ? filterRated : filterRatedClips;
    
    try {
      setIsLoading(true);
      setProgress(30);
      
      // Build query parameters for filtering, sorting and pagination
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      // Map sort option to the sortBy and sortOrder parameters
      let sortBy = 'createdAt';
      let sortOrder = 'desc';
      
      switch (sortOption) {
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
          sortBy = 'upvotes';
          sortOrder = 'asc'; 
          break;
        case 'highestRatio':
          sortBy = 'upvotes';
          sortOrder = 'desc';
          break;
      }
      
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('sortOption', sortOption); // Also send the original sort option for backend processing
      
      // Add filter parameters if they exist
      if (filterStreamer) {
        params.append('streamer', filterStreamer);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // If filterRated is true and user is logged in, exclude clips rated by user
      if (shouldFilterRated && currentUser?._id) {
        params.append('excludeRatedByUser', currentUser._id);
      }
      
      // Always include ratings for efficient processing
      params.append('includeRatings', 'true');
      
      // Debug logs
      console.log(`Fetching clips: ${apiUrl}/api/clips?${params.toString()}`);
      
      // Get paginated clips with filters and sorting applied by the backend
      const clipResponse = await axios.get(`${apiUrl}/api/clips`, {
        params,
        headers: currentUser ? { Authorization: `Bearer ${token}` } : undefined
      });
      
      setProgress(50);
      
      // Process the response data
      if (clipResponse.data) {
        const { clips = [], ratings = {}, totalClips, totalPages: newTotalPages, currentPage: newCurrentPage } = clipResponse.data;
        
        // Update pagination state
        if (newTotalPages !== undefined && newTotalPages !== totalPages) {
          setTotalPages(newTotalPages);
        }
        
        if (newCurrentPage !== undefined && newCurrentPage !== currentPage) {
          setCurrentPage(newCurrentPage);
        }
        
        // Update config's clipAmount
        if (totalClips !== undefined) {
          setConfig(current => ({ 
            ...current, 
            clipAmount: totalClips 
          }));
        }
        
        // Update ratings data from response
        if (Object.keys(ratings).length > 0) {
          setRatings(ratings);
        } else if (currentUser && (currentUser.roles?.includes('admin') || currentUser.roles?.includes('clipteam'))) {
          // If ratings weren't included, fetch them separately for admin/clipteam users
          const fetchRatings = async () => {
            try {
              // Only fetch ratings for the current page of clips
              const ratingPromises = clips.map((clip: Clip) =>
                axios.get(`${apiUrl}/api/ratings/${clip._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
              );
              
              const ratingResponses = await Promise.all(ratingPromises);
              const ratingsData = ratingResponses.reduce((acc: RatingMap, res, index) => {
                acc[clips[index]._id] = res.data;
                return acc;
              }, {});
              
              setRatings(ratingsData);
            } catch (error) {
              console.error('Error fetching ratings:', error);
            }
          };
          
          fetchRatings();
        }
        
        // Use the server-filtered clips directly
        setUnratedClips(clips);
        
        // Even with server-side filtering, track which clips have been rated by the user for UI purposes
        if (currentUser && ratings && Object.keys(ratings).length > 0) {
          const rated: Clip[] = [];
          const unrated: Clip[] = [];
          
          clips.forEach((clip: Clip) => {
            let hasUserRating = false;
            
            // Check if the user has rated this clip
            const clipRating = ratings[clip._id];
            if (clipRating && clipRating.ratings) {
              // Check each rating category (1-4 and deny)
              const allRatingCategories = ['1', '2', '3', '4', 'deny'];
              
              for (const category of allRatingCategories) {
                const ratingUsers = clipRating.ratings[category] || [];
                if (ratingUsers.some((u: any) => u && u.userId === currentUser._id)) {
                  hasUserRating = true;
                  rated.push(clip);
                  break;
                }
              }
            }
            
            if (!hasUserRating) {
              unrated.push(clip);
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
      
      setProgress(100);
    } catch (error) {
      console.error('Error in fetchClipsAndRatings:', error);
      showError("Could not load clips. Please try again later.");
      setProgress(100);
      setUnratedClips([]);
      setRatedClips([]);
      setDeniedClips([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, filterStreamer, sortOption, token, config.denyThreshold, showError, totalPages, filterRatedClips, user]);

  // When filterRatedClips changes, update localStorage and trigger a refetch
  useEffect(() => {
    // Persist the setting to localStorage
    localStorage.setItem('filterRatedClips', filterRatedClips.toString());
    
    // No need to refetch on initial render - the initial data fetch will handle it
    if (initialDataLoaded) {
      fetchClipsAndRatings(user, filterRatedClips);
    }
  }, [filterRatedClips, user, initialDataLoaded, fetchClipsAndRatings]);

  // This effect handles when search/filter/sort parameters change
  useEffect(() => {
    // Skip on initial render - we'll handle that in initialDataLoad
    if (initialDataLoaded) {
      fetchClipsAndRatings(user, filterRatedClips);
    }
  }, [currentPage, sortOption, searchTerm, filterStreamer, refetchTrigger, initialDataLoaded, fetchClipsAndRatings, user, filterRatedClips]);

  // Initial data fetch - runs just once
  const fetchInitialData = useCallback(async () => {
    try {
      setProgress(10);
      await fetchConfig();
      const userData = await fetchUser();
      localStorage.setItem('filterRatedClips', filterRatedClips.toString());
      setProgress(50);
      getSeason();
      setProgress(70);
      await fetchClipsAndRatings(userData, filterRatedClips);
      setInitialDataLoaded(true);
      setProgress(100);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showError("Failed to load initial data. Please try again later.");
      setProgress(100);
    }
  }, [fetchUser, fetchClipsAndRatings, filterRatedClips, getSeason, showError, fetchConfig]);

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

  // Fetch clip data when expanded clip changes
  useEffect(() => {
    if (expandedClip && expandedClip !== 'new') {
      setIsClipLoading(true);
      axios
        .get(`${apiUrl}/api/clips/${expandedClip}`)
        .then((response) => {
          setCurrentClip(response.data);
          setIsClipLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching clip:', error);
          showError("Could not load clip. It may have been deleted or is unavailable.");
          setIsClipLoading(false);
          setExpandedClip(null);
        });
    }
  }, [expandedClip, showError]);

  // Create a wrapper function for fetchClipsAndRatings to be passed to child components
  const triggerClipRefetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

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
      </div>
      
      {/* Seasonal header */}
      <ClipViewerHeader season={seasonInfo.season} />

      {/* Main content container */}
      <div className="container mx-auto px-4 py-8 bg-neutral-200 dark:bg-neutral-900 transition duration-200">
        <ClipViewerContent
          expandedClip={expandedClip}
          setExpandedClip={setExpandedClip}
          isClipLoading={isClipLoading}
          currentClip={currentClip}
          isLoggedIn={isLoggedIn}
          user={user}
          token={token}
          fetchClipsAndRatings={triggerClipRefetch}
          ratings={ratings}
          searchParams={searchParams}
          unratedClips={unratedClips}
          setUnratedClips={setUnratedClips}
          sortClips={() => {/* Server-side sorting now */}}
          sortOptionState={sortOptionState}
          setSortOptionState={setSortOptionState}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStreamer={filterStreamer}
          setFilterStreamer={setFilterStreamer}
          filterRatedClips={filterRatedClips}
          setFilterRatedClips={setFilterRatedClips}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setSearchParams={setSearchParams}
          isLoading={isLoading}
          config={config}
          itemsPerPage={itemsPerPage}
          sortOption={sortOption}
        />
      </div>
    </motion.div>
  );
}

export default ClipViewer;