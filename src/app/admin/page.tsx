'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers,
  FaCog,
  FaChartBar,
  FaFlag,
  FaFilm,
  FaBan,
  FaArchive,
  FaCheckCircle,
  FaLayerGroup,
  FaDiscord,
  FaChevronDown,
  FaChevronUp,
  FaSyncAlt,
  FaTimes,
  FaStop,
} from "react-icons/fa";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DeniedClips from './components/ContentManagement/DeniedClips';
import UserList from './components/UserManagement/UserList';
import Statistics from './components/Overview/Statistics';
import ConfigPanel from './components/Configuration/ConfigPanel';
import SeasonArchiveManager from './components/ContentManagement/SeasonArchiveManager';
import DiscordScraper from './components/ContentManagement/DiscordScraper';
import ReportsManagement from './components/Reports/ReportsManagement';
import { getCurrentSeason } from '@/lib/seasonHelpers';
import { Clip, ProcessJobStatus } from '@/types/adminTypes';
import ProcessClipsModal from './components/ProcessClipsModal';
import useSocket from '@/hooks/useSocket';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import RequireAuth from '@/components/RequireAuth';

import { getAllProcessingJobs, forceCompleteProcessJob, cancelProcessingJob, dismissProcessJob } from '@/services/adminService';
import { safeLocalStorage } from '@/utils/storage';

import {
  useAllUsers,
  useAdminConfig,
  useAdminStats,
  useClipsWithRatings,
  useZips,
  useDeleteZip,
  useApproveUser,
  useDeleteUser,
  useProcessClips,
  useReports
} from '@/hooks/useAdmin';
import { useNotification } from '@/context/AlertContext';

type TabName = 'overview' | 'users' | 'content' | 'config' | 'reports';
type ContentSubTab = 'pipeline' | 'denied' | 'scraper';

function AdminDash() {
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [activeContentSubTab, setActiveContentSubTab] = useState<ContentSubTab>('pipeline');
  const [selectedScraperChannel, setSelectedScraperChannel] = useState<string>('');

  const { data: allUsers = [], isLoading: usersLoading } = useAllUsers();
  const { data: configData, isLoading: configLoading } = useAdminConfig();
  const { data: adminStats, isLoading: statsLoading } = useAdminStats();
  const { data: clipsData, isLoading: clipsLoading } = useClipsWithRatings();
  const { data: zips = [], isLoading: zipsLoading } = useZips();
  const { data: pendingReportsData } = useReports('pending');
  const { showSuccess, showError, showWarning, showAlertModal } = useNotification();

  const deleteZipMutation = useDeleteZip();
  const deleteUserMutation = useDeleteUser();
  const processClipsMutation = useProcessClips();

  const clips = clipsData?.clips || [];
  const ratings = clipsData?.ratings || {};
  const config = configData ? {
    denyThreshold: configData.admin?.denyThreshold ?? 5,
    latestVideoLink: configData.public?.latestVideoLink ?? '',
    clipChannelIds: configData.admin?.clipChannelIds ?? [],
    blacklistedSubmitters: configData.admin?.blacklistedSubmitters ?? [],
    blacklistedStreamers: configData.admin?.blacklistedStreamers ?? []
  } : {
    denyThreshold: 5,
    latestVideoLink: '',
    clipChannelIds: [],
    blacklistedSubmitters: [],
    blacklistedStreamers: []
  };

  const admins = allUsers.filter(user => user.roles?.includes('admin') || false);
  const clipTeam = allUsers.filter(user => user.roles?.includes('clipteam') || false);
  const disabledUsers = allUsers.filter(user => user.status === 'disabled');

  const AVAILABLE_ROLES = ['user', 'admin', 'editor', 'uploader', 'clipteam'];

  const fetchUsers = () => { };
  const fetchZips = () => { };
  const fetchClipsAndRatings = () => { };
  const setDisabledUsers = () => { };
  const downloading = false;

  const [progress, setProgress] = useState<number>(0);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const seasonInfo = useMemo(() => {
    const { season, year } = getCurrentSeason();
    const clipAmount = clips.length;
    return {
      season,
      year,
      clipAmount
    };
  }, [clips]);

  const userRatings = useMemo(() => {
    if (Object.keys(ratings).length === 0) return [];

    const userRatingCount: Record<string, any> = {};

    [...clipTeam, ...admins]
      .filter(user => user.username !== 'UploadBot')
      .forEach(user => {
        userRatingCount[user.username] = { '1': 0, '2': 0, '3': 0, '4': 0, 'deny': 0, total: 0, percentageRated: 0 };
      });

    const clipLength = Object.keys(ratings).length;

    Object.keys(ratings).forEach(clipId => {
      const clipRatingData = ratings[clipId].ratings;

      if (!clipRatingData) {
        return;
      }

      const ratingLevels = ['1', '2', '3', '4', 'deny'] as const;
      ratingLevels.forEach(rating => {
        const usersWithThisRating = clipRatingData[rating];

        if (Array.isArray(usersWithThisRating)) {
          usersWithThisRating.forEach(userObj => {
            const username = userObj.username;
            if (userRatingCount[username]) {
              if (userRatingCount[username][rating] !== undefined) {
                userRatingCount[username][rating]++;
                userRatingCount[username].total++;
              }
            }
          });
        }
      });
    });

    Object.keys(userRatingCount).forEach(username => {
      userRatingCount[username].percentageRated = (userRatingCount[username].total / (seasonInfo.clipAmount || clipLength)) * 100;
    });

    const userRatingCounts = Object.keys(userRatingCount).map(username => ({
      username,
      ...userRatingCount[username]
    }));

    return userRatingCounts.sort((a, b) => b.total - a.total);
  }, [ratings, clipTeam, admins, seasonInfo.clipAmount]);

  const clipStats = useMemo(() => {
    const totalClips = clips.length;

    let ratedClips = 0;
    let deniedClips = 0;

    Object.keys(ratings).forEach(clipId => {
      const clipRatingData = ratings[clipId]?.ratings;
      if (clipRatingData) {
        const ratingLevels = ['1', '2', '3', '4', 'deny'] as const;
        const hasRatings = ratingLevels.some(rating =>
          clipRatingData[rating] && Array.isArray(clipRatingData[rating]) && clipRatingData[rating].length > 0
        );

        if (hasRatings) {
          ratedClips++;
        }

        if (clipRatingData.deny && Array.isArray(clipRatingData.deny) && clipRatingData.deny.length >= config.denyThreshold) {
          deniedClips++;
        }
      }
    });

    const unratedClips = totalClips - ratedClips;

    return {
      totalClips,
      ratedClips,
      unratedClips,
      deniedClips
    };
  }, [clips, ratings, config.denyThreshold]);

  const [processModalOpen, setProcessModalOpen] = useState<boolean>(false);
  const [processingClips, setProcessingClips] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [processJobId, setProcessJobId] = useState<string | null>(null);

  // Compilation background tasks state (persists across page reloads/transitions)
  const [processJobs, setProcessJobs] = useState<ProcessJobStatus[]>([]);
  const [selectedProcessJobId, setSelectedProcessJobId] = useState<string | null>(null);
  const [isProcessWidgetExpanded, setIsProcessWidgetExpanded] = useState<boolean>(false);
  const [dismissedProcessJobIds, setDismissedProcessJobIds] = useState<Set<string>>(() => {
    const stored = safeLocalStorage.getItem('clipsesh_dismissed_process_jobs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      } catch {}
    }
    return new Set();
  });

  const prevProcessJobStatusRef = useRef<Record<string, string>>({});
  const processLogsContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync dismissed process jobs from localStorage on mount
  useEffect(() => {
    const stored = safeLocalStorage.getItem('clipsesh_dismissed_process_jobs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDismissedProcessJobIds(new Set(parsed));
        }
      } catch {}
    }
  }, []);

  const [showDeleteUserConfirmation, setShowDeleteUserConfirmation] = useState<boolean>(false);
  const [currentYear, setCurrentYear] = useState<number>(seasonInfo.year || new Date().getFullYear());

  const loading = usersLoading || configLoading || statsLoading || clipsLoading || zipsLoading;

  const searchParams = useSearchParams();
  const { isConnected } = useSocket();

  // Handle URL parameters for tab switching
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'users', 'content', 'config', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam as TabName);
    }
  }, [searchParams]);

  useEffect(() => {
    if (clips.length > 0) {
      getSeason();
    }
  }, [clips]);

  useEffect(() => {
    if (!usersLoading) setProgress(prev => Math.max(prev, 20));
    if (!configLoading) setProgress(prev => Math.max(prev, 40));
    if (!statsLoading) setProgress(prev => Math.max(prev, 60));
    if (!clipsLoading) setProgress(prev => Math.max(prev, 80));
    if (!zipsLoading) setProgress(prev => Math.max(prev, 100));
  }, [usersLoading, configLoading, statsLoading, clipsLoading, zipsLoading]);

  const deleteZip = async (zipId: string): Promise<void> => {
    try {
      await deleteZipMutation.mutateAsync(zipId);
    } catch (error) {
      console.error('Error deleting zip:', error);
      throw error;
    }
  };

  const confirmDeleteUser = async (): Promise<void> => {
    if (!userToDelete) return;

    setShowDeleteUserConfirmation(false);
    try {
      await deleteUserMutation.mutateAsync(userToDelete);
      showSuccess('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Failed to delete user. Please try again.');
    } finally {
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = (): void => {
    setShowDeleteUserConfirmation(false);
    setUserToDelete(null);
  };

  // Fetch all process jobs on mount
  const fetchAllProcessJobs = async (selectNewest = false) => {
    try {
      const res = await getAllProcessingJobs();
      if (res.success && Array.isArray(res.jobs)) {
        setProcessJobs(res.jobs);
        res.jobs.forEach((job) => {
          if (job.jobId) {
            prevProcessJobStatusRef.current[job.jobId] = job.status;
          }
        });

        if (selectNewest && res.jobs.length > 0 && res.jobs[0].jobId) {
          setSelectedProcessJobId(res.jobs[0].jobId);
        } else {
          setSelectedProcessJobId((curr) => {
            if (curr && res.jobs.some((j) => j.jobId === curr && !dismissedProcessJobIds.has(j.jobId))) return curr;
            const active = res.jobs.find((j) => j.status === 'processing' && j.jobId);
            if (active?.jobId) return active.jobId;
            const firstVisible = res.jobs.find((j) => j.jobId && !dismissedProcessJobIds.has(j.jobId));
            return firstVisible?.jobId || null;
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch existing process jobs:', err);
    }
  };

  useEffect(() => {
    fetchAllProcessJobs();
  }, []);

  // Poll when any job is actively processing
  const hasActiveProcessing = useMemo(() => {
    return processJobs.some((job) => job.status === 'processing');
  }, [processJobs]);

  useEffect(() => {
    if (!hasActiveProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await getAllProcessingJobs();
        if (res.success && Array.isArray(res.jobs)) {
          setProcessJobs(res.jobs);

          res.jobs.forEach((job) => {
            if (!job.jobId) return;
            const prevStatus = prevProcessJobStatusRef.current[job.jobId];
            if (prevStatus === 'processing') {
              if (job.status === 'completed') {
                showSuccess(`Compilation complete! Created ZIP for ${job.season} ${job.year}.`);
                fetchZips();
              } else if (job.status === 'error') {
                showError(job.error || `Compilation job for ${job.season} ${job.year} failed.`);
              }
            }
            prevProcessJobStatusRef.current[job.jobId] = job.status;
          });
        }
      } catch (err: any) {
        console.error('Error polling processing tasks:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [hasActiveProcessing, showSuccess, showError, fetchZips]);

  // Visible jobs (filter out dismissed, unless processing)
  const visibleProcessJobs = useMemo(() => {
    return processJobs.filter(
      (j) => (j.jobId && !dismissedProcessJobIds.has(j.jobId)) || j.status === 'processing'
    );
  }, [processJobs, dismissedProcessJobIds]);

  const currentProcessJob = useMemo(() => {
    if (visibleProcessJobs.length === 0) return null;
    const found = visibleProcessJobs.find((j) => j.jobId === selectedProcessJobId);
    return found || visibleProcessJobs[0];
  }, [visibleProcessJobs, selectedProcessJobId]);

  // Auto-scroll logs
  useEffect(() => {
    if (isProcessWidgetExpanded && processLogsContainerRef.current) {
      processLogsContainerRef.current.scrollTop = processLogsContainerRef.current.scrollHeight;
    }
  }, [currentProcessJob?.logs, isProcessWidgetExpanded]);

  const handleDismissProcessJob = (jobId: string) => {
    setDismissedProcessJobIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      safeLocalStorage.setItem('clipsesh_dismissed_process_jobs', JSON.stringify(Array.from(next)));
      return next;
    });

    setSelectedProcessJobId((curr) => {
      if (curr === jobId) {
        const remaining = visibleProcessJobs.filter((j) => j.jobId !== jobId);
        return remaining[0]?.jobId || null;
      }
      return curr;
    });

    if (visibleProcessJobs.filter((j) => j.jobId !== jobId).length === 0) {
      setIsProcessWidgetExpanded(false);
    }

    dismissProcessJob(jobId).catch((err) => {
      console.warn('Could not dismiss process job on server:', err);
    });
  };

  const handleDismissAllProcessJobs = () => {
    const finishedJobs = processJobs.filter((j) => j.status !== 'processing' && j.jobId);
    const finishedIds = finishedJobs.map((j) => j.jobId as string);

    setDismissedProcessJobIds((prev) => {
      const next = new Set(prev);
      finishedIds.forEach((id) => next.add(id));
      safeLocalStorage.setItem('clipsesh_dismissed_process_jobs', JSON.stringify(Array.from(next)));
      return next;
    });

    setIsProcessWidgetExpanded(false);

    finishedIds.forEach((id) => {
      dismissProcessJob(id).catch(() => {});
    });
  };

  const handleForceCompleteProcess = async (jobId: string) => {
    try {
      await forceCompleteProcessJob(jobId);
      showWarning('Job manually completed.');
      await fetchAllProcessJobs();
      fetchZips();
    } catch (err: any) {
      showError(err?.message || 'Failed to force complete job');
    }
  };

  const handleCancelProcessJob = async (jobId: string) => {
    try {
      showWarning('Cancelling ZIP compilation...');
      await cancelProcessingJob(jobId);
      showSuccess('Compilation cancelled');
      await fetchAllProcessJobs();
    } catch (err: any) {
      showError(err?.message || 'Failed to cancel compilation');
    }
  };

  const processClips = async (season: string, year: number): Promise<void> => {
    setProcessingClips(true);
    setProcessProgress(0);

    const filteredClips = clips.filter((clip) => {
      if (!clip._id) {
        console.warn('Clip without ID found:', clip);
        return false;
      }

      const clipSeason = clip.season?.toLowerCase();
      const clipYear = clip.year;
      const selectedSeason = season.toLowerCase();

      return clipSeason === selectedSeason && clipYear === year;
    });

    if (filteredClips.length === 0) {
      showAlertModal({
        title: 'No Clips to Process',
        message: 'No clips to process. All clips have been denied or are invalid for this season.',
        type: 'warning'
      });
      setProcessingClips(false);
      setProcessModalOpen(false);
      return;
    }

    try {
      const processData = {
        clips: filteredClips.map((clip, index) => {
          const ratingData = ratings[clip._id];

          if (ratingData && !ratingData.ratingCounts && ratingData.ratings) {
            const ratingsObj = ratingData.ratings as any;
            ratingData.ratingCounts = Object.keys(ratingsObj).map(rating => ({
              rating: rating,
              count: ratingsObj[rating]?.length || 0,
              users: ratingsObj[rating] || []
            }));
          }

          if (!ratingData || !ratingData.ratingCounts || !Array.isArray(ratingData.ratingCounts) || !ratingData.ratingCounts.length) {
            return { ...clip, rating: '3', index };
          }

          let totalRatingSum = 0;
          let totalRatingCount = 0;

          ratingData.ratingCounts.forEach(rateData => {
            if (rateData.rating !== 'deny' && rateData.count > 0) {
              const numericRating = parseInt(rateData.rating);

              if (!isNaN(numericRating) && numericRating >= 1 && numericRating <= 4) {
                totalRatingSum += numericRating * rateData.count;
                totalRatingCount += rateData.count;
              }
            }
          });

          const hasActualRatings = ratingData.ratingCounts.some(rateData => rateData.count > 0);

          let averageRating = '3';
          if (totalRatingCount > 0) {
            const avgValue = totalRatingSum / totalRatingCount;
            const roundedRating = Math.max(1, Math.min(4, Math.round(avgValue)));
            averageRating = roundedRating.toString();
          } else if (!hasActualRatings) {
            return null;
          }

          return { ...clip, rating: averageRating, index };
        }).filter((clip): clip is Clip & { rating: string; index: number } => clip !== null),
        season: season,
        year: year
      };

      // Close modal right away so user sees the task in bottom right corner
      setProcessModalOpen(false);
      showSuccess(`Starting ZIP compilation for ${season} ${year}...`);

      const response = await processClipsMutation.mutateAsync(processData);

      const { jobId } = response;
      setProcessJobId(jobId);

      if (jobId) {
        setDismissedProcessJobIds((prev) => {
          if (prev.has(jobId)) {
            const next = new Set(prev);
            next.delete(jobId);
            safeLocalStorage.setItem('clipsesh_dismissed_process_jobs', JSON.stringify(Array.from(next)));
            return next;
          }
          return prev;
        });
      }

      // Re-fetch all compilation jobs and select the new one
      await fetchAllProcessJobs(true);
      if (jobId) setSelectedProcessJobId(jobId);
      setIsProcessWidgetExpanded(false);
    } catch (error: any) {
      console.error('Error processing clips:', error);
      setProcessingClips(false);
      showError(error?.message || 'Failed to start processing clips. Please try again.');
    }
  };

  const getSeason = (): void => {
    const { year } = getCurrentSeason();
    setCurrentYear(year);
  };

  const openProcessModal = async (): Promise<void> => {
    try {
      await fetchClipsAndRatings();
    } catch (error) {
      console.error('Error refreshing clip data before processing:', error);
    }
    setProcessModalOpen(true);
  };

  const SkeletonBox = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-[#222222] rounded ${className}`}></div>
  );

  const pendingReportsCount = pendingReportsData?.pendingCount || pendingReportsData?.total || 0;
  const reviewedPercent = seasonInfo.clipAmount > 0
    ? Math.round((clipStats.ratedClips / seasonInfo.clipAmount) * 100)
    : 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Statistics
            clipTeam={clipTeam}
            userRatings={userRatings}
            seasonInfo={seasonInfo}
            clipStats={clipStats}
            loading={loading}
          />
        );
      case 'users':
        return (
          <UserList
            fetchUsers={fetchUsers}
            disabledUsers={disabledUsers}
            setDisabledUsers={setDisabledUsers}
            AVAILABLE_ROLES={AVAILABLE_ROLES}
          />
        );
      case 'content':
        return (
          <div className="space-y-6">
            {/* Content Sub-Tab Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#262626]">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#181818] border border-[#262626] rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveContentSubTab('pipeline')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeContentSubTab === 'pipeline'
                      ? 'bg-[#f23030] text-white shadow-xs'
                      : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
                  }`}
                >
                  <FaArchive size={12} />
                  <span>Processing & Archives</span>
                  {zips.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        activeContentSubTab === 'pipeline'
                          ? 'bg-white/20 text-white'
                          : 'bg-[#262626] text-[#888888]'
                      }`}
                    >
                      {zips.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveContentSubTab('denied')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeContentSubTab === 'denied'
                      ? 'bg-[#f23030] text-white shadow-xs'
                      : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
                  }`}
                >
                  <FaBan size={12} />
                  <span>Denied Submissions</span>
                  {clipStats.deniedClips > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        activeContentSubTab === 'denied'
                          ? 'bg-white/20 text-white'
                          : 'bg-rose-500/20 text-rose-400 font-semibold'
                      }`}
                    >
                      {clipStats.deniedClips}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveContentSubTab('scraper')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeContentSubTab === 'scraper'
                      ? 'bg-[#f23030] text-white shadow-xs'
                      : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
                  }`}
                >
                  <FaDiscord
                    size={13}
                    className={activeContentSubTab === 'scraper' ? 'text-white' : 'text-[#5865F2]'}
                  />
                  <span>Discord Scraper</span>
                  {config.clipChannelIds && config.clipChannelIds.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        activeContentSubTab === 'scraper'
                          ? 'bg-white/20 text-white'
                          : 'bg-[#262626] text-[#888888]'
                      }`}
                    >
                      {config.clipChannelIds.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Sub-tab quick status / indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#717171]">
                <span>Content Section:</span>
                <span className="font-semibold text-white">
                  {activeContentSubTab === 'pipeline' && 'Season Lifecycles & ZIP Archives'}
                  {activeContentSubTab === 'denied' && 'Community Denied Clip Pool'}
                  {activeContentSubTab === 'scraper' && 'Discord Submissions Importer'}
                </span>
              </div>
            </div>

            {/* Sub-tab content */}
            {activeContentSubTab === 'pipeline' && (
              <SeasonArchiveManager
                openProcessModal={openProcessModal}
                downloading={downloading}
                loading={loading}
                zips={zips}
                zipsLoading={zipsLoading}
                deleteZip={deleteZip}
                seasonInfo={seasonInfo}
                activeClipsCount={clips.filter((c) => !c.archived).length}
              />
            )}

            {activeContentSubTab === 'denied' && (
              <DeniedClips
                clips={clips}
                ratings={ratings}
                config={config}
              />
            )}

            {activeContentSubTab === 'scraper' && (
              <DiscordScraper
                configuredChannels={config.clipChannelIds}
                initialChannelId={selectedScraperChannel}
              />
            )}
          </div>
        );
      case 'config':
        return (
          <ConfigPanel
            config={config}
            onOpenScraper={(chId) => {
              if (chId) setSelectedScraperChannel(chId);
              setActiveTab('content');
              setActiveContentSubTab('scraper');
            }}
          />
        );
      case 'reports':
        return <ReportsManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] text-[#f1f1f1] flex flex-col bg-[#0f0f0f] transition-colors">
      {/* CC Page Header Container (1200px centered) */}
      <div className="relative w-full overflow-hidden select-none">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm text-[#b3b3b3] mb-2">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-[#626262] select-none">/</span>
            <span className="text-white font-medium">Admin</span>
          </nav>

          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="relative pb-3 w-fit">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight uppercase">
                  ADMIN DASHBOARD
                </h1>
                {/* CC Red Bar: width 60%, height 2.5px */}
                <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-[#f23030] rounded-full" />
              </div>
              <p className="mt-3 text-sm sm:text-base text-[#b3b3b3] leading-relaxed max-w-xl">
                Operations console for clip reviews, reviewer quota tracking, user access, and pipeline packaging.
              </p>
            </div>


          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-6 grow flex flex-col">

        {/* Executive Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#181818] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] flex items-center justify-center flex-shrink-0">
              <FaLayerGroup size={14} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-[#717171] block truncate">Clip Pool</span>
              <span className="text-sm sm:text-base font-bold text-[#f1f1f1]">
                {seasonInfo.clipAmount} <span className="text-[11px] font-normal text-[#aaaaaa]">clips</span>
              </span>
            </div>
          </div>

          <div className="bg-[#181818] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center flex-shrink-0">
              <FaCheckCircle size={14} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-[#717171] block truncate">Review Progress</span>
              <span className="text-sm sm:text-base font-bold text-[#f1f1f1]">
                {reviewedPercent}% <span className="text-[11px] font-normal text-[#aaaaaa]">({clipStats.ratedClips})</span>
              </span>
            </div>
          </div>

          <div className="bg-[#181818] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f97316]/15 text-[#f97316] flex items-center justify-center flex-shrink-0">
              <FaUsers size={14} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-[#717171] block truncate">Review Team</span>
              <span className="text-sm sm:text-base font-bold text-[#f1f1f1]">
                {clipTeam.length + admins.length} <span className="text-[11px] font-normal text-[#aaaaaa]">staff</span>
              </span>
            </div>
          </div>

          <div className="bg-[#181818] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f23030]/15 text-[#f23030] flex items-center justify-center flex-shrink-0">
              <FaFlag size={14} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-[#717171] block truncate">Open Reports</span>
              <span className="text-sm sm:text-base font-bold text-[#f1f1f1]">
                {pendingReportsCount} <span className="text-[11px] font-normal text-[#aaaaaa]">pending</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#181818] rounded-2xl border border-[#262626]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-150 text-xs font-semibold cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#f23030] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
              }`}
            >
              <FaChartBar size={13} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-150 text-xs font-semibold cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#f23030] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
              }`}
            >
              <FaUsers size={13} />
              <span>Users</span>
              {allUsers.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-[#222222] text-[#717171]'
                }`}>
                  {allUsers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-150 text-xs font-semibold cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-[#f23030] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
              }`}
            >
              <FaFilm size={13} />
              <span>Content</span>
              {clips.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'content' ? 'bg-white/20 text-white' : 'bg-[#222222] text-[#717171]'
                }`}>
                  {clips.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-150 text-xs font-semibold cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-[#f23030] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
              }`}
            >
              <FaCog size={13} />
              <span>Configuration</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-150 text-xs font-semibold cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#f23030] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
              }`}
            >
              <FaFlag size={13} />
              <span>Reports</span>
              {pendingReportsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-[#eab308]/20 text-[#eab308]'
                }`}>
                  {pendingReportsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {renderTabContent()}
        </div>
      </div>

      <ProcessClipsModal
        isOpen={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        onProcess={processClips}
        onProcessingComplete={fetchZips}
        processing={false}
        progress={processProgress}
        currentSeason={seasonInfo.season || ''}
        currentYear={seasonInfo.year || currentYear}
        clipCount={clips.filter(clip => {
          const clipSeason = clip.season?.toLowerCase();
          const clipYear = clip.year;
          const currentSeason = seasonInfo.season?.toLowerCase();

          if (clipSeason !== currentSeason || clipYear !== seasonInfo.year) {
            return false;
          }

          const ratingData = ratings[clip._id];
          return (
            ratingData &&
            ratingData.ratingCounts &&
            Array.isArray(ratingData.ratingCounts) &&
            ratingData.ratingCounts.every(
              (rateData) => rateData.rating !== 'deny' || rateData.count < config.denyThreshold
            )
          );
        }).length}
        processJobId={processJobId}
        clips={clips}
        ratings={ratings}
        denyThreshold={config.denyThreshold}
      />

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showDeleteUserConfirmation}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
      />

      {/* Floating Bottom-Right ZIP Compilation Tasks Widget */}
      {visibleProcessJobs.length > 0 && (
        <div
          className={
            activeTab === 'content' && activeContentSubTab === 'scraper'
              ? 'fixed bottom-24 sm:bottom-28 right-4 sm:right-6 z-40'
              : 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50'
          }
        >
          <AnimatePresence mode="wait">
            {!isProcessWidgetExpanded ? (
              /* Compact Overview Pill / Card */
              <motion.div
                key="compact-process-widget"
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsProcessWidgetExpanded(true)}
                className="w-80 sm:w-96 bg-[#181818]/95 backdrop-blur-md border border-[#333] hover:border-[#555] rounded-2xl p-3.5 shadow-2xl shadow-black/70 cursor-pointer transition-all duration-200 group select-none"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {currentProcessJob?.status === 'processing' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    ) : currentProcessJob?.status === 'completed' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white tracking-wide truncate">
                      ZIP Pipeline
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#222] text-[#aaa] border border-[#333] shrink-0">
                      {visibleProcessJobs.filter((j) => j.status === 'processing').length > 0
                        ? `${visibleProcessJobs.filter((j) => j.status === 'processing').length} running`
                        : `${visibleProcessJobs.length} tasks`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 text-[#888] group-hover:text-white transition-colors">
                      <span className="text-[11px] font-medium hidden sm:inline">Details</span>
                      <FaChevronUp size={11} />
                    </div>
                    {visibleProcessJobs.every((j) => j.status !== 'processing') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissAllProcessJobs();
                        }}
                        title="Dismiss finished tasks"
                        className="p-1 text-[#888] hover:text-rose-400 hover:bg-rose-500/15 rounded-md transition-colors cursor-pointer"
                      >
                        <FaTimes size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {currentProcessJob && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-white font-semibold truncate max-w-[170px]">
                        {currentProcessJob.season} {currentProcessJob.year}
                      </span>
                      <span className="text-[#aaa]">
                        {currentProcessJob.processed || 0} / {currentProcessJob.total || 0} ({currentProcessJob.progress || 0}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#121212] h-1.5 rounded-full overflow-hidden border border-[#2a2a2a]">
                      <div
                        className="h-full bg-gradient-to-r from-[#f23030] to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${currentProcessJob.progress || 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#717171] font-mono pt-0.5">
                      <span className="truncate max-w-[170px]">
                        {currentProcessJob.status === 'processing'
                          ? `Phase: ${currentProcessJob.phase || 'compiling...'}`
                          : currentProcessJob.status === 'completed'
                          ? '✓ Archive ready in Download manager'
                          : currentProcessJob.status === 'cancelled'
                          ? '⊘ Compilation cancelled'
                          : '✕ Process failed'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {currentProcessJob.status === 'processing' && currentProcessJob.jobId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelProcessJob(currentProcessJob.jobId!);
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                            title="Cancel compilation"
                          >
                            <FaStop size={8} />
                            <span>Cancel</span>
                          </button>
                        ) : (
                          currentProcessJob.jobId && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismissProcessJob(currentProcessJob.jobId!);
                              }}
                              className="px-2 py-0.5 text-[10px] font-medium text-[#717171] hover:text-white bg-[#202020] hover:bg-[#282828] border border-[#333] rounded-md transition-colors cursor-pointer"
                            >
                              Dismiss
                            </button>
                          )
                        )}
                        <span className="text-[#888]">Click to expand ↗</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Expanded Detailed Window */
              <motion.div
                key="expanded-process-widget"
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-88 sm:w-[440px] max-h-[85vh] bg-[#181818] border border-[#333] rounded-2xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-3.5 sm:p-4 border-b border-[#262626] bg-[#141414] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#f23030]/15 text-[#f23030] flex items-center justify-center shrink-0">
                      <FaArchive size={13} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                        Compilation Pipeline
                      </h3>
                      <p className="text-[10px] text-[#888] font-mono">
                        {visibleProcessJobs.filter((j) => j.status === 'processing').length} active • {visibleProcessJobs.length} total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => fetchAllProcessJobs()}
                      title="Refresh tasks"
                      className="p-1.5 text-[#888] hover:text-white hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                    >
                      <FaSyncAlt size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsProcessWidgetExpanded(false)}
                      title="Collapse to corner"
                      className="p-1.5 text-[#888] hover:text-white hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                    >
                      <FaChevronDown size={12} />
                    </button>
                    {visibleProcessJobs.every((j) => j.status !== 'processing') && (
                      <button
                        type="button"
                        onClick={handleDismissAllProcessJobs}
                        title="Dismiss all finished"
                        className="p-1.5 text-[#888] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Multi-task Selector Tabs (if >1 job) */}
                {visibleProcessJobs.length > 1 && (
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#262626] bg-[#121212] overflow-x-auto no-scrollbar">
                    {visibleProcessJobs.map((job) => (
                      <button
                        key={job.jobId}
                        type="button"
                        onClick={() => setSelectedProcessJobId(job.jobId || null)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                          job.jobId === currentProcessJob?.jobId
                            ? 'bg-[#262626] text-white border border-[#444] font-semibold'
                            : 'bg-[#181818] text-[#888] hover:text-white border border-[#262626]'
                        }`}
                      >
                        {job.status === 'processing' ? (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        ) : job.status === 'completed' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        )}
                        <span>{job.season} {job.year}</span>
                        <span className="text-[10px] text-[#666]">({job.progress || 0}%)</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Current Job Details */}
                {currentProcessJob ? (
                  <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 flex-1 max-h-[60vh]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {currentProcessJob.status === 'processing' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider animate-pulse">
                            Compiling ZIP
                          </span>
                        )}
                        {currentProcessJob.status === 'completed' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                            Completed
                          </span>
                        )}
                        {currentProcessJob.status === 'cancelled' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                            Cancelled
                          </span>
                        )}
                        {currentProcessJob.status === 'error' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                            Error
                          </span>
                        )}
                        <span className="text-xs font-semibold text-white">
                          {currentProcessJob.season} {currentProcessJob.year}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {currentProcessJob.status === 'processing' && currentProcessJob.jobId && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCancelProcessJob(currentProcessJob.jobId!)}
                              className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Cancel compilation and discard partial archive"
                            >
                              <FaStop size={10} />
                              <span>Cancel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleForceCompleteProcess(currentProcessJob.jobId!)}
                              className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              title="Force complete with available clips"
                            >
                              Force Complete
                            </button>
                          </>
                        )}
                        {currentProcessJob.status !== 'processing' && currentProcessJob.jobId && (
                          <button
                            type="button"
                            onClick={() => handleDismissProcessJob(currentProcessJob.jobId!)}
                            className="px-2 py-0.5 text-[11px] font-medium text-[#717171] hover:text-white bg-[#202020] hover:bg-[#282828] border border-[#333] rounded-lg transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Phase status info */}
                    <div className="p-2.5 rounded-lg bg-[#121212] border border-[#262626] space-y-1">
                      <span className="text-[10px] text-[#717171] uppercase tracking-wider block font-semibold">
                        Current Phase:
                      </span>
                      <p className="text-xs text-white font-mono">
                        {currentProcessJob.phase || 'Processing clips...'}
                      </p>
                      {currentProcessJob.zipFilename && (
                        <p className="text-[11px] text-[#aaa] font-mono truncate">
                          ZIP: {currentProcessJob.zipFilename}
                        </p>
                      )}
                      {currentProcessJob.error && (
                        <p className="text-[11px] text-rose-400 font-mono break-all pt-0.5">
                          Error: {currentProcessJob.error}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#aaa] mb-1 font-mono">
                        <span>
                          Processed {currentProcessJob.processed || 0} of {currentProcessJob.total || 0} clips
                        </span>
                        <span className="text-white font-semibold">
                          {currentProcessJob.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden border border-[#2a2a2a]">
                        <div
                          className="h-full bg-gradient-to-r from-[#f23030] to-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${currentProcessJob.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Live Terminal Log Stream */}
                    {currentProcessJob.logs && currentProcessJob.logs.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#717171] tracking-wider mb-1 block">
                          Pipeline Logs:
                        </span>
                        <div
                          ref={processLogsContainerRef}
                          className="bg-[#0e0e0e] border border-[#262626] rounded-xl p-2.5 max-h-36 overflow-y-auto font-mono text-[11px] space-y-1"
                        >
                          {currentProcessJob.logs.map((log, idx) => (
                            <div
                              key={idx}
                              className={`flex items-start gap-1.5 ${
                                log.level === 'warning' || log.level === 'warn'
                                  ? 'text-amber-400'
                                  : log.level === 'error'
                                  ? 'text-rose-400'
                                  : log.level === 'completed' || log.level === 'success'
                                  ? 'text-emerald-400'
                                  : 'text-[#aaa]'
                              }`}
                            >
                              <span className="text-[#555] shrink-0">
                                [{new Date(log.time).toLocaleTimeString()}]
                              </span>
                              <span className="break-all">{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#717171]">
                    No active compilation tasks
                  </div>
                )}

                {/* Footer */}
                <div className="p-2.5 border-t border-[#262626] bg-[#141414]">
                  <button
                    type="button"
                    onClick={() => setIsProcessWidgetExpanded(false)}
                    className="w-full py-1.5 bg-[#202020] hover:bg-[#282828] text-[#aaa] hover:text-white text-xs font-medium rounded-xl border border-[#333] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FaChevronDown size={10} />
                    <span>Collapse to Corner</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth isAdminRequired={true}>
      <AdminDash />
    </RequireAuth>
  );
}