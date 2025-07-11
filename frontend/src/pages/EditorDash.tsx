import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { saveAs } from 'file-saver';
import LoadingBar from 'react-top-loading-bar';
import background from '../media/editor.webp';
import { motion } from 'framer-motion';
import {
  FaDownload,
  FaCalendarAlt,
  FaClipboard,
  FaBan,
  FaFileArchive,
  FaHistory,
  FaCheck,
  FaInfoCircle
} from 'react-icons/fa';
import { getCurrentSeason } from '../utils/seasonHelpers';
import { getConfig } from '../services/configService';
import { getClipsWithRatings } from '../services/clipService';
import { getZips } from '../services/adminService';
import { useNotification } from '../context/AlertContext';
import { Clip, Rating, Zip } from '../types/adminTypes';

interface Config {
  denyThreshold: number;
  latestVideoLink: string;
  clipAmount?: number;
}

interface SeasonInfo {
  season?: string;
  clipAmount?: number;
}

const EditorDash: React.FC = () => {
  const [config, setConfig] = useState<Config>({ denyThreshold: 0, latestVideoLink: '' });
  const [clips, setClips] = useState<Clip[]>([]);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo>({});
  const [zips, setZips] = useState<Zip[]>([]);
  const [zipsLoading, setZipsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');

  const { showError } = useNotification();

  // Utility function to format file sizes properly
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async (): Promise<void> => {
    try {
      setProgress(10);
      await fetchConfig();
      setProgress(30);
      getSeason();
      setProgress(50);
      await fetchClipsAndRatings();
      await fetchZips();
      setProgress(100);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showError('Failed to load data. Please try again.');
    }
  };  const fetchConfig = async (): Promise<void> => {
    try {
      const configData = await getConfig();

      if (configData) {
        const publicConfig = configData.public || {};
        const adminConfig = configData.admin || {};

        // Merge configs and set clip count
        setConfig({
          denyThreshold: (adminConfig as any).denyThreshold ?? 5,
          latestVideoLink: (publicConfig as any).latestVideoLink ?? '',
          clipAmount: (publicConfig as any).clipAmount ?? 0
        });

        // Update total clip count for pagination
        if ((publicConfig as any).clipAmount) {
          setSeasonInfo(prevSeasonInfo => ({
            ...prevSeasonInfo,
            clipAmount: (publicConfig as any).clipAmount
          }));
        }

        console.log("Fetched config with clip amount:", (publicConfig as any).clipAmount);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };const fetchClipsAndRatings = async (): Promise<void> => {
    try {
      // Use the service function which already handles the API call
      const { clips: clipsData, ratings: ratingsData } = await getClipsWithRatings();

      // Update state with fetched data
      setClips(clipsData);

      // Transform ratings to ensure they have the expected format for the frontend
      const transformedRatings = transformRatings(ratingsData);
      setRatings(transformedRatings);

    } catch (error) {
      console.error('Error fetching clips and ratings:', error);    }
  };

  // Utility function to transform backend rating format to frontend expected format
  const transformRatings = (ratings: Record<string, any>): Record<string, Rating> => {
    const transformed: Record<string, Rating> = {};

    Object.entries(ratings).forEach(([clipId, ratingData]) => {
      // Check if we need to transform this rating data
      if (ratingData && !ratingData.ratingCounts && ratingData.ratings) {
        // Transform from backend format to frontend expected format
        const ratingCounts = [
          {
            rating: '1',
            count: Array.isArray(ratingData.ratings['1']) ? ratingData.ratings['1'].length : 0,
            users: Array.isArray(ratingData.ratings['1']) ? ratingData.ratings['1'] : []
          },
          {
            rating: '2',
            count: Array.isArray(ratingData.ratings['2']) ? ratingData.ratings['2'].length : 0,
            users: Array.isArray(ratingData.ratings['2']) ? ratingData.ratings['2'] : []
          },
          {
            rating: '3',
            count: Array.isArray(ratingData.ratings['3']) ? ratingData.ratings['3'].length : 0,
            users: Array.isArray(ratingData.ratings['3']) ? ratingData.ratings['3'] : []
          },
          {
            rating: '4',
            count: Array.isArray(ratingData.ratings['4']) ? ratingData.ratings['4'].length : 0,
            users: Array.isArray(ratingData.ratings['4']) ? ratingData.ratings['4'] : []
          },
          {
            rating: 'deny',
            count: Array.isArray(ratingData.ratings['deny']) ? ratingData.ratings['deny'].length : 0,
            users: Array.isArray(ratingData.ratings['deny']) ? ratingData.ratings['deny'] : []
          }
        ];

        transformed[clipId] = {
          ...ratingData,
          ratingCounts: ratingCounts
        };
      } else {
        // Rating is already in the right format or is null/undefined
        transformed[clipId] = ratingData;
      }
    });

    return transformed;
  };

  const deniedClips = clips.filter(clip => {
    const ratingData = ratings[clip._id];
    return ratingData &&
      ratingData.ratingCounts &&
      Array.isArray(ratingData.ratingCounts) &&
      ratingData.ratingCounts.some(rateData =>
        rateData.rating === 'deny' && rateData.count >= config.denyThreshold
      );
  }).length;
  const fetchZips = async (): Promise<void> => {
    try {
      const zipData = await getZips();
      setZips(zipData);
      setZipsLoading(false);
    } catch (error) {
      console.error('Error fetching zips:', error);
      showError('Failed to load zip archives');
      setZipsLoading(false);
    }
  };

  const approvedClips = (seasonInfo.clipAmount || 0) - deniedClips;

  const getSeason = () => {
    const { season } = getCurrentSeason();

    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      season
    }));
  };

  // Calculate statistics
  const getApprovedPercentage = (): string => {
    if (!seasonInfo.clipAmount || seasonInfo.clipAmount === 0) return '0.0';
    return ((approvedClips / seasonInfo.clipAmount) * 100).toFixed(1);
  };

  const getDeniedPercentage = (): string => {
    if (!seasonInfo.clipAmount || seasonInfo.clipAmount === 0) return '0.0';
    return ((deniedClips / seasonInfo.clipAmount) * 100).toFixed(1);
  };
  // Skeleton component for loading states
  const SkeletonBox = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-neutral-400 dark:bg-neutral-600 rounded ${className}`}></div>
  );

  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>Editor Dashboard | ClipSesh</title>
        <meta
          name="description"
          content="ClipSesh Editor Dashboard - Process and download clip collections"
        />
      </Helmet>
      <div className='w-full'>
        <LoadingBar color='#3b82f6' height={4} progress={progress} onLoaderFinished={() => setProgress(0)} />
      </div>
      <div
        className="w-full flex h-96 justify-center items-center animate-fade"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)'
        }}
      >
        <div className="flex bg-gradient-to-b from-neutral-900/80 to-bg-black/40 backdrop-blur-md justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center px-4 md:px-0">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4 text-center text-white drop-shadow-lg"
            >
              Editor Dashboard
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl md:text-3xl mb-4 text-center text-white/90 drop-shadow-md"
            >
              Process and download seasonal clips
            </motion.h1>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-8 pt-16 pb-12 bg-neutral-200 dark:bg-neutral-900 transition duration-200 text-white justify-center justify-items-center">

        {/* Season Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
        >
          <h2 className="text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
            <FaInfoCircle className="mr-3 text-blue-500" />
            Current Season Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">            {/* Season */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-lg shadow"
            >
              <div className="flex justify-center mb-2 text-blue-500 dark:text-blue-400">
                <FaCalendarAlt size={28} />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Season</h3>
              {loading ? (
                <SkeletonBox className="h-9 w-24 mx-auto" />
              ) : (
                <h2 className="text-3xl font-bold text-center">{seasonInfo.season}</h2>
              )}
            </motion.div>            {/* Approved Clips */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-lg shadow"
            >
              <div className="flex justify-center mb-2 text-green-500 dark:text-green-400">
                <FaCheck size={28} />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Approved Clips</h3>
              {loading ? (
                <>
                  <SkeletonBox className="h-9 w-16 mx-auto mb-2" />
                  <SkeletonBox className="h-5 w-20 mx-auto" />
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-center">{approvedClips}</h2>
                  <p className="text-center mt-1 text-green-600 dark:text-green-400 font-medium">
                    {getApprovedPercentage()}% of total
                  </p>
                </>
              )}
            </motion.div>            {/* Denied Clips */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-lg shadow"
            >
              <div className="flex justify-center mb-2 text-red-500 dark:text-red-400">
                <FaBan size={28} />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Denied Clips</h3>
              {loading ? (
                <>
                  <SkeletonBox className="h-9 w-16 mx-auto mb-2" />
                  <SkeletonBox className="h-5 w-20 mx-auto" />
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-center">{deniedClips}</h2>
                  <p className="text-center mt-1 text-red-600 dark:text-red-400 font-medium">
                    {getDeniedPercentage()}% of total
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Available Archives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full p-6 md:p-8 mt-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
        >
          <h2 className="text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
            <FaFileArchive className="mr-3 text-amber-500" />
            Available Archives
          </h2>

          {/* Tab navigation */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'current'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white'
                }`}
            >
              <FaCalendarAlt /> Current Season
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'all'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white'
                }`}
            >
              <FaHistory /> All Archives
            </button>
          </div>          {zipsLoading ? (
            <div className="space-y-4">
              {/* Skeleton for archive items */}
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                      <SkeletonBox className="w-6 h-6" />
                    </div>
                    <div>
                      <SkeletonBox className="h-6 w-32 mb-2" />
                      <div className="flex items-center gap-6 mt-1">
                        <SkeletonBox className="h-4 w-20" />
                        <SkeletonBox className="h-4 w-16" />
                        <SkeletonBox className="h-4 w-12" />
                      </div>
                    </div>
                  </div>
                  <SkeletonBox className="w-12 h-12 rounded-full" />
                </div>
              ))}
            </div>
          ) : zips.length === 0 ? (
            <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg p-8 text-center">
              <p className="text-lg">No archives available yet.</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                Process clips to create zip archives for download.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {zips
                .filter(zip => activeTab === 'all' || zip.season === seasonInfo.season)
                .map(zip => (
                  <motion.div
                    key={zip._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="flex justify-between items-center bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                        <FaFileArchive size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{zip.name}</h3>
                        <div className="flex items-center gap-6 text-sm text-neutral-700 dark:text-neutral-300 mt-1">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt />
                            <span>{zip.season} {zip.year}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaClipboard />
                            <span>{zip.clipAmount} clips</span>
                          </div>
                          <span>{formatFileSize(zip.size)}</span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      onClick={() => { saveAs(zip.url); }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                      title="Download Archive"
                    >
                      <FaDownload size={18} />
                    </motion.button>
                  </motion.div>
                ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

export default EditorDash;
