import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from '@/lib/helmetCompat';
import LoadingBar from 'react-top-loading-bar';
import {
  FaUsers,
  FaCog,
  FaChartBar,
  FaFlag,
  FaFilm,
  FaBan,
  FaArchive,
  FaCheckCircle,
  FaLayerGroup
} from "react-icons/fa";
import { useLocation, NavLink } from '@/lib/routerCompat';
import DeniedClips from './ContentManagement/DeniedClips';
import UserList from './UserManagement/UserList';
import Statistics from './Overview/Statistics';
import ConfigPanel from './Configuration/ConfigPanel';
import AdminActions from './ContentManagement/AdminActions';
import ZipManager from './ContentManagement/ZipManager';
import ReportsManagement from './Reports/ReportsManagement';
import { getCurrentSeason } from '../../utils/seasonHelpers';
import { Clip } from '../../types/adminTypes';
import ProcessClipsModal from '../../components/admin/ProcessClipsModal';
import useSocket from '../../hooks/useSocket';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

import { getProcessStatus } from '../../services/adminService';

import {
  useAllUsers,
  useAdminConfig,
  useAdminStats,
  useClipsWithRatings,
  useZips,
  useDeleteZip,
  useApproveUser,
  useDeleteAllClips,
  useDeleteUser,
  useUploadZip,
  useProcessClips,
  useReports
} from '../../hooks/useAdmin';
import { useNotification } from '../../context/AlertContext';

type TabName = 'overview' | 'users' | 'content' | 'config' | 'reports';
type ContentSubTab = 'pipeline' | 'denied';

function AdminDash() {
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [activeContentSubTab, setActiveContentSubTab] = useState<ContentSubTab>('pipeline');

  const { data: allUsers = [], isLoading: usersLoading } = useAllUsers();
  const { data: configData, isLoading: configLoading } = useAdminConfig();
  const { data: adminStats, isLoading: statsLoading } = useAdminStats();
  const { data: clipsData, isLoading: clipsLoading } = useClipsWithRatings();
  const { data: zips = [], isLoading: zipsLoading } = useZips();
  const { data: pendingReportsData } = useReports('pending');
  const { showSuccess, showError, showAlertModal } = useNotification();

  const deleteZipMutation = useDeleteZip();
  const approveUserMutation = useApproveUser();
  const deleteAllClipsMutation = useDeleteAllClips();
  const deleteUserMutation = useDeleteUser();
  const uploadZipMutation = useUploadZip();
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
  const [showDeleteUserConfirmation, setShowDeleteUserConfirmation] = useState<boolean>(false);
  const [showDeleteAllClipsConfirmation, setShowDeleteAllClipsConfirmation] = useState<boolean>(false);
  const [currentYear, setCurrentYear] = useState<number>(seasonInfo.year || new Date().getFullYear());

  const loading = usersLoading || configLoading || statsLoading || clipsLoading || zipsLoading;

  const location = useLocation();
  const { isConnected } = useSocket();

  // Handle URL parameters for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'users', 'content', 'config', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam as TabName);
    }
  }, [location.search]);

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

  const [zipFile, setZipFile] = useState<File | null>(null);
  const [clipAmount, setClipAmount] = useState<number>(0);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setZipFile(e.target.files[0]);
    }
  };

  const handleClipAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const clipAmount = Number(e.target.value);
    if (clipAmount >= 0) {
      setClipAmount(clipAmount);
    }
  };

  const handleZipSubmit = async (e: React.FormEvent | null, refresh?: boolean): Promise<void> => {
    if (e) e.preventDefault();
    if (!zipFile && !refresh) {
      return;
    }

    if (refresh) {
      return;
    }

    try {
      await uploadZipMutation.mutateAsync({
        zipFile: zipFile as File,
        clipAmount,
        season: seasonInfo.season || ''
      });
      showSuccess('Zip file uploaded successfully');
    } catch (error) {
      console.error('Error uploading clips:', error);
      showError('Failed to upload clips. Please try again.');
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

      const response = await processClipsMutation.mutateAsync(processData);

      const { jobId } = response;
      setProcessJobId(jobId);

      if (!isConnected) {
        let pollFrequency = 3000;
        let timeoutId: NodeJS.Timeout;
        const checkProgress = async () => {
          try {
            const statusData = await getProcessStatus(jobId);

            const { progress, status } = statusData;
            setProcessProgress(progress);

            if (status === 'completed') {
              clearTimeout(timeoutId);
              setProcessingClips(false);
              setProcessModalOpen(false);
              fetchZips();
              return;
            } else if (status === 'error') {
              clearTimeout(timeoutId);
              setProcessingClips(false);
              showError(`Error: ${statusData.message || 'Unknown error'}`);
              return;
            }

            timeoutId = setTimeout(checkProgress, pollFrequency);
          } catch (error) {
            console.error('Error checking process status:', error);
            timeoutId = setTimeout(checkProgress, 5000);
          }
        };

        timeoutId = setTimeout(checkProgress, pollFrequency);
      }

    } catch (error) {
      console.error('Error processing clips:', error);
      setProcessingClips(false);
      showError('Failed to start processing clips. Please try again.');
    }
  };

  const handleDeleteAllClips = (): void => {
    setShowDeleteAllClipsConfirmation(true);
  };

  const confirmDeleteAllClips = async (): Promise<void> => {
    setShowDeleteAllClipsConfirmation(false);
    try {
      await deleteAllClipsMutation.mutateAsync();
      showSuccess('All clips deleted successfully');
    } catch (error) {
      console.error('Error deleting all clips:', error);
      showError('Failed to delete all clips.');
    }
  };

  const cancelDeleteAllClips = (): void => {
    setShowDeleteAllClipsConfirmation(false);
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
            adminStats={adminStats}
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
            <div className="flex items-center gap-2 p-1.5 bg-[#181818] border border-[#262626] rounded-xl w-fit">
              <button
                onClick={() => setActiveContentSubTab('pipeline')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeContentSubTab === 'pipeline'
                    ? 'bg-[#f23030] text-white shadow-xs'
                    : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
                }`}
              >
                <FaArchive size={12} />
                <span>Processing & Archives</span>
              </button>

              <button
                onClick={() => setActiveContentSubTab('denied')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeContentSubTab === 'denied'
                    ? 'bg-[#f23030] text-white shadow-xs'
                    : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
                }`}
              >
                <FaBan size={12} />
                <span>Denied Submissions</span>
                {clipStats.deniedClips > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeContentSubTab === 'denied' ? 'bg-white/20 text-white' : 'bg-[#222222] text-[#aaaaaa]'
                  }`}>
                    {clipStats.deniedClips}
                  </span>
                )}
              </button>
            </div>

            {/* Sub-tab content */}
            {activeContentSubTab === 'pipeline' ? (
              <div className="space-y-6">
                <AdminActions
                  openProcessModal={openProcessModal}
                  handleDeleteAllClips={async () => handleDeleteAllClips()}
                  downloading={downloading}
                  loading={loading}
                  SkeletonBox={SkeletonBox}
                />

                <ZipManager
                  zips={zips}
                  zipsLoading={zipsLoading}
                  deleteZip={deleteZip}
                  zipFile={zipFile}
                  handleZipChange={handleZipChange}
                  clipAmount={clipAmount}
                  handleClipAmountChange={handleClipAmountChange}
                  handleZipSubmit={handleZipSubmit}
                  seasonInfo={seasonInfo}
                />
              </div>
            ) : (
              <DeniedClips
                clips={clips}
                ratings={ratings}
                config={config}
                location={location}
              />
            )}
          </div>
        );
      case 'config':
        return (
          <ConfigPanel
            config={config}
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
      <Helmet>
        <title>Admin Dashboard • ClipSesh</title>
        <meta
          name="description"
          content="Admin dashboard for ClipSesh - manage users, clips, and system configuration."
        />
      </Helmet>

      {/* Ambient background layer */}
      <div className="absolute top-0 left-0 w-full h-[320px] overflow-hidden pointer-events-none -z-10 select-none">
        <div
          className="w-full h-full bg-cover bg-center filter blur-[8px] opacity-20 transform scale-105"
          style={{
            backgroundImage: `url(/media/admin.jpg)`,
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(15,15,15,0) 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(15,15,15,0) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f0f]/80 to-[#0f0f0f]" />
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <LoadingBar color="#f23030" height={3} progress={progress} onLoaderFinished={() => setProgress(0)} />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 py-6 grow flex flex-col">
        {/* Page Header */}
        <div className="mb-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-[#717171] mb-2">
            <NavLink to="/" className="hover:text-[#f1f1f1] transition-colors">
              Home
            </NavLink>
            <span className="text-[#444444] select-none">/</span>
            <span className="text-[#f1f1f1] font-medium">Admin</span>
          </nav>

          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="relative pb-2.5 w-fit">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#f1f1f1] tracking-tight uppercase">
                  Admin Dashboard
                </h1>
                <div className="absolute bottom-0 left-0 w-2/5 h-[3px] bg-[#f23030] rounded-full" />
              </div>
              <p className="mt-2 text-xs sm:text-sm text-[#aaaaaa] max-w-xl">
                Operations console for clip reviews, reviewer quota tracking, user access, and pipeline packaging.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-end">
              <span className="text-xs uppercase tracking-wider px-3 py-1 bg-[#f23030]/15 text-[#f23030] border border-[#f23030]/30 rounded-full font-semibold">
                Season {seasonInfo.season.toUpperCase()} {seasonInfo.year}
              </span>
            </div>
          </div>
        </div>

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
        processing={processingClips}
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

      <ConfirmationDialog
        isOpen={showDeleteAllClipsConfirmation}
        title="Delete All Clips"
        message="Are you sure you want to delete all clips? This action cannot be undone and will remove all ratings."
        confirmText="Delete All"
        confirmVariant="danger"
        onConfirm={confirmDeleteAllClips}
        onCancel={cancelDeleteAllClips}
      />
    </div>
  );
}

export default AdminDash;
