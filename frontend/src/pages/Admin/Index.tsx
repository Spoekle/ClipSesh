import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import LoadingBar from 'react-top-loading-bar';
import background from '../../media/admin.jpg';
import { FaDiscord, FaUserClock, FaUsers, FaCog, FaThumbsDown, FaChartBar, FaTrophy, FaFlag } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import DeniedClips from './ContentManagement/DeniedClips';
import UserList from './UserManagement/UserList';
import Statistics from './Overview/Statistics';
import CreateUser from './UserManagement/CreateUser';
import ConfigPanel from './Configuration/ConfigPanel';
import AdminActions from './ContentManagement/AdminActions';
import ZipManager from './ContentManagement/ZipManager';
import TrophyManagement from './Trophies/TrophyManagement';
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
  useProcessClips
} from '../../hooks/useAdmin';

type TabName = 'overview' | 'users' | 'content' | 'config' | 'clips' | 'stats' | 'trophies' | 'reports';

function AdminDash() {
  const [activeTab, setActiveTab] = useState<TabName>('overview');

  const { data: allUsers = [], isLoading: usersLoading } = useAllUsers();
  const { data: configData, isLoading: configLoading } = useAdminConfig();
  const { data: adminStats, isLoading: statsLoading } = useAdminStats();
  const { data: clipsData, isLoading: clipsLoading } = useClipsWithRatings();
  const { data: zips = [], isLoading: zipsLoading } = useZips();

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

  // Placeholder functions for components that still expect them (will be removed as components are updated)
  const fetchUsers = () => { }; // React Query handles this automatically
  const fetchZips = () => { }; // React Query handles this automatically  
  const fetchClipsAndRatings = () => { }; // React Query handles this automatically
  const setDisabledUsers = () => { }; // Data comes from React Query, no local state needed
  const downloading = false; // This can be removed once component is updated

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
  }, [clips, ratings]);

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

  // Handle URL parameters for tab switching (e.g., from notifications)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'users', 'content', 'config', 'clips', 'stats', 'trophies', 'reports'].includes(tabParam)) {
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
  const handleApproveUser = async (userId: string): Promise<void> => {
    try {
      await approveUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleDelete = (id: string): void => {
    setUserToDelete(id);
    setShowDeleteUserConfirmation(true);
  };
  const confirmDeleteUser = async (): Promise<void> => {
    if (!userToDelete) return;

    setShowDeleteUserConfirmation(false);
    try {
      await deleteUserMutation.mutateAsync(userToDelete);
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
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
      alert('Zip file uploaded successfully');
    } catch (error) {
      console.error('Error uploading clips:', error);
      alert('Failed to upload clips. Please try again.');
    }
  };

  const processClips = async (season: string, year: number, assignTrophies: boolean = true): Promise<void> => {
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
      alert('No clips to process. All clips have been denied or are invalid.');
      setProcessingClips(false);
      setProcessModalOpen(false);
      return;
    } try {
      console.log(`Processing ${filteredClips.length} clips for ${season} ${year}`);

      const processData = {
        clips: filteredClips.map((clip, index) => {
          const ratingData = ratings[clip._id];

          // Check if we need to convert raw ratings to ratingCounts format
          if (ratingData && !ratingData.ratingCounts && ratingData.ratings) {
            // Convert the raw ratings object to ratingCounts array
            const ratingsObj = ratingData.ratings as any; // Type assertion for dynamic object access
            ratingData.ratingCounts = Object.keys(ratingsObj).map(rating => ({
              rating: rating,
              count: ratingsObj[rating]?.length || 0,
              users: ratingsObj[rating] || []
            }));
          }

          // If no rating data exists, skip this clip or give it a neutral rating
          if (!ratingData || !ratingData.ratingCounts || !Array.isArray(ratingData.ratingCounts) || !ratingData.ratingCounts.length) {
            return { ...clip, rating: '3', index }; // Use neutral rating instead of '1'
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

          // Check if this clip has any actual ratings
          const hasActualRatings = ratingData.ratingCounts.some(rateData => rateData.count > 0);

          let averageRating = '3'; // Default to neutral if no valid ratings
          if (totalRatingCount > 0) {
            const avgValue = totalRatingSum / totalRatingCount;
            const roundedRating = Math.max(1, Math.min(4, Math.round(avgValue)));
            averageRating = roundedRating.toString();
          } else if (!hasActualRatings) {
            // This clip has never been rated by anyone - exclude it from processing
            return null; // This will filter out the clip
          }

          return { ...clip, rating: averageRating, index };
        }).filter((clip): clip is Clip & { rating: string; index: number } => clip !== null), // Type guard filter
        season: season,
        year: year,
        assignTrophies: assignTrophies
      };

      console.log(`Sending ${processData.clips.length} rated clips to backend for processing`);

      const response = await processClipsMutation.mutateAsync(processData);

      const { jobId } = response;
      console.log(`Process job started with ID: ${jobId}`);
      setProcessJobId(jobId);

      if (!isConnected) {
        let pollFrequency = 3000;
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
              alert(`Error: ${statusData.message || 'Unknown error'}`);
              return;
            }

            timeoutId = setTimeout(checkProgress, pollFrequency);
          } catch (error) {
            console.error('Error checking process status:', error);
            timeoutId = setTimeout(checkProgress, 5000);
          }
        };

        let timeoutId = setTimeout(checkProgress, pollFrequency);
      }

    } catch (error) {
      console.error('Error processing clips:', error);
      setProcessingClips(false);
      alert('Failed to start processing clips. Please try again.');
    }
  };

  const handleDeleteAllClips = (): void => {
    setShowDeleteAllClipsConfirmation(true);
  };
  const confirmDeleteAllClips = async (): Promise<void> => {
    setShowDeleteAllClipsConfirmation(false);
    try {
      await deleteAllClipsMutation.mutateAsync();
      console.log('All clips deleted successfully');
    } catch (error) {
      console.error('Error deleting all clips:', error);
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
      console.log('Refreshed clip ratings before processing');
    } catch (error) {
      console.error('Error refreshing clip data before processing:', error);
    }
    setProcessModalOpen(true);
  };

  const SkeletonBox = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-neutral-400 dark:bg-neutral-600 rounded ${className}`}></div>
  );

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
          <div className="space-y-10">
            {/* User List */}
            <UserList
              fetchUsers={fetchUsers}
              disabledUsers={disabledUsers}
              setDisabledUsers={setDisabledUsers}
              AVAILABLE_ROLES={AVAILABLE_ROLES}
            />

            {/* Create User and Disabled Users Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <CreateUser
                fetchUsers={fetchUsers}
                AVAILABLE_ROLES={AVAILABLE_ROLES}
              />

              <div className="w-full bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm text-neutral-900 dark:text-white transition duration-200 p-6 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50">
                <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg mr-3 shadow-sm">
                    <FaUserClock className="text-white text-sm" />
                  </div>
                  Disabled Users
                </h2>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="bg-neutral-100 dark:bg-neutral-700/50 p-4 rounded-lg flex justify-between items-center border border-neutral-200 dark:border-neutral-600">
                        <div className="flex items-center gap-3">
                          <SkeletonBox className="w-10 h-10 rounded-full" />
                          <div>
                            <SkeletonBox className="h-5 w-32 mb-2" />
                            <SkeletonBox className="h-4 w-20" />
                          </div>
                        </div>
                        <SkeletonBox className="w-20 h-8 rounded" />
                      </div>
                    ))}
                  </div>
                ) : !disabledUsers.length ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-neutral-100 dark:bg-neutral-700/50 rounded-lg border border-neutral-200 dark:border-neutral-600">
                    <p className="text-neutral-500 dark:text-neutral-400">
                      No disabled users at this time
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {disabledUsers.map(user => (
                      <div
                        key={user._id}
                        className="bg-neutral-100 dark:bg-neutral-700/50 p-4 rounded-lg flex justify-between items-center border border-neutral-200 dark:border-neutral-600"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-neutral-200 dark:bg-neutral-600">
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                              <FaDiscord
                                className="mr-1"
                                style={{ color: user.discordId ? '#7289da' : 'currentColor' }}
                              />
                              <span>{user.discordUsername || 'Not connected'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveUser(user._id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                          >
                            Enable
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ); case 'content':
        return (
          <>
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

            <DeniedClips
              clips={clips}
              ratings={ratings}
              config={config}
              location={location}
            />
          </>
        );
      case 'config':
        return (<ConfigPanel
          config={config}
        />
        );
      case 'trophies':
        return (
          <TrophyManagement
            users={allUsers}
            onRefreshUsers={fetchUsers}
          />
        );
      case 'reports':
        return <ReportsManagement />;
      default:
        return (
          <div className="p-8 bg-neutral-300 dark:bg-neutral-800 rounded-xl text-center">
            <h3 className="text-2xl font-bold">No content available</h3>
            <p>Please select a different tab</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen text-neutral-800 dark:text-white flex flex-col items-center bg-neutral-100 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>Admin Dashboard | ClipSesh</title>
        <meta
          name="description"
          content="Admin dashboard for ClipSesh - manage users, clips, and system configuration."
        />
      </Helmet>

      {/* Progress bar */}
      <div className='w-full'>
        <LoadingBar color='#f11946' height={4} progress={progress} onLoaderFinished={() => setProgress(0)} />
      </div>

      {/* Header banner */}
      <div
        className="w-full flex h-[500px] justify-center items-center rounded-b-4xl overflow-hidden relative animate-fade mx-6"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        <div className="flex bg-gradient-to-b from-black/70 via-black/50 to-black/30 dark:from-neutral-900/80 dark:to-black/40 backdrop-blur-md justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center px-4 md:px-0 w-full">
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black text-white leading-tight mb-4 text-center drop-shadow-lg">
              ADMIN DASHBOARD
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-4 text-center drop-shadow-md">
              Manage the unmanaged...
            </h2>
          </div>
        </div>
      </div>

      {/* Main content with skeleton states */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-900 transition duration-200 animate-fade">

        {/* Tabs Navigation - Pill Style */}
        <div className="mt-8 mb-8">
          <div className="flex flex-wrap gap-2 p-1.5 bg-neutral-200/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium ${activeTab === 'overview'
                ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50'
                }`}
            >
              <FaChartBar /> Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium ${activeTab === 'users'
                ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50'
                }`}
            >
              <FaUsers /> Users
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium ${activeTab === 'content'
                ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50'
                }`}
            >
              <FaThumbsDown /> Content
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium ${activeTab === 'config'
                ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50'
                }`}
            >
              <FaCog /> Config
            </button>
            <button
              onClick={() => setActiveTab('trophies')}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium ${activeTab === 'trophies'
                ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50'
                }`}
            >
              <FaTrophy /> Trophies
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium ${activeTab === 'reports'
                ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50'
                }`}
            >
              <FaFlag /> Reports
            </button>
          </div>
        </div>
        {/* Tab Content */}
        <div className="mt-8 space-y-8">
          {renderTabContent()}
        </div>
      </div>      <ProcessClipsModal
        isOpen={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        onProcess={processClips}
        onProcessingComplete={fetchZips}
        processing={processingClips}
        progress={processProgress}
        currentSeason={seasonInfo.season || ''}
        currentYear={seasonInfo.year || currentYear}
        clipCount={clips.filter(clip => {
          // Filter by current season and year first
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
