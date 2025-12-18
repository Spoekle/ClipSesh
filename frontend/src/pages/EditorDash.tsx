import { useState } from 'react';
import { Helmet } from 'react-helmet';
import LoadingBar from 'react-top-loading-bar';
import background from '../media/editor.webp';
import { motion } from 'framer-motion';
import {
  FaDownload,
  FaCalendarAlt,
  FaClipboard,
  FaFileArchive,
  FaHistory,
  FaCheck,
  FaInfoCircle,
  FaTimes,
  FaVideo,
  FaPercentage,
  FaSpinner
} from 'react-icons/fa';
import { getCurrentSeason } from '../utils/seasonHelpers';
import { downloadWithProgress } from '../utils/downloadHelpers';

import { useCombinedConfig } from '../hooks/useConfig';
import { useClipsWithRatings } from '../hooks/useClips';
import { useZips } from '../hooks/useAdmin';
import { useCurrentUser } from '../hooks/useUser';

const EditorDash: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: config } = useCombinedConfig(user);
  const { data: clipsData } = useClipsWithRatings();
  const { data: zips = [], isLoading: zipsLoading } = useZips();

  const clips = clipsData?.clips || [];
  const ratings = clipsData?.ratings || {};

  const [progress, setProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'latest' | 'all'>('latest');
  const [downloadStates, setDownloadStates] = useState<{
    [key: string]: {
      isDownloading: boolean;
      progress: number;
    }
  }>({});
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const seasonInfo = {
    season: getCurrentSeason().season,
    clipAmount: clips.length
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deniedClips = clips.filter(clip => {
    const ratingData = ratings[clip._id];
    if (!ratingData || !ratingData.ratings) {
      return false;
    }

    const denyRatings = ratingData.ratings.deny;
    return denyRatings && Array.isArray(denyRatings) && denyRatings.length >= (config?.denyThreshold || 5);
  }).length;

  const approvedClips = (seasonInfo.clipAmount || 0) - deniedClips;

  const getApprovedPercentage = (): string => {
    if (!seasonInfo.clipAmount || seasonInfo.clipAmount === 0) return '0.0';
    return ((approvedClips / seasonInfo.clipAmount) * 100).toFixed(1);
  };

  const getDeniedPercentage = (): string => {
    if (!seasonInfo.clipAmount || seasonInfo.clipAmount === 0) return '0.0';
    return ((deniedClips / seasonInfo.clipAmount) * 100).toFixed(1);
  };

  const handleDownload = async (zipId: string, url: string, filename: string) => {
    try {
      // Set download state for this specific zip
      setDownloadStates(prev => ({
        ...prev,
        [zipId]: { isDownloading: true, progress: 0 }
      }));

      // Start the download with progress tracking
      await downloadWithProgress({
        url,
        filename,
        onStart: () => {
          setProgress(0);
          setDownloadProgress(0);
        },
        onProgress: (progressValue) => {
          setProgress(progressValue);
          setDownloadProgress(progressValue);
          setDownloadStates(prev => ({
            ...prev,
            [zipId]: { isDownloading: true, progress: progressValue }
          }));
        },
        onComplete: () => {
          setProgress(0);
          setDownloadProgress(0);
          setDownloadStates(prev => ({
            ...prev,
            [zipId]: { isDownloading: false, progress: 100 }
          }));

          // Clear the download state after a short delay
          setTimeout(() => {
            setDownloadStates(prev => {
              const newState = { ...prev };
              delete newState[zipId];
              return newState;
            });
          }, 2000);
        },
        onError: (error) => {
          console.error('Download failed:', error);
          setProgress(0);
          setDownloadProgress(0);
          setDownloadStates(prev => ({
            ...prev,
            [zipId]: { isDownloading: false, progress: 0 }
          }));

          // Clear the download state after a short delay
          setTimeout(() => {
            setDownloadStates(prev => {
              const newState = { ...prev };
              delete newState[zipId];
              return newState;
            });
          }, 2000);
        }
      });
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="min-h-screen text-neutral-800 dark:text-white flex flex-col items-center bg-neutral-100 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>Editor Dashboard | ClipSesh</title>
        <meta
          name="description"
          content="ClipSesh Editor Dashboard - Process and download clip collections"
        />
      </Helmet>
      <div className='w-full'>
        <LoadingBar
          color='#f11946'
          height={4}
          progress={downloadProgress > 0 ? downloadProgress : progress}
          onLoaderFinished={() => {
            setProgress(0);
            setDownloadProgress(0);
          }}
        />
      </div>
      <div
        className="w-full flex h-[500px] justify-center items-center rounded-b-4xl overflow-hidden relative animate-fade mx-6"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        <div className="flex bg-gradient-to-b from-black/70 via-black/50 to-black/30 dark:from-neutral-900/80 dark:to-black/40 backdrop-blur-md justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center px-4 md:px-0 w-full">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-7xl sm:text-8xl md:text-9xl font-black text-white leading-tight mb-4 text-center drop-shadow-lg"
            >
              EDITOR DASHBOARD
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-4xl font-light text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-4 text-center drop-shadow-md"
            >
              Process and download seasonal clips
            </motion.h2>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full space-y-8"
        >

          {/* Header Section */}
          <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-lg shadow-sm">
                  <FaInfoCircle className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    Current Season Overview
                  </h2>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Track current season statistics and clip status
                  </p>
                </div>
              </div>

              {/* Season Info */}
              {seasonInfo.season && (
                <div className="hidden md:block bg-neutral-100 dark:bg-neutral-700/50 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600">
                  <div className="text-center">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Current Season</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-100 capitalize text-sm">
                      {seasonInfo.season}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm text-neutral-900 dark:text-white rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50 p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                className="bg-neutral-50 dark:bg-neutral-700/50 p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-600 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Total Clips</p>
                    <h3 className="text-3xl font-bold mt-1">{seasonInfo.clipAmount}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FaVideo className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-neutral-50 dark:bg-neutral-700/50 p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-600 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Approved Clips</p>
                    <h3 className="text-3xl font-bold mt-1">{seasonInfo.clipAmount - deniedClips}</h3>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FaCheck className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-neutral-50 dark:bg-neutral-700/50 p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-600 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Denied Clips</p>
                    <h3 className="text-3xl font-bold mt-1">{deniedClips}</h3>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <FaTimes className="text-red-600 dark:text-red-400" size={24} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-neutral-50 dark:bg-neutral-700/50 p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-600 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Approved/Denied</p>
                    <h3 className="text-lg font-bold mt-1">{getApprovedPercentage()}% / {getDeniedPercentage()}%</h3>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <FaPercentage className="text-orange-600 dark:text-red-400" size={24} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Available Archives */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-neutral-200/80 dark:border-neutral-700/50"
          >
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 rounded-lg shadow-sm">
                    <FaFileArchive className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                      Archive Management
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                      Download and manage seasonal clip archives
                    </p>
                  </div>
                </div>

                {/* Archive Stats */}
                {!zipsLoading && zips.length > 0 && (
                  <div className="hidden md:flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                        {zips.length}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Archives</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                        {zips.reduce((total, zip) => total + zip.clipAmount, 0)}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Clips</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-b border-neutral-300 dark:border-neutral-600">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('latest')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'latest'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-400 dark:hover:bg-neutral-500'
                    }`}
                >
                  <FaFileArchive /> Latest Archive
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'all'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-400 dark:hover:bg-neutral-500'
                    }`}
                >
                  <FaHistory /> All Archives
                </button>
              </div>
            </div>

            <div className="p-6">
              {zipsLoading ? (
                <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                  <p className="text-neutral-600 dark:text-neutral-400">Loading archives...</p>
                </div>
              ) : zips.length === 0 ? (
                <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-8 text-center">
                  <FaFileArchive className="text-4xl text-neutral-500 dark:text-neutral-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    No Archives Available
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {activeTab === 'latest'
                      ? 'No archives have been created yet. Process clips to create your first archive.'
                      : 'No archives available. Archives will appear here once clips are processed.'
                    }
                  </p>
                </div>
              ) : (
                (() => {
                  const sortedZips = [...zips].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                  const displayZips = activeTab === 'latest' ? sortedZips.slice(0, 1) : sortedZips;

                  return activeTab === 'latest' && displayZips.length > 0 ? (
                    // Latest Archive Display
                    <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-6 border border-neutral-400 dark:border-neutral-700">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.01 }}
                        className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-700/50 shadow-sm"
                      >
                        <div className="flex items-center gap-6">
                          <div className="p-4 bg-amber-500 rounded-full shadow-lg">
                            <FaFileArchive size={32} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-2xl text-neutral-800 dark:text-neutral-100 mb-1">
                              {displayZips[0].name}
                            </h3>
                            <div className="flex items-center gap-8 text-neutral-700 dark:text-neutral-300">
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-amber-600 dark:text-amber-400" />
                                <span className="font-medium">{displayZips[0].season} {displayZips[0].year}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaClipboard className="text-amber-600 dark:text-amber-400" />
                                <span className="font-medium">{displayZips[0].clipAmount} clips</span>
                              </div>
                              <span className="font-bold text-lg">{formatFileSize(displayZips[0].size)}</span>
                            </div>
                          </div>
                        </div>

                        <motion.button
                          onClick={() => handleDownload(displayZips[0]._id, displayZips[0].url, displayZips[0].name)}
                          whileHover={{ scale: downloadStates[displayZips[0]._id]?.isDownloading ? 1 : 1.1 }}
                          whileTap={{ scale: downloadStates[displayZips[0]._id]?.isDownloading ? 1 : 0.95 }}
                          disabled={downloadStates[displayZips[0]._id]?.isDownloading}
                          className={`${downloadStates[displayZips[0]._id]?.isDownloading
                            ? 'bg-amber-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            } text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center min-w-[64px] min-h-[64px]`}
                          title={downloadStates[displayZips[0]._id]?.isDownloading ? 'Downloading...' : 'Download Latest Archive'}
                        >
                          {downloadStates[displayZips[0]._id]?.isDownloading ? (
                            <div className="flex flex-col items-center">
                              <FaSpinner className="animate-spin" size={24} />
                              <span className="text-xs mt-1">
                                {downloadStates[displayZips[0]._id]?.progress || 0}%
                              </span>
                            </div>
                          ) : (
                            <FaDownload size={24} />
                          )}
                        </motion.button>
                      </motion.div>
                    </div>
                  ) : (
                    // All Archives Display
                    <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-4 space-y-4 max-h-96 overflow-y-auto border border-neutral-400 dark:border-neutral-700">
                      {displayZips.map(zip => (
                        <motion.div
                          key={zip._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className="flex justify-between items-center bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-neutral-300 dark:border-neutral-600"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                              <FaFileArchive size={24} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200">{zip.name}</h3>
                              <div className="flex items-center gap-6 text-sm text-neutral-700 dark:text-neutral-300 mt-1">
                                <div className="flex items-center gap-1">
                                  <FaCalendarAlt />
                                  <span>{zip.season} {zip.year}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FaClipboard />
                                  <span>{zip.clipAmount} clips</span>
                                </div>
                                <span className="font-medium">{formatFileSize(zip.size)}</span>
                              </div>
                            </div>
                          </div>

                          <motion.button
                            onClick={() => handleDownload(zip._id, zip.url, zip.name)}
                            whileHover={{ scale: downloadStates[zip._id]?.isDownloading ? 1 : 1.1 }}
                            whileTap={{ scale: downloadStates[zip._id]?.isDownloading ? 1 : 0.95 }}
                            disabled={downloadStates[zip._id]?.isDownloading}
                            className={`${downloadStates[zip._id]?.isDownloading
                              ? 'bg-amber-600 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                              } text-white p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center min-w-[48px] min-h-[48px]`}
                            title={downloadStates[zip._id]?.isDownloading ? 'Downloading...' : 'Download Archive'}
                          >
                            {downloadStates[zip._id]?.isDownloading ? (
                              <div className="flex flex-col items-center">
                                <FaSpinner className="animate-spin" size={14} />
                                <span className="text-xs mt-0.5">
                                  {downloadStates[zip._id]?.progress || 0}%
                                </span>
                              </div>
                            ) : (
                              <FaDownload size={18} />
                            )}
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default EditorDash;
