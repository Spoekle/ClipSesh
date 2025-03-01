import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { BiLoaderCircle } from 'react-icons/bi';
import LoadingBar from 'react-top-loading-bar';
import background from '../media/admin.jpg';
import { FaDiscord, FaDownload, FaTrash, FaUserClock } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import DeniedClips from './components/adminDash/DeniedClips';
import UserList from './components/adminDash/UserList';
import Statistics from './components/adminDash/Statistics';
import CreateUser from './components/adminDash/CreateUser';
import ConfigPanel from './components/adminDash/ConfigPanel';
import AdminActions from './components/adminDash/AdminActions';
import ZipManager from './components/adminDash/ZipManager';
import SeasonInfo from './components/adminDash/SeasonInfo';

function AdminDash() {
  const [allUsers, setAllUsers] = useState([]);
  const [otherRoles, setOtherRoles] = useState([]);
  const [allActiveUsers, setAllActiveUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [clipTeam, setClipTeam] = useState([]);
  const [editors, setEditors] = useState([]);
  const [uploader, setUploader] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [disabledUsers, setDisabledUsers] = useState([]);
  const [config, setConfig] = useState({ denyThreshold: 5, latestVideoLink: '' });
  const [clips, setClips] = useState([]);
  const [ratings, setRatings] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [userRatings, setUserRatings] = useState([]);
  const [seasonInfo, setSeasonInfo] = useState({});
  const [zips, setZips] = useState([]);
  const [zipsLoading, setZipsLoading] = useState(true);
  const AVAILABLE_ROLES = ['user', 'admin', 'clipteam', 'editor', 'uploader'];
  const [adminStats, setAdminStats] = useState({
    userCount: 0,
    activeUserCount: 0,
    clipCount: 0,
    ratedClipsCount: 0,
    deniedClipsCount: 0
  });

  const location = useLocation();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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

  const fetchZips = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/zips`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setZips(response.data);
      setZipsLoading(false);
    } catch (error) {
      console.error('Error fetching zips:', error);
      setZipsLoading(false);
    }
  };

  const deleteZip = async (zipId) => {
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/api/users`, {
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
      if (error.response && error.response.status === 403) {
        window.location.href = '/clips';
        alert('You do not have permission to view this page.');
      }
    }
  };

  const handleApproveUser = async (userId) => {
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

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/admin/config`,);

      if (response) {
        setConfig(response.data[0]);
        console.log('Config fetched successfully:', response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchClipsAndRatings = async () => {
    try {
      const clipResponse = await axios.get(`${apiUrl}/api/clips`);
      setClips(clipResponse.data);
      setProgress(65);
      const token = localStorage.getItem('token');
      if (token) {
        const ratingPromises = clipResponse.data.map(clip =>
          axios.get(`${apiUrl}/api/ratings/${clip._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        setProgress(80);
        const ratingResponses = await Promise.all(ratingPromises);
        const ratingsData = ratingResponses.reduce((acc, res, index) => {
          acc[clipResponse.data[index]._id] = res.data;
          setProgress(90);
          return acc;
        }, {});
        setRatings(ratingsData);
      }
    } catch (error) {
      console.error('Error fetching clips and ratings:', error);
    }
  };

  const deniedClips = clips.filter(clip => {
    const ratingData = ratings[clip._id];
    return ratingData && ratingData.ratingCounts.some(rateData => rateData.rating === 'deny' && rateData.count >= config.denyThreshold);
  }).length;

  useEffect(() => {
    if (Object.keys(ratings).length > 0) {
      countRatingsPerUser();
    }
  }, [ratings]);

  const countRatingsPerUser = () => {
    const userRatingCount = {};

    [...clipTeam, ...admins]
      .filter(user => user.username !== 'UploadBot' && !['editor', 'uploader'].includes(user.roles))
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

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: name === 'denyThreshold' ? Number(value) : value
    });
  };

  const handleConfigSubmit = async (e) => {
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

  const handleDelete = async (id) => {
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

  const [zipFile, setZipFile] = useState(null);
  const [clipAmount, setClipAmount] = useState(0);

  const handleZipChange = (e) => {
    setZipFile(e.target.files[0]);
  };

  const handleClipAmountChange = (e) => {
    const clipAmount = Number(e.target.value);
    if (clipAmount >= 0) {
      setClipAmount(clipAmount);
    }
  };

  const handleZipSubmit = async (e) => {
    e.preventDefault();
    if (!zipFile) {
      return;
    }

    const formData = new FormData();

    formData.append('clipsZip', zipFile);
    formData.append('clipAmount', clipAmount);
    formData.append('season', seasonInfo.season);

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

  const processClips = async () => {
    if (!window.confirm("Are you sure you want to process these clips?")) {
      return;
    }

    setDownloading(true);

    const filteredClips = clips.filter((clip) => {
      const ratingData = ratings[clip._id];
      return (
        ratingData &&
        ratingData.ratingCounts.every(
          (rateData) => rateData.rating !== 'deny' || rateData.count < config.denyThreshold
        )
      );
    });

    try {
      const response = await axios.post(
        `${apiUrl}/api/zips/process`,
        {
          clips: filteredClips.map((clip) => {
            const ratingData = ratings[clip._id];
            const mostChosenRating = ratingData.ratingCounts.reduce(
              (max, rateData) => (rateData.count > max.count ? rateData : max),
              ratingData.ratingCounts[0]
            );
            return { ...clip, rating: mostChosenRating.rating };
          }),
          season: seasonInfo.season,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to process clips');
      }

      alert('Zipped clips stored in DB successfully!');
      fetchZips();
    } catch (error) {
      console.error('Error processing clips:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAllClips = async () => {
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

  const getSeason = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    let season = '';

    if (
      (month === 3 && day >= 20) ||
      (month > 3 && month < 6) ||
      (month === 6 && day <= 20)
    ) {
      season = 'Spring';
    } else if (
      (month === 6 && day >= 21) ||
      (month > 6 && month < 9) ||
      (month === 9 && day <= 20)
    ) {
      season = 'Summer';
    } else if (
      (month === 9 && day >= 21) ||
      (month > 9 && month < 12) ||
      (month === 12 && day <= 20)
    ) {
      season = 'Fall';
    } else {
      season = 'Winter';
    }

    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      season
    }));
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
                processClips={processClips}
                handleDeleteAllClips={handleDeleteAllClips}
                downloading={downloading}
              />
            </div>

            {/* User Management Section */}
            <div className="space-y-10">
              {/* User List */}
              <UserList
                users={users}
                admins={admins}
                clipTeam={clipTeam}
                editors={editors}
                uploader={uploader}
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
    </div>
  );
}

export default AdminDash;
