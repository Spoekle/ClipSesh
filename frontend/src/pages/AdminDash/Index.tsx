import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../../config/config';
import axios from 'axios';
import { BiLoaderCircle } from 'react-icons/bi';
import LoadingBar from 'react-top-loading-bar';
import background from '../../media/admin.jpg';
import { FaDiscord, FaUserClock } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import DeniedClips from './components/DeniedClips';
import UserList from './components/UserList';
import Statistics from './components/Statistics';
import CreateUser from './components/CreateUser';
import ConfigPanel from './components/ConfigPanel';
import AdminActions from './components/AdminActions';
import ZipManager from './components/ZipManager';
import SeasonInfo from './components/SeasonInfo';
import { getCurrentSeason } from '../../utils/seasonHelpers';
import ProcessClipsModal from '../../components/admin/ProcessClipsModal';
import useSocket from '../../hooks/useSocket';

import { Clip, Rating  } from '../../types/adminTypes';

// Define interfaces for the app's data types
interface User {
  _id: string;
  username: string;
  status: 'active' | 'disabled';
  roles: string[];
  profilePicture?: string;
  discordId?: string;
  discordUsername?: string;
}

interface Config {
  denyThreshold: number;
  latestVideoLink: string;
  clipChannelIds?: string[];
}

interface Zip {
  _id: string;
  url: string;
  season: string;
  year: number;
  name: string;
  size: number;
  clipAmount: number;
  createdAt: string;
}

interface UserRating {
  username: string;
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  deny: number;
  total: number;
  percentageRated: number;
}

interface SeasonInfoType {
  season?: string;
  clipAmount?: number;
}

interface AdminStats {
  userCount: number;
  activeUserCount: number;
  clipCount: number;
  ratedClipsCount: number;
  deniedClipsCount: number;
}

function AdminDash() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [otherRoles, setOtherRoles] = useState<User[]>([]);
  const [allActiveUsers, setAllActiveUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [clipTeam, setClipTeam] = useState<User[]>([]);
  const [editors, setEditors] = useState<User[]>([]);
  const [uploader, setUploader] = useState<User[]>([]);
  const [disabledUsers, setDisabledUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<Config>({ denyThreshold: 5, latestVideoLink: '' });
  const [clips, setClips] = useState<Clip[]>([]);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [downloading, setDownloading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfoType>({});
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
      const response = await axios.get<Zip[]>(`${apiUrl}/api/zips`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setZips(response.data);
      setZipsLoading(false);
    } catch (error) {
      console.error('Error fetching zips:', error);
      setZipsLoading(false);
    }
  };

  const deleteZip = async (zipId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this zip?")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiUrl}/api/zips/${zipId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setZips(zips.filter(zip => zip._id !== zipId));
      alert('Zip deleted successfully');
    } catch (error) {
      console.error('Error deleting zip:', error);
      alert('Failed to delete zip. Please try again.');
    }
  };

  const fetchUsers = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<User[]>(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const everyUser = response.data;
      setAllUsers(everyUser);

      // Filter active users from the fetched data
      const activeUsers = everyUser.filter(user => user.status === 'active');
      setAllActiveUsers(activeUsers);

      // Further filter users based on roles array
      setUsers(activeUsers.filter(user => user.roles.includes('user')));
      setOtherRoles(activeUsers.filter(user => !user.roles.includes('user')));
      setAdmins(activeUsers.filter(user => user.roles.includes('admin')));
      setClipTeam(activeUsers.filter(user => user.roles.includes('clipteam')));
      setEditors(activeUsers.filter(user => user.roles.includes('editor')));
      setUploader(activeUsers.filter(user => user.roles.includes('uploader')));
      setDisabledUsers(everyUser.filter(user => user.status === 'disabled'));
    } catch (error) {
      console.error('Error fetching users:', error);
      if (axios.isAxiosError(error) && error.response && error.response.status === 403) {
        window.location.href = '/clips';
        alert('You do not have permission to view this page.');
      }
    }
  };

  const handleApproveUser = async (userId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/api/users/approve`, { userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisabledUsers(disabledUsers.filter(user => user._id !== userId));
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const fetchConfig = async (): Promise<void> => {
    try {
      // Use the correct endpoint for config data
      const response = await axios.get<any>(`${apiUrl}/api/config`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Extract config from the combined object returned by the API
      if (response.data) {
        const publicConfig = response.data.public || {};
        const adminConfig = response.data.admin || {};
        
        // Merge admin and public configs into a single config object
        setConfig({
          denyThreshold: adminConfig.denyThreshold ?? 5,
          latestVideoLink: publicConfig.latestVideoLink ?? '',
          clipChannelIds: adminConfig.clipChannelIds ?? []
        });
        
        // Update season info with clip amount from config if available
        if (publicConfig.clipAmount !== undefined) {
          setSeasonInfo(prevState => ({
            ...prevState,
            clipAmount: publicConfig.clipAmount
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
      const token = localStorage.getItem('token');
      const response = await axios.get<AdminStats>(`${apiUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchClipsAndRatings = async (): Promise<void> => {
    try {
      // Use query parameters for backend filtering/sorting
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Request clips with pagination and sorting from the backend
      const clipResponse = await axios.get(`${apiUrl}/api/clips`, {
        params: {
          limit: 1000, // Get a large number of clips for admin view
          sortBy: 'createdAt',
          sortOrder: 'desc',
          includeRatings: true // Request ratings to be included with clips
        },
        headers
      });
      
      // Process the response data
      let clipsData: Clip[] = [];
      let ratingsData: Record<string, Rating> = {};
      
      if (clipResponse.data) {
        // Check for clips in various response formats
        if (Array.isArray(clipResponse.data)) {
          clipsData = clipResponse.data;
        } else if (clipResponse.data.clips && Array.isArray(clipResponse.data.clips)) {
          clipsData = clipResponse.data.clips;
        } else if (clipResponse.data.data && Array.isArray(clipResponse.data.data)) {
          clipsData = clipResponse.data.data;
        }
        
        // Check for included ratings in the response
        if (clipResponse.data.ratings && typeof clipResponse.data.ratings === 'object') {
          ratingsData = clipResponse.data.ratings;
        }
      }
      
      // Update state with fetched data
      setClips(clipsData);
      
      // If ratings weren't included in the response, fetch them separately
      if (Object.keys(ratingsData).length === 0 && clipsData.length > 0) {
        setProgress(65);
        
        // Make individual requests for ratings if not included in the clips response
        const ratingPromises = clipsData.map(clip =>
          axios.get<Rating>(`${apiUrl}/api/ratings/${clip._id}`, { headers })
        );
        
        setProgress(80);
        const ratingResponses = await Promise.all(ratingPromises);
        
        ratingsData = ratingResponses.reduce<Record<string, Rating>>((acc, res, index) => {
          acc[clipsData[index]._id] = res.data;
          setProgress(90);
          return acc;
        }, {});
      }
      
      // Transform ratings to ensure they have the expected format for the frontend
      const transformedRatings = transformRatings(ratingsData);
      setRatings(transformedRatings);
      
    } catch (error) {
      console.error('Error fetching clips and ratings:', error);
    }
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

  useEffect(() => {
    if (Object.keys(ratings).length > 0) {
      countRatingsPerUser();
    }
  }, [ratings]);

  const countRatingsPerUser = (): void => {
    const userRatingCount: Record<string, any> = {};

    [...clipTeam, ...admins]
      .filter(user => user.username !== 'UploadBot' && !user.roles.includes('editor') && !user.roles.includes('uploader'))
      .forEach(user => {
        userRatingCount[user.username] = { '1': 0, '2': 0, '3': 0, '4': 0, 'deny': 0, total: 0, percentageRated: 0 };
      });

    const clipLength = Object.keys(ratings).length;
    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      clipAmount: clipLength
    }));

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
              userRatingCount[user.username].percentageRated = (userRatingCount[user.username].total / clipLength) * 100;
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
      const token = localStorage.getItem('token');
      await axios.put(`${apiUrl}/api/admin/config`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Config updated successfully');
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Failed to update config. Please try again.');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiUrl}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(allUsers.filter(user => user._id !== id));
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
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
    
    const formData = new FormData();

    formData.append('clipsZip', zipFile as Blob);
    formData.append('clipAmount', clipAmount.toString());
    formData.append('season', seasonInfo.season || '');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/api/zips/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      });
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
      const ratingData = ratings[clip._id];
      return (
        ratingData && 
        ratingData.ratingCounts && 
        Array.isArray(ratingData.ratingCounts) &&
        ratingData.ratingCounts.every(
          (rateData) => rateData.rating !== 'deny' || rateData.count < config.denyThreshold
        )
      );
    });

    if (filteredClips.length === 0) {
      alert('No clips to process. All clips have been denied.');
      setProcessingClips(false);
      setProcessModalOpen(false);
      return;
    }

    try {
      console.log(`Starting clip processing for ${season} ${year} with ${filteredClips.length} clips`);
      
      // Send the processing request
      const response = await axios.post(
        `${apiUrl}/api/zips/process`,
        {
          clips: filteredClips.map((clip, index) => {
            const ratingData = ratings[clip._id];
            const mostChosenRating = ratingData.ratingCounts.reduce(
              (max, rateData) => (rateData.count > max.count ? rateData : max),
              ratingData.ratingCounts[0]
            );
            return { ...clip, rating: mostChosenRating.rating, index }; // Include index for tracking
          }),
          season: season,
          year: year
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to process clips');
      }

      const { jobId } = response.data;
      console.log(`Process job started with ID: ${jobId}`);
      setProcessJobId(jobId);

      // We don't need the polling logic anymore since we're using WebSockets,
      // but we'll keep a simplified version as a fallback
      if (!isConnected) {
        let pollFrequency = 3000;
        
        const checkProgress = async () => {
          try {
            const statusResponse = await axios.get(
              `${apiUrl}/api/zips/process-status/${jobId}`,
              {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              }
            );
            
            const { progress, status } = statusResponse.data;
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
              alert(`Error: ${statusResponse.data.error || 'Unknown error'}`);
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

  const handleDeleteAllClips = async (): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete all clips?")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiUrl}/api/clips`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchClipsAndRatings();
      console.log('All clips deleted successfully');
    } catch (error) {
      console.error('Error deleting all clips:', error);
    }
  };

  const getSeason = (): void => {
    const { season } = getCurrentSeason();
    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      season
    }));
    setCurrentYear(new Date().getFullYear());
  };

  const openProcessModal = (): void => {
    setProcessModalOpen(true);
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
        <LoadingBar color='#f11946' progress={progress} onLoaderFinished={() => setProgress(0)} />
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
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="container max-w-7xl px-4 pt-20 pb-20 text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 flex flex-col items-center justify-center animate-fade">
          <h1 className="text-5xl font-bold mb-8 text-center">Loading Dashboard</h1>
          <BiLoaderCircle className="animate-spin text-7xl" />
        </div>
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200 animate-fade">
          {/* Season Info */}
          <SeasonInfo 
            seasonInfo={seasonInfo} 
            deniedClips={deniedClips} 
          />

          {/* Statistics */}
          <Statistics
            clipTeam={clipTeam}
            userRatings={userRatings}
            seasonInfo={seasonInfo}
            adminStats={adminStats}
          />

          {/* Main grid layout with improved spacing */}
          <div className="mt-10 space-y-10">
            {/* Admin Config and Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <ConfigPanel
                config={config}
                handleConfigChange={handleConfigChange}
                handleConfigSubmit={handleConfigSubmit}
              />

              <AdminActions
                openProcessModal={openProcessModal}
                handleDeleteAllClips={handleDeleteAllClips}
                downloading={downloading}
              />
            </div>

            {/* User Management Section */}
            <div className="space-y-10">
              {/* User List */}
              <UserList
                fetchUsers={fetchUsers}
                disabledUsers={disabledUsers}
                setDisabledUsers={setDisabledUsers}
                AVAILABLE_ROLES={AVAILABLE_ROLES}
                apiUrl={apiUrl}
              />

              {/* Create User and Disabled Users Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <CreateUser
                  fetchUsers={fetchUsers}
                  AVAILABLE_ROLES={AVAILABLE_ROLES}
                  apiUrl={apiUrl}
                />

                <div className="w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
                    <FaUserClock className="mr-3 text-yellow-500" />
                    Disabled Users
                  </h2>
                  
                  {!disabledUsers.length ? (
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

            {/* Zip Manager - Full Width */}
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
              apiUrl={apiUrl}
            />

            {/* Denied Clips - Full Width */}
            <DeniedClips
              clips={clips}
              ratings={ratings}
              config={config}
              location={location}
            />
          </div>
        </div>
      )}
      <ProcessClipsModal
        isOpen={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        onProcess={processClips}
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
    </div>
  );
}

export default AdminDash;
