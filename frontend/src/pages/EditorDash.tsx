import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { saveAs } from 'file-saver';
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
  FaPercentage
} from 'react-icons/fa';
import { getCurrentSeason } from '../utils/seasonHelpers';

import { useCombinedConfig } from '../hooks/useConfig';
import { useClipsWithRatings } from '../hooks/useClips';
import { useZips } from '../hooks/useAdmin';
import { useCurrentUser } from '../hooks/useUser';

const EditorDash: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: config, isLoading: configLoading } = useCombinedConfig(user);
  const { data: clipsData, isLoading: clipsLoading } = useClipsWithRatings();
  const { data: zips = [], isLoading: zipsLoading } = useZips();

  const clips = clipsData?.clips || [];
  const ratings = clipsData?.ratings || {};

  const [progress, setProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'latest' | 'all'>('latest');

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
        <LoadingBar color='#f11946' height={4} progress={progress} onLoaderFinished={() => setProgress(0)} />
      </div>
      <div className="w-full flex h-96 justify-center items-center animate-fade"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)'
        }}>
        <div className="flex bg-gradient-to-b from-neutral-900 to-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold mb-4 text-center"
            >
              Editor Dashboard
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl mb-4 text-center"
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
          <div className="bg-neutral-300 dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 p-4 rounded-xl shadow-lg">
                  <FaInfoCircle className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">
                    Current Season Overview
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-300 mt-2">
                    Track current season statistics and clip status
                  </p>
                </div>
              </div>

              {/* Season Info */}
              {seasonInfo.season && (
                <div className="hidden md:block bg-neutral-200 dark:bg-neutral-700 px-4 py-2 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Current Season</div>
                    <div className="font-bold text-neutral-800 dark:text-neutral-100 capitalize">
                      {seasonInfo.season}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-blue-900/20 dark:to-blue-800/40 p-5 rounded-lg shadow"
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
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-green-900/20 dark:to-green-800/40 p-5 rounded-lg shadow"
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
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-red-900/20 dark:to-red-800/40 p-5 rounded-lg shadow"
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
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-orange-900/20 dark:to-orange-800/40 p-5 rounded-lg shadow"
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
            className="bg-neutral-200 dark:bg-neutral-700 rounded-xl shadow-lg overflow-hidden border border-neutral-300 dark:border-neutral-600"
          >
            <div className="p-6 border-b border-neutral-300 dark:border-neutral-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-amber-500 p-3 rounded-xl shadow-lg">
                    <FaFileArchive className="text-white text-xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                      Archive Management
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-300 mt-1">
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
                        className="flex justify-between items-center bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-6 rounded-lg border-2 border-amber-200 dark:border-amber-700 shadow-lg"
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
                          onClick={() => { saveAs(displayZips[0].url); }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                          title="Download Latest Archive"
                        >
                          <FaDownload size={24} />
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
