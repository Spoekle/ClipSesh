import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingBar from 'react-top-loading-bar';

// Component imports
import ClipViewerHeader from './components/clipViewer/ClipViewerHeader';
import ClipViewerContent from './components/clipViewer/ClipViewerContent';

function ClipViewer() {
  const { clipId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortOption = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page')) || 1;
  const location = useLocation();
  const token = localStorage.getItem('token');

  // State management
  const [unratedClips, setUnratedClips] = useState([]);
  const [filterRatedClips, setFilterRatedClips] = useState(() => {
    const storedValue = localStorage.getItem('filterRatedClips');
    return storedValue === 'true' ? true : false;
  });
  const [ratedClips, setRatedClips] = useState([]);
  const [deniedClips, setDeniedClips] = useState([]);
  const [ratings, setRatings] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentClip, setCurrentClip] = useState(null);
  const [expandedClip, setExpandedClip] = useState(clipId || null);
  const [sortOptionState, setSortOptionState] = useState(sortOption || 'newest');
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [seasonInfo, setSeasonInfo] = useState({ season: '' });
  const [itemsPerPage] = useState(12); // Increased from 6 to 12
  const [isClipLoading, setIsClipLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStreamer, setFilterStreamer] = useState('');

  // Fetch clips and ratings
  const fetchClipsAndRatings = useCallback(async (userData, filterRated) => {
    try {
      setIsLoading(true);
      setProgress(30);
      
      const clipResponse = await axios.get(`${apiUrl}/api/clips`);
      const clipsData = clipResponse.data;
      
      setProgress(50);

      const isUserAuthorized = userData && (
        userData.roles.includes('admin') ||
        userData.roles.includes('clipteam') ||
        userData.roles.includes('uploader') ||
        userData.roles.includes('editor')
      );
      
      if (userData && isUserAuthorized) {
        const ratingPromises = clipsData.map((clip) =>
          axios.get(`${apiUrl}/api/ratings/${clip._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );

        await fetchConfig();
        setProgress(70);

        const ratingResponses = await Promise.all(ratingPromises);
        const ratingsData = ratingResponses.reduce((acc, res, index) => {
          acc[clipsData[index]._id] = res.data;
          return acc;
        }, {});
        setRatings(ratingsData);

        if (filterRated) {
          // Filter Denied Clips Only If FilterRatedClips is True
          filterDeniedClips(clipsData, ratingsData);

          const rated = [];
          const unrated = [];
          clipsData.forEach((clip) => {
            const ratingData = ratingsData[clip._id];
            if (
              ratingData &&
              ratingData.ratingCounts.some((rateData) =>
                rateData.users.some((ratingUser) => ratingUser.userId === userData._id)
              )
            ) {
              rated.push(clip);
            } else {
              unrated.push(clip);
            }
          });
          const sortedUnrated = sortClips(unrated, sortOption);

          setRatedClips(rated);
          setUnratedClips(sortedUnrated);
        } else {
          const sortedUnrated = sortClips(clipsData, sortOption);
          setRatedClips([]);
          setUnratedClips(sortedUnrated);
          setDeniedClips([]); // Clear denied clips when filter is inactive
        }
      } else {
        // If not 'clipteam' or 'admin', set all clips to unratedClips and clear ratings
        setRatedClips([]);
        const sortedUnrated = sortClips(clipsData, sortOption);
        setUnratedClips(sortedUnrated);
        setRatings({});
        setDeniedClips([]);
      }
      setProgress(100);
    } catch (error) {
      console.error('Error in fetchClipsAndRatings function while fetching clips and ratings:', error);
      toast.error("Could not load clips. Please try again later.");
      setProgress(100);
    } finally {
      setIsLoading(false);
    }
  }, [token, sortOption]);

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

  // Initial data fetch
  const fetchInitialData = useCallback(async () => {
    try {
      setProgress(10);
      const userData = await fetchUser();
      localStorage.setItem('filterRatedClips', filterRatedClips);
      setProgress(30);
      getSeason();
      setProgress(50);
      await fetchClipsAndRatings(userData, filterRatedClips);
      setProgress(100);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error("Failed to load initial data. Please try again later.");
      setProgress(100);
    }
  }, [fetchUser, fetchClipsAndRatings, filterRatedClips]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Update expanded clip when clipId param changes
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
          toast.error("Could not load clip. It may have been deleted or is unavailable.");
          setIsClipLoading(false);
          setExpandedClip(null);
        });
    }
  }, [expandedClip]);

  const filterDeniedClips = (clipsData, ratingsData) => {
    if (config.denyThreshold) {
      const denied = [];
      const threshold = config.denyThreshold;
      
      clipsData.forEach((clip) => {
        const ratingData = ratingsData[clip._id];
        if (
          ratingData &&
          ratingData.ratingCounts.some(
            (rateData) => rateData.rating === 'deny' && rateData.count >= threshold
          )
        ) {
          denied.push(clip);
        }
      });

      // Sort the denied array
      const sortedDenied = sortClips(denied, sortOption);

      // Set State
      setDeniedClips(sortedDenied);
    } else {
      setDeniedClips([]);
      console.error('Error: Deny threshold not found');
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/admin/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        setConfig(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error("Could not load configuration settings");
    }
  };

  const sortClips = (clipsToSort, option) => {
    let sortedClips = [...clipsToSort];
    
    switch (option) {
      case 'newest':
        sortedClips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        sortedClips.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'highestUpvotes':
        sortedClips.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case 'highestDownvotes':
        sortedClips.sort((a, b) => b.downvotes - a.downvotes);
        break;
      case 'highestRatio':
        sortedClips.sort((a, b) => {
          const ratioA = a.upvotes / (a.downvotes || 1);
          const ratioB = b.upvotes / (b.downvotes || 1);
          return ratioB - ratioA;
        });
        break;
      case 'lowestRatio':
        sortedClips.sort((a, b) => {
          const ratioA = a.upvotes / (a.downvotes || 1);
          const ratioB = b.upvotes / (b.downvotes || 1);
          return ratioA - ratioB;
        });
        break;
      case 'highestScore':
        sortedClips.sort((a, b) => {
          const calculateScore = (clip) => {
            const clipRatings = ratings[clip._id]?.ratingCounts || [];
            let score = 0;
            clipRatings.forEach((rate) => {
              switch (rate.rating) {
                case 1: score += 10 * rate.count; break;
                case 2: score += 6 * rate.count; break;
                case 3: score += 4 * rate.count; break;
                case 4: score += 2 * rate.count; break;
                case 'deny': score += -5 * rate.count; break;
                default: break;
              }
            });
            return score;
          };

          const scoreA = calculateScore(a);
          const scoreB = calculateScore(b);
          return scoreB - scoreA;
        });
        break;
      case 'lowestScore':
        sortedClips.sort((a, b) => {
          const calculateScore = (clip) => {
            const clipRatings = ratings[clip._id]?.ratingCounts || [];
            let score = 0;
            clipRatings.forEach((rate) => {
              switch (rate.rating) {
                case 1: score += 10 * rate.count; break;
                case 2: score += 6 * rate.count; break;
                case 3: score += 4 * rate.count; break;
                case 4: score += 2 * rate.count; break;
                case 'deny': score += -5 * rate.count; break;
                default: break;
              }
            });
            return score;
          };

          const scoreA = calculateScore(a);
          const scoreB = calculateScore(b);
          return scoreA - scoreB;
        });
        break;
      default:
        break;
    }
    
    return sortedClips;
  };

  const getSeason = () => {
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
  };

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
      
      <ToastContainer position="top-right" theme="colored" />
      
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
          fetchClipsAndRatings={fetchClipsAndRatings}
          ratings={ratings}
          searchParams={searchParams}
          unratedClips={unratedClips}
          setUnratedClips={setUnratedClips}
          sortClips={sortClips}
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