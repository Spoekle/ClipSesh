import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import LoadingBar from 'react-top-loading-bar';
import background from '../../media/admin.jpg';
import { FaDiscord, FaUserClock, FaUsers, FaCog, FaThumbsDown, FaChartBar, FaTrophy } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import DeniedClips from './ContentManagement/DeniedClips';
import UserList from './UserManagement/UserList';
import Statistics from './Overview/Statistics';
import CreateUser from './UserManagement/CreateUser';
import ConfigPanel from './Configuration/ConfigPanel';
import AdminActions from './ContentManagement/AdminActions';
import ZipManager from './ContentManagement/ZipManager';
import SeasonInfo from './components/SeasonInfo';
import TrophyManagement from './Trophies/TrophyManagement';
import { getCurrentSeason } from '../../utils/seasonHelpers';
import ProcessClipsModal from '../../components/admin/ProcessClipsModal';
import useSocket from '../../hooks/useSocket';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import * as adminService from '../../services/adminService';

import {
  Clip,
  Rating,
  User,
  UserRating,
  Zip,
  SeasonInfo as SeasonInfoType,
  AdminStats
} from '../../types/adminTypes';

// Define interfaces for local app's data types
interface Config {
  denyThreshold: number;
  latestVideoLink: string;
  clipChannelIds?: string[];
}

// Tab names for the admin dashboard
type TabName = 'overview' | 'users' | 'content' | 'config' | 'clips' | 'stats' | 'trophies';

function AdminDash() {
  // Tab state - default to overview tab
  const [activeTab, setActiveTab] = useState<TabName>('overview');

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [, setOtherRoles] = useState<User[]>([]);
  const [, setAllActiveUsers] = useState<User[]>([]);
  const [, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [clipTeam, setClipTeam] = useState<User[]>([]);
  const [, setEditors] = useState<User[]>([]);
  const [, setUploader] = useState<User[]>([]);
  const [disabledUsers, setDisabledUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<Config>({ denyThreshold: 5, latestVideoLink: '' });
  const [clips, setClips] = useState<Clip[]>([]);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [downloading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfoType>({ clipAmount: 0 });
  const [zips, setZips] = useState<Zip[]>([]);
  const [zipsLoading, setZipsLoading] = useState<boolean>(true);
  const AVAILABLE_ROLES = ['user', 'admin', 'clipteam', 'editor', 'uploader'];
  const [adminStats, setAdminStats] = useState<AdminStats>({
    userCount: 0,
    activeUserCount: 0,
    clipCount: 0,
    ratedClipsCount: 0,
    deniedClipsCount: 0
  });

  const [processModalOpen, setProcessModalOpen] = useState<boolean>(false);
  const [processingClips, setProcessingClips] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [processJobId, setProcessJobId] = useState<string | null>(null);

  // Confirmation dialog states
  const [showDeleteUserConfirmation, setShowDeleteUserConfirmation] = useState<boolean>(false);
  const [showDeleteAllClipsConfirmation, setShowDeleteAllClipsConfirmation] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  const location = useLocation();
  const { isConnected } = useSocket();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async (): Promise<void> => {
    try {
      await fetchUsers();
      setProgress(10);
      await fetchConfig();
      setProgress(20);
      await fetchAdminStats();
      setProgress(30);
      getSeason();
      setProgress(50);
      fetchZips();
      setProgress(60);
      await fetchClipsAndRatings();
      setProgress(100);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };
  const fetchZips = async (): Promise<void> => {
    try {
      const zipsData = await adminService.getZips();
      setZips(zipsData);
      setZipsLoading(false);
    } catch (error) {
      console.error('Error fetching zips:', error);
      setZipsLoading(false);
    }
  };  const deleteZip = async (zipId: string): Promise<void> => {
    try {
      await adminService.deleteZip(zipId);
      setZips(zips.filter(zip => zip._id !== zipId));
    } catch (error) {
      console.error('Error deleting zip:', error);
      throw error;
    }
  };
  const fetchUsers = async (): Promise<void> => {
    try {
      const everyUser = await adminService.getAllUsers();
      setAllUsers(everyUser);

      // Filter active users from the fetched data
      const activeUsers = everyUser.filter((user: User) => user.status === 'active');
      setAllActiveUsers(activeUsers);

      // Further filter users based on roles array
      setUsers(activeUsers.filter((user: User) => user.roles.includes('user')));
      setOtherRoles(activeUsers.filter((user: User) => !user.roles.includes('user')));
      setAdmins(activeUsers.filter((user: User) => user.roles.includes('admin')));
      setClipTeam(activeUsers.filter((user: User) => user.roles.includes('clipteam')));
      setEditors(activeUsers.filter((user: User) => user.roles.includes('editor')));
      setUploader(activeUsers.filter((user: User) => user.roles.includes('uploader')));
      setDisabledUsers(everyUser.filter((user: User) => user.status === 'disabled'));
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error instanceof Error && error.message.includes('403')) {
        window.location.href = '/clips';
        alert('You do not have permission to view this page.');
      }
    }
  };
  const handleApproveUser = async (userId: string): Promise<void> => {
    try {
      await adminService.approveUser(userId);
      setDisabledUsers(disabledUsers.filter(user => user._id !== userId));
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };
  const fetchConfig = async (): Promise<void> => {
    try {
      const response = await adminService.getConfig();

      // Extract config from the combined object returned by the API
      if (response) {
        const publicConfig = response.public || {};
        const adminConfig = response.admin || {};

        // Merge admin and public configs into a single config object
        setConfig({
          denyThreshold: adminConfig.denyThreshold ?? 5,
          latestVideoLink: publicConfig.latestVideoLink ?? '',
          clipChannelIds: adminConfig.clipChannelIds ?? []
        });        // Update season info with clip amount from config if available
        if (typeof publicConfig.clipAmount === 'number') {
          setSeasonInfo(prevState => ({
            ...prevState,
            clipAmount: publicConfig.clipAmount as number
          }));
          console.log(`Retrieved clipAmount from config: ${publicConfig.clipAmount}`);
        }
      } else {
        console.warn('Empty config response, using defaults');
        // Keep the default values from initial state
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      // Keep using default values on error
    }
  };
  const fetchAdminStats = async (): Promise<void> => {
    try {
      const stats = await adminService.getAdminStats();
      setAdminStats(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };
  const fetchClipsAndRatings = async (): Promise<void> => {
    try {
      const { clips: clipsData, ratings: ratingsData } = await adminService.getClipsWithRatings({
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeRatings: true
      });

      // Update state with fetched data
      setClips(clipsData);

      // Transform ratings to ensure they have the expected format for the frontend
      const transformedRatings = adminService.transformRatings(ratingsData);
      setRatings(transformedRatings);

    } catch (error) {
      console.error('Error fetching clips and ratings:', error);
    }
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

  const ratedClips = clips.filter(clip => {
    const ratingData = ratings[clip._id];
    if (!ratingData || !ratingData.ratingCounts || !Array.isArray(ratingData.ratingCounts)) {
      return false;
    }
    // Check if any rating category has at least one rating
    return ratingData.ratingCounts.some(rateData => rateData.count > 0);
  }).length;

  useEffect(() => {
    if (Object.keys(ratings).length > 0) {
      countRatingsPerUser();
    }
  }, [ratings]);

  const countRatingsPerUser = (): void => {
    const userRatingCount: Record<string, any> = {};

    [...clipTeam, ...admins]
      .filter(user => user.username !== 'UploadBot')
      .forEach(user => {
        userRatingCount[user.username] = { '1': 0, '2': 0, '3': 0, '4': 0, 'deny': 0, total: 0, percentageRated: 0 };
      });

    const clipLength = Object.keys(ratings).length;

    Object.keys(ratings).forEach(clipId => {
      const clipRatingCounts = ratings[clipId].ratingCounts;

      if (!Array.isArray(clipRatingCounts)) {
        console.error(`clipRatingCounts for Clip ID ${clipId} is not an array:`, clipRatingCounts);
        return;
      }

      clipRatingCounts.forEach(ratingData => {
        if (ratingData.users && ratingData.users.length > 0) {
          ratingData.users.forEach(user => {
            if (userRatingCount[user.username]) {
              if (userRatingCount[user.username][ratingData.rating] !== undefined) {
                userRatingCount[user.username][ratingData.rating]++;
                userRatingCount[user.username].total++;
              }
              userRatingCount[user.username].percentageRated = (userRatingCount[user.username].total / (seasonInfo.clipAmount || clipLength)) * 100;
            }
          });
        }
      });
    });

    const userRatingCounts = Object.keys(userRatingCount).map(username => ({
      username,
      ...userRatingCount[username]
    }));

    userRatingCounts.sort((a, b) => b.total - a.total);

    setUserRatings(userRatingCounts);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: name === 'denyThreshold' ? Number(value) : value
    });
  };
  const handleConfigSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      await adminService.updateConfig(config);
      alert('Config updated successfully');
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Failed to update config. Please try again.');
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
      await adminService.deleteUser(userToDelete);
      setUsers(allUsers.filter(user => user._id !== userToDelete));
      alert('User deleted successfully');
      fetchUsers();
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
      fetchZips();
      return;
    }

    try {
      await adminService.uploadZip(zipFile as File, clipAmount, seasonInfo.season || '');
      alert('Zip file uploaded successfully');
      fetchZips();
    } catch (error) {
      console.error('Error uploading clips:', error);
      alert('Failed to upload clips. Please try again.');
    }
  };

  const processClips = async (season: string, year: number): Promise<void> => {
    setProcessingClips(true);
    setProcessProgress(0);

    const filteredClips = clips.filter((clip) => {
      // Check if the clip has a valid ID
      if (!clip._id) {
        console.warn('Clip without ID found:', clip);
        return false;
      }

      // Check if ratings exist for this clip
      const ratingData = ratings[clip._id];
      if (!ratingData) {
        console.warn(`No rating data found for clip: ${clip._id}`);
        return true; // We'll include clips without ratings as they haven't been denied
      }

      // Check for valid rating counts
      if (!ratingData.ratingCounts || !Array.isArray(ratingData.ratingCounts)) {
        console.warn(`Invalid rating counts for clip: ${clip._id}`);
        return true; // Similarly, include clips with invalid rating structures
      }

      // Only filter out clips that have been denied by enough users
      return ratingData.ratingCounts.every(
        (rateData) => rateData.rating !== 'deny' || rateData.count < config.denyThreshold
      );
    });

    if (filteredClips.length === 0) {
      alert('No clips to process. All clips have been denied or are invalid.');
      setProcessingClips(false);
      setProcessModalOpen(false);
      return;
    } try {
      console.log(`Starting clip processing for ${season} ${year} with ${filteredClips.length} clips`);

      // Send the processing request
      const processData = {
        clips: filteredClips.map((clip, index) => {
          const ratingData = ratings[clip._id];

          // Add a safety check to make sure ratingData and ratingCounts exist
          if (!ratingData || !ratingData.ratingCounts || !Array.isArray(ratingData.ratingCounts) || !ratingData.ratingCounts.length) {
            // Default to rating '1' if no ratings exist
            return { ...clip, rating: '1', index };
          }

          // Calculate average rating instead of most chosen
          let totalRatingSum = 0;
          let totalRatingCount = 0;
          
          ratingData.ratingCounts.forEach(rateData => {
            // Skip 'deny' ratings in average calculation
            if (rateData.rating !== 'deny' && rateData.count > 0) {
              const numericRating = parseInt(rateData.rating);
              if (!isNaN(numericRating)) {
                totalRatingSum += numericRating * rateData.count;
                totalRatingCount += rateData.count;
              }
            }
          });
          
          // Calculate average and round to nearest integer
          let averageRating = '4'; // Default fallback
          if (totalRatingCount > 0) {
            const avgValue = totalRatingSum / totalRatingCount;
            averageRating = Math.round(avgValue).toString();
            
            // Ensure the rating is within valid bounds (1-4)
            const roundedRating = Math.max(1, Math.min(4, parseInt(averageRating)));
            averageRating = roundedRating.toString();
          }
          
          return { ...clip, rating: averageRating, index }; // Include index for tracking
        }),
        season: season,
        year: year
      };

      const response = await adminService.processClips(processData);

      const { jobId } = response;
      console.log(`Process job started with ID: ${jobId}`);
      setProcessJobId(jobId);

      // We don't need the polling logic anymore since we're using WebSockets,
      // but we'll keep a simplified version as a fallback
      if (!isConnected) {
        let pollFrequency = 3000;
        const checkProgress = async () => {
          try {
            const statusData = await adminService.getProcessStatus(jobId);

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

        // Start polling only as fallback
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
      await adminService.deleteAllClips();
      fetchClipsAndRatings();
      console.log('All clips deleted successfully');
    } catch (error) {
      console.error('Error deleting all clips:', error);
    }
  };

  const cancelDeleteAllClips = (): void => {
    setShowDeleteAllClipsConfirmation(false);
  };

  const getSeason = (): void => {
    const { season } = getCurrentSeason();
    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      season
    }));
    setCurrentYear(new Date().getFullYear());
  };

  const openProcessModal = async (): Promise<void> => {
    // Refresh clip ratings before opening modal to ensure we have the latest data
    try {
      await fetchClipsAndRatings();
      console.log('Refreshed clip ratings before processing');
    } catch (error) {
      console.error('Error refreshing clip data before processing:', error);
    }
    setProcessModalOpen(true);
  };

  // Tab content rendering  // Skeleton component for loading states
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

              <div className="w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
                  <FaUserClock className="mr-3 text-yellow-500" />
                  Disabled Users
                </h2>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg flex justify-between items-center">
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
                  <div className="flex flex-col items-center justify-center p-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
                    <p className="text-lg text-neutral-600 dark:text-neutral-300">
                      No disabled users at this time
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {disabledUsers.map(user => (
                      <div
                        key={user._id}
                        className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-neutral-300 dark:bg-neutral-600">
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
                            <p className="font-semibold">{user.username}</p>
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
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                          >
                            Enable
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
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
          handleConfigChange={handleConfigChange}
          handleConfigSubmit={handleConfigSubmit}
        />
        );
      case 'trophies':
        return (
          <TrophyManagement
            users={allUsers}
            onRefreshUsers={fetchUsers}
          />
        );
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
    <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
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
      <div className="w-full flex h-96 justify-center items-center animate-fade"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)'
        }}>
        <div className="flex bg-gradient-to-b from-neutral-900 to-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-4xl font-bold mb-4 text-center">Admin Dashboard</h1>
            <h2 className="text-3xl mb-4 text-center">Manage the unmanaged...</h2>
          </div>        </div>
      </div>

      {/* Main content with skeleton states */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200 animate-fade">
        {/* Season Info - Always visible */}
        <SeasonInfo
          seasonInfo={seasonInfo}
          deniedClips={deniedClips}
          ratedClips={ratedClips}
        />

        {/* Tabs Navigation */}
        <div className="mt-8 mb-6">
          <div className="flex flex-wrap gap-2 border-b border-neutral-400 dark:border-neutral-700 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-all ${activeTab === 'overview'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white'
                }`}
            >
              <FaChartBar /> Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-all ${activeTab === 'users'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white'
                }`}
            >
              <FaUsers /> User Management
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-all ${activeTab === 'content'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white'
                }`}
            >
              <FaThumbsDown /> Content Management
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-all ${activeTab === 'config'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white'
                }`}
            >
              <FaCog /> Configuration
            </button>
            <button
              onClick={() => setActiveTab('trophies')}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-all ${activeTab === 'trophies'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white'
                }`}
            >
              <FaTrophy /> Trophies
            </button>
          </div>
        </div>
        {/* Tab Content */}
        <div className="mt-8 space-y-10">
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
        currentYear={currentYear}
        clipCount={clips.filter(clip => {
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
