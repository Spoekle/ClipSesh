'use client';

import { useState } from 'react';
import { NavLink } from '@/lib/routerCompat';
import { Helmet } from '@/lib/helmetCompat';
import LoadingBar from 'react-top-loading-bar';
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
  FaSpinner,
} from 'react-icons/fa';
import { getCurrentSeason, compareSeasonYear } from '../utils/seasonHelpers';
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
    };
  }>({});
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const currentSeason = getCurrentSeason();
  const seasonInfo = {
    season: currentSeason.season,
    year: currentSeason.year,
    clipAmount: clips.length,
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deniedClips = clips.filter((clip) => {
    const ratingData = ratings[clip._id];
    if (!ratingData || !ratingData.ratings) {
      return false;
    }

    const denyRatings = ratingData.ratings.deny;
    return (
      denyRatings &&
      Array.isArray(denyRatings) &&
      denyRatings.length >= (config?.denyThreshold || 5)
    );
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
      setDownloadStates((prev) => ({
        ...prev,
        [zipId]: { isDownloading: true, progress: 0 },
      }));

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
          setDownloadStates((prev) => ({
            ...prev,
            [zipId]: { isDownloading: true, progress: progressValue },
          }));
        },
        onComplete: () => {
          setProgress(0);
          setDownloadProgress(0);
          setDownloadStates((prev) => ({
            ...prev,
            [zipId]: { isDownloading: false, progress: 100 },
          }));

          setTimeout(() => {
            setDownloadStates((prev) => {
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
          setDownloadStates((prev) => ({
            ...prev,
            [zipId]: { isDownloading: false, progress: 0 },
          }));

          setTimeout(() => {
            setDownloadStates((prev) => {
              const newState = { ...prev };
              delete newState[zipId];
              return newState;
            });
          }, 2000);
        },
      });
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] text-[#f1f1f1] flex flex-col bg-[#0f0f0f] transition-colors">
      <Helmet>
        <title>Editor Dashboard • ClipSesh</title>
        <meta
          name="description"
          content="ClipSesh Editor Dashboard - Process and download clip collections"
        />
      </Helmet>

      {/* Ambient background layer */}
      <div className="absolute top-0 left-0 w-full h-[320px] overflow-hidden pointer-events-none -z-10 select-none">
        <div
          className="w-full h-full bg-cover bg-center filter blur-[8px] opacity-20 transform scale-105"
          style={{
            backgroundImage: "url('/media/editor.webp')",
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(15,15,15,0) 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(15,15,15,0) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f0f]/60 to-[#0f0f0f]" />
      </div>

      <div className="w-full">
        <LoadingBar
          color="#f23030"
          height={3}
          progress={downloadProgress > 0 ? downloadProgress : progress}
          onLoaderFinished={() => {
            setProgress(0);
            setDownloadProgress(0);
          }}
        />
      </div>

      {/* CC Page Header Container (1200px centered) */}
      <div className="relative w-full overflow-hidden select-none">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm text-[#b3b3b3] mb-2">
            <NavLink to="/" className="hover:text-white transition-colors">
              Home
            </NavLink>
            <span className="text-[#626262] select-none">/</span>
            <span className="text-white font-medium">Editor</span>
          </nav>

          {/* Title row with signature CC Red Underline */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="relative pb-3 w-fit">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight uppercase">
                  EDITOR DASHBOARD
                </h1>
                {/* CC Red Bar: width 60%, height 2.5px */}
                <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-[#f23030] rounded-full" />
              </div>
              <p className="mt-3 text-sm sm:text-base text-[#b3b3b3] leading-relaxed max-w-xl">
                Review clip approval ratios and download seasonal clip archives for video editing.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Main 1200px Container */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-6 grow flex flex-col">

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full space-y-6"
        >
          {/* Season Overview Bar */}
          <div className="bg-[#181818] p-4 sm:p-5 rounded-xl border border-[#262626]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
                  <FaInfoCircle size={15} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-[#f1f1f1]">
                    Current Season Overview
                  </h2>
                  <p className="text-[#717171] text-xs">
                    Statistics and clip statuses for the active submission cycle
                  </p>
                </div>
              </div>

              {seasonInfo.season && (
                <div className="hidden md:block bg-[#121212] px-3.5 py-1.5 rounded-full border border-[#2a2a2a]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#717171]">Season:</span>
                    <span className="font-semibold text-[#f1f1f1] capitalize">
                      {seasonInfo.season}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Total Clips */}
            <div className="bg-[#181818] rounded-xl p-4 sm:p-5 border border-[#262626] flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#aaaaaa]">
                  Total Clips
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-[#f1f1f1]">
                  {seasonInfo.clipAmount}
                </h3>
              </div>
              <div className="w-9 h-9 bg-[#222222] text-neutral-300 rounded-lg flex items-center justify-center">
                <FaVideo size={16} />
              </div>
            </div>

            {/* Approved Clips */}
            <div className="bg-[#181818] rounded-xl p-4 sm:p-5 border border-[#262626] flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#aaaaaa]">
                  Approved Clips
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-[#f1f1f1]">
                  {seasonInfo.clipAmount - deniedClips}
                </h3>
              </div>
              <div className="w-9 h-9 bg-[#222222] text-neutral-300 rounded-lg flex items-center justify-center">
                <FaCheck size={16} />
              </div>
            </div>

            {/* Denied Clips */}
            <div className="bg-[#181818] rounded-xl p-4 sm:p-5 border border-[#262626] flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#aaaaaa]">
                  Denied Clips
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-[#f1f1f1]">
                  {deniedClips}
                </h3>
              </div>
              <div className="w-9 h-9 bg-[#222222] text-neutral-300 rounded-lg flex items-center justify-center">
                <FaTimes size={16} />
              </div>
            </div>

            {/* Approval Ratio */}
            <div className="bg-[#181818] rounded-xl p-4 sm:p-5 border border-[#262626] flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#aaaaaa]">
                  Approval Ratio
                </p>
                <h3 className="text-lg sm:text-xl font-bold mt-1 text-[#f1f1f1]">
                  {getApprovedPercentage()}% / {getDeniedPercentage()}%
                </h3>
              </div>
              <div className="w-9 h-9 bg-[#222222] text-neutral-300 rounded-lg flex items-center justify-center">
                <FaPercentage size={16} />
              </div>
            </div>
          </div>

          {/* Archive Management Section */}
          <div className="bg-[#181818] rounded-xl shadow-sm overflow-hidden border border-[#262626]">
            <div className="p-4 sm:p-5 border-b border-[#262626]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
                    <FaFileArchive size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-[#f1f1f1]">
                      Archive Management
                    </h2>
                    <p className="text-[#717171] text-xs">
                      Download and manage packaged seasonal clip archives
                    </p>
                  </div>
                </div>

                {!zipsLoading && zips.length > 0 && (
                  <div className="hidden sm:flex items-center space-x-5 text-right">
                    <div>
                      <div className="text-base font-bold text-[#f1f1f1]">{zips.length}</div>
                      <div className="text-[10px] text-[#717171]">Total Archives</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-[#f1f1f1]">
                        {zips.reduce((total, zip) => total + zip.clipAmount, 0)}
                      </div>
                      <div className="text-[10px] text-[#717171]">Total Clips</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Archive Tabs */}
            <div className="p-3.5 border-b border-[#262626] bg-[#141414]">
              <div className="inline-flex p-1 bg-[#121212] rounded-full border border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setActiveTab('latest')}
                  className={`py-1 px-3.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                    activeTab === 'latest'
                      ? 'bg-[#f1f1f1] text-[#0f0f0f] font-semibold shadow-xs'
                      : 'text-[#aaaaaa] hover:text-white'
                  }`}
                >
                  <FaFileArchive size={11} />
                  <span>Latest Archive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`py-1 px-3.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'bg-[#f1f1f1] text-[#0f0f0f] font-semibold shadow-xs'
                      : 'text-[#aaaaaa] hover:text-white'
                  }`}
                >
                  <FaHistory size={11} />
                  <span>All Archives ({zips.length})</span>
                </button>
              </div>
            </div>

            {/* Archive Body */}
            <div className="p-5">
              {zipsLoading ? (
                <div className="bg-[#121212] rounded-xl p-8 text-center border border-[#262626]">
                  <div className="w-7 h-7 border-2 border-[#262626] border-t-[#f23030] rounded-full animate-spin mx-auto mb-2.5" />
                  <p className="text-xs text-[#aaaaaa]">Loading archives...</p>
                </div>
              ) : zips.length === 0 ? (
                <div className="bg-[#121212] rounded-xl p-8 text-center border border-[#262626]">
                  <div className="w-12 h-12 rounded-full bg-[#181818] border border-[#2a2a2a] text-[#717171] flex items-center justify-center mx-auto mb-2.5">
                    <FaFileArchive size={18} />
                  </div>
                  <h4 className="text-sm font-semibold text-[#f1f1f1] mb-1">
                    No Archives Available
                  </h4>
                  <p className="text-xs text-[#aaaaaa]">
                    {activeTab === 'latest'
                      ? 'No archives have been created yet. Process clips to create your first archive.'
                      : 'No archives available. Archives will appear here once clips are processed.'}
                  </p>
                </div>
              ) : (
                (() => {
                  const sortedZips = [...zips].sort(compareSeasonYear);
                  const displayZips =
                    activeTab === 'latest' ? sortedZips.slice(0, 1) : sortedZips;

                  return activeTab === 'latest' && displayZips.length > 0 ? (
                    /* Latest Archive Card */
                    <div className="bg-[#121212] rounded-xl p-5 border border-[#262626]">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#181818] p-4.5 rounded-xl border border-[#262626]">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 bg-[#222222] text-[#f1f1f1] rounded-lg flex items-center justify-center shrink-0 border border-[#2e2e2e]">
                            <FaFileArchive size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base text-[#f1f1f1] mb-1">
                              {displayZips[0].name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3.5 text-xs text-[#aaaaaa]">
                              <div className="flex items-center gap-1.5">
                                <FaCalendarAlt size={11} className="text-[#f23030]" />
                                <span className="capitalize">
                                  {displayZips[0].season} {displayZips[0].year}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FaClipboard size={11} className="text-[#717171]" />
                                <span>{displayZips[0].clipAmount} clips</span>
                              </div>
                              <span className="font-semibold text-neutral-300">
                                {formatFileSize(displayZips[0].size)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(
                              displayZips[0]._id,
                              displayZips[0].url,
                              displayZips[0].name
                            )
                          }
                          disabled={downloadStates[displayZips[0]._id]?.isDownloading}
                          className={`rounded-full px-5 py-2 text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors ${
                            downloadStates[displayZips[0]._id]?.isDownloading
                              ? 'bg-[#222222] text-[#aaaaaa] cursor-not-allowed border border-[#2e2e2e]'
                              : 'bg-[#f23030] hover:bg-[#d92222] text-white'
                          }`}
                          title={
                            downloadStates[displayZips[0]._id]?.isDownloading
                              ? 'Downloading...'
                              : 'Download Latest Archive'
                          }
                        >
                          {downloadStates[displayZips[0]._id]?.isDownloading ? (
                            <div className="flex items-center gap-2">
                              <FaSpinner className="animate-spin" size={13} />
                              <span>{downloadStates[displayZips[0]._id]?.progress || 0}%</span>
                            </div>
                          ) : (
                            <>
                              <FaDownload size={12} />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* All Archives List */
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {displayZips.map((zip) => (
                        <div
                          key={zip._id}
                          className="flex justify-between items-center bg-[#121212] p-3.5 sm:p-4 rounded-xl border border-[#262626] hover:border-[#383838] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#181818] text-neutral-300 rounded-lg flex items-center justify-center shrink-0 border border-[#2a2a2a]">
                              <FaFileArchive size={15} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-xs sm:text-sm text-[#f1f1f1]">
                                {zip.name}
                              </h3>
                              <div className="flex items-center gap-3 text-[11px] text-[#aaaaaa] mt-0.5 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <FaCalendarAlt size={10} className="text-[#f23030]" />
                                  <span className="capitalize">
                                    {zip.season} {zip.year}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FaClipboard size={10} className="text-[#717171]" />
                                  <span>{zip.clipAmount} clips</span>
                                </div>
                                <span className="font-medium text-neutral-300">
                                  {formatFileSize(zip.size)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownload(zip._id, zip.url, zip.name)}
                            disabled={downloadStates[zip._id]?.isDownloading}
                            className={`rounded-full p-2.5 min-w-[34px] min-h-[34px] flex items-center justify-center transition-colors ${
                              downloadStates[zip._id]?.isDownloading
                                ? 'bg-[#222222] text-[#aaaaaa] cursor-not-allowed border border-[#2e2e2e]'
                                : 'bg-[#181818] hover:bg-[#222222] border border-[#2a2a2a] hover:border-[#383838] text-[#f1f1f1]'
                            }`}
                            title={
                              downloadStates[zip._id]?.isDownloading
                                ? 'Downloading...'
                                : 'Download Archive'
                            }
                          >
                            {downloadStates[zip._id]?.isDownloading ? (
                              <div className="flex flex-col items-center">
                                <FaSpinner className="animate-spin" size={12} />
                                <span className="text-[9px] mt-0.5">
                                  {downloadStates[zip._id]?.progress || 0}%
                                </span>
                              </div>
                            ) : (
                              <FaDownload size={12} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditorDash;
