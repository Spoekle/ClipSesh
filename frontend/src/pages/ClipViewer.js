import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import LoadingBar from 'react-top-loading-bar';
import Pagination from './components/clipViewer/Pagination';

import winterBg from '../media/winter.webp';
import springBg from '../media/spring.jpg';
import summerBg from '../media/summer.jpg';
import fallBg from '../media/fall.jpg';

import ClipContent from './components/clipViewer/ClipContent';
import ClipItem from './components/clipViewer/ClipItem';
import ClipSearch from './ClipSearch';

function ClipViewer() {
  const { clipId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortOption = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page')) || 1;
  const location = useLocation();
  const token = localStorage.getItem('token');

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
  const [itemsPerPage] = useState(6);
  const [isClipLoading, setIsClipLoading] = useState(false);

  // Memoized fetchClipsAndRatings to prevent unnecessary re-creations
  const fetchClipsAndRatings = useCallback(async (userData, filterRated) => {
    try {
      setIsLoading(true);
      const clipResponse = await axios.get(`${apiUrl}/api/clips`);
      const clipsData = clipResponse.data;

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
    } catch (error) {
      console.error('Error in fetchClipsAndRatings function while fetching clips and ratings:', error);
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
      const userData = await fetchUser();
      localStorage.setItem('filterRatedClips', filterRatedClips);
      setProgress(30);
      getSeason();
      setProgress(50);
      await fetchClipsAndRatings(userData, filterRatedClips);
      setProgress(100);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }, [fetchUser, fetchClipsAndRatings, filterRatedClips]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, location.search]);

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
          setIsClipLoading(false);
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
      console.error('Error fetching deny threshold:');
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
      console.log('Config fetched successfully:', config);
    } catch (error) {
      console.error('Error fetching deny threshold:', error);
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
                case 1:
                  score += 10 * rate.count;
                  break;
                case 2:
                  score += 6 * rate.count;
                  break;
                case 3:
                  score += 4 * rate.count;
                  break;
                case 4:
                  score += 2 * rate.count;
                  break;
                case 'deny':
                  score += -5 * rate.count;
                  break;
                default:
                  break;
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
                case 1:
                  score += 10 * rate.count;
                  break;
                case 2:
                  score += 6 * rate.count;
                  break;
                case 3:
                  score += 4 * rate.count;
                  break;
                case 4:
                  score += 2 * rate.count;
                  break;
                case 'deny':
                  score += -5 * rate.count;
                  break;
                default:
                  break;
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
    const currentDate = new Date().toLocaleDateString();
    let season = '';

    if (currentDate >= '12-21' || currentDate <= '03-19') {
      season = 'Winter';
    } else if (currentDate >= '03-20' && currentDate <= '06-20') {
      season = 'Spring';
    } else if (currentDate >= '06-21' && currentDate <= '09-21') {
      season = 'Summer';
    } else {
      season = 'Fall';
    }

    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      season
    }));
  };

  // Pagination and sorting
  const indexOfLastClip = currentPage * itemsPerPage;
  const indexOfFirstClip = indexOfLastClip - itemsPerPage;

  const currentClips = unratedClips.slice(indexOfFirstClip, indexOfLastClip);

  const totalPages = Math.ceil(unratedClips.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSearchParams({ sort: sortOption, page: pageNumber });
  };

  const renderContent = () => {
    if (expandedClip === 'new') {
      return <ClipSearch setExpandedPost={setExpandedClip} fetchClips={fetchClipsAndRatings} />;
    } else if (expandedClip) {
      if (isClipLoading) {
        return <div className="text-center py-8">Loading clip...</div>;
      } else if (currentClip) {
        return (
          <ClipContent
            clip={currentClip}
            setExpandedClip={setExpandedClip}
            isLoggedIn={isLoggedIn}
            user={user}
            token={token}
            fetchClipsAndRatings={fetchClipsAndRatings}
            ratings={ratings}
            searchParams={searchParams}
          />
        );
      } else {
        return <div className="text-center py-8">Clip not found.</div>;
      }
    } else {
        return (
          <div
            className="grid justify-items-center text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200 justify-center items-center animate-fade"
          >
            <div className="text-center py-4 justify-center items-center z-30">
              <div className="mb-4 flex justify-center">
                <select
                  value={sortOptionState}
                  onChange={(e) => {
                    const newSortOption = e.target.value;
                    setSortOptionState(newSortOption);
                    const sorted = sortClips(unratedClips, newSortOption);
                    setUnratedClips(sorted);
                    setSearchParams({ sort: newSortOption, page: currentPage });
                  }}
                  className="bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white transition duration-200 py-2 px-4 rounded-md border-2 border-neutral-800 dark:border-white"
                >
                  <option value="newest">Newest Clips</option>
                  <option value="oldest">Oldest Clips</option>
                  <option value="highestUpvotes">Highest Upvotes</option>
                  <option value="highestDownvotes">Highest Downvotes</option>
                  <option value="highestRatio">Highest Upvote/Downvote Ratio</option>
                  <option value="lowestRatio">Lowest Upvote/Downvote Ratio</option>
                  {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                    <>
                      <option value="highestScore">(Clip Team) Highest Rated</option>
                      <option value="lowestScore">(Clip Team) Lowest Rated</option>
                    </>
                  )}
                </select>
              </div>
              {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                <div className="flex justify-center items-center">
                  <button
                    onClick={() => {
                      setFilterRatedClips((prev) => !prev);
                    }}
                    className="bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white transition duration-200 py-2 px-4 rounded-md border-2 border-neutral-800 dark:border-white"
                  >
                    {filterRatedClips ? 'Show Rated Clips' : 'Hide Rated Clips'}
                  </button>
                </div>
              )}
            </div>
            <div className="container w-full min-w-full mt-4 justify-center items-center rounded-2xl animate-fade">
              <div className="h-full w-full min-w-full dark:text-white transition duration-200 backdrop-blur-lg rounded-2xl">
                <div className="p-4 w-full min-w-full justify-center gap-4 grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="relative bg-neutral-950 w-[80vw] md:w-[30vw] lg:w-[25vw] max-w-[450px] aspect-video animate-pulse rounded-lg overflow-hidden border-4 border-neutral-950">
                      </div>
                    ))
                  ) : currentClips.length > 0 ? (
                    currentClips
                      .filter((clip) => {
                        if (filterRatedClips) {
                          if (user && (user.roles.includes('admin') || user.roles.includes('clipteam'))) {
                            const ratingData = ratings[clip._id];
                            return (
                              ratingData &&
                              ratingData.ratingCounts.some(
                                (rateData) => rateData.rating === 'deny' && rateData.count < config.denyThreshold
                              )
                            );
                          }
                        }

                        return true;
                      })
                      .map((clip, index) => {
                        const hasUserRated =
                          user &&
                          ratings[clip._id] &&
                          ratings[clip._id].ratingCounts.some((rateData) =>
                            rateData.users.some((u) => u.userId === user._id)
                          );

                        return (
                          <ClipItem
                            key={clip._id}
                            clip={clip}
                            hasUserRated={hasUserRated}
                            setExpandedClip={setExpandedClip}
                            index={index}
                          />
                        );
                      })
                  ) : (
                    <h2 className='text-center justify-center'>No clips available</h2>
                  )}
                </div>
                <div className="flex justify-center">
                  <div className="items-center justify-center rounded-md mb-4 py-2 px-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={paginate}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    };
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>Clip Viewer</title>
        <meta
          name="description"
          content={unratedClips.map(clip => `${clip.title} by ${clip.streamer}`).join(', ')}
        />
      </Helmet>
      <div className="w-full">
        <LoadingBar
          color="#f11946"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
        />
      </div>
      <div
        className="flex h-96 w-full justify-center items-center drop-shadow-xl animate-fade"
        style={{
          backgroundImage: `url(${seasonInfo.season === 'Winter'
            ? winterBg
            : seasonInfo.season === 'Spring'
              ? springBg
              : seasonInfo.season === 'Summer'
                ? summerBg
                : fallBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex bg-gradient-to-b from-neutral-900 to-bg-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-4xl font-bold mb-4 text-center">Clip Viewer</h1>
            <h1 className="text-3xl mb-4 text-center">Rate the clips!</h1>
          </div>
        </div>
      </div>

      <div className="container justify-self-center text-white p-4 pt-8 bg-neutral-200 dark:bg-neutral-900 transition duration-200 justify-center items-center animate-fade">
        {renderContent()}
      </div>
    </div>
  );
};

export default ClipViewer;