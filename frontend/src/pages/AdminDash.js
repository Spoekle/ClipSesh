import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { BiLoaderCircle } from 'react-icons/bi';
import LoadingBar from 'react-top-loading-bar';
import background from '../media/admin.jpg';
import { FaDiscord } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import DeniedClips from './components/adminDash/DeniedClips';
import UserList from './components/adminDash/UserList';
import Statistics from './components/adminDash/Statistics';
import CreateUser from './components/adminDash/CreateUser';

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
  const AVAILABLE_ROLES = ['user', 'admin', 'clipteam', 'editor', 'uploader'];

  const location = useLocation();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      await fetchUsers();
      setProgress(10);
      await fetchConfig();
      setProgress(30);
      getSeason();
      setProgress(50);
      await fetchClipsAndRatings();
      setProgress(100);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
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

  const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [zipFile, setZipFile] = useState(null);

  const handleZipChange = (e) => {
    setZipFile(e.target.files[0]);
  };

  const handleZipSubmit = async (e) => {
    e.preventDefault();
    if (!zipFile) {
      return;
    }

    const formData = new FormData();
    formData.append('zip', zipFile);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/api/zips/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      alert('Clips uploaded successfully');
      fetchClipsAndRatings();
    } catch (error) {
      console.error('Error uploading clips:', error);
      alert('Failed to upload clips. Please try again.');
    }
  };

  const downloadClips = async () => {
    if (!window.confirm("Are you sure you want to download the clips? This might take a while so please stay on this page.")) {
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
      const response = await axios.post(`${apiUrl}/zips/download`, {
        clips: filteredClips.map(clip => {
          const ratingData = ratings[clip._id];
          const mostChosenRating = ratingData.ratingCounts.reduce((max, rateData) =>
            rateData.count > max.count ? rateData : max, ratingData.ratingCounts[0]
          );
          return { ...clip, rating: mostChosenRating.rating };
        }),
      }, {
        responseType: 'blob',
      });

      if (response.status !== 200) {
        throw new Error('Failed to download clips');
      }

      const blob = new Blob([response.data], { type: 'application/zip' });
      const currentDate = getCurrentDate();
      saveAs(blob, `clips-${currentDate}.zip`);
    } catch (error) {
      console.error('Error downloading clips:', error);
    }
    finally {
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
    const currentDate = new Date().toLocaleDateString();
    let season = '';

    if (currentDate >= '12-21' || currentDate <= '03-19') {
      season = 'Winter';
    } else if (currentDate >= '03-20' && currentDate <= '06-20') {
      season = 'Spring';
    } else if (currentDate >= '06-21' && currentDate <= '09-21') {
      season = 'Summer';
    } else {
      season = 'Fall';
    }

    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      season
    }));
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>Admin Dash</title>
        <meta name="description" description="ClipSesh! is a site for Beat Saber players by Beat Saber players. On this site you will be able to view all submitted clips"
        />
      </Helmet>
      <div className='w-full'>
        <LoadingBar color='#f11946' progress={progress} onLoaderFinished={() => setProgress(0)} />
      </div>
      <div className="w-full flex h-96 justify-center items-center animate-fade" style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="flex bg-gradient-to-b from-neutral-900 to-bg-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-4xl font-bold mb-4 text-center">Admin Dashboard</h1>
            <h1 className="text-3xl mb-4 text-center">Manage the unmanaged...</h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="container pt-20 mb-4 text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 flex flex-col items-center justify-center animate-fade">
          <h1 className="text-5xl font-bold mb-8 text-center">Loading...</h1>
          <BiLoaderCircle className="animate-spin text-7xl" />
        </div>
      ) : (

        <div className="container pt-20 mb-4 text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200 justify-center justify-items-center animate-fade">
          <div className="w-full p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-md shadow-md">
            <h2 className="text-3xl font-bold mb-4">Season info</h2>
            <div className="grid grid-cols-2 text-center justify-center">
              <h2 className="text-2xl font-bold mb-4">Season: {seasonInfo.season}</h2>
              <div>
                <h2 className="text-2xl font-bold mb-4">Clip Amount: {seasonInfo.clipAmount}</h2>
                <h2 className="text-xl font-semibold mb-4 text-red-600">Denied Clips: {deniedClips}</h2>
              </div>
            </div>
          </div>

          <Statistics
            clipTeam={clipTeam}
            userRatings={userRatings}
            seasonInfo={seasonInfo}
          />

          <div className="grid mt-8 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 w-full">

            <CreateUser
              fetchUsers={fetchUsers}
              AVAILABLE_ROLES={AVAILABLE_ROLES}
              apiUrl={apiUrl}
            />

            <div className="col-span-1 min-w-full w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-8 rounded-md shadow-md animate-fade animate-delay-300">
              <h2 className="text-3xl font-bold mb-4">Disabled users</h2>
              {!disabledUsers.length ? (
                <p className="text-gray-300">No disabled users.</p>
              ) : (
                disabledUsers.map(user => (
                  <div
                    key={user._id}
                    className={`relative bg-neutral-900 p-4 w-full min-h-16 rounded-lg hover:bg-neutral-950 transition-all duration-300 overflow-hidden ${editUser && editUser._id === user._id ? 'max-h-screen' : 'max-h-32'}`}
                    style={{ transition: 'max-height 0.3s ease-in-out' }}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center filter blur-sm"
                      style={{
                        backgroundImage: `url(${user.profilePicture})`,
                      }}
                    ></div>
                    <div className="absolute inset-0 bg-black opacity-50 rounded-lg"></div>
                    <div className="relative z-10 flex justify-between items-center">
                      <div className='flex-col justify-between items-center'>
                        <p className="flex justify-between items-center text-white">{user.username}
                          <FaDiscord className="ml-2" style={{ color: user.discordId ? '#7289da' : '#747f8d' }} />
                        </p>
                      </div>
                      <div>
                        <button
                          onClick={() => handleApproveUser(user._id)}
                          className="bg-blue-500/50 hover:bg-blue-600 backdrop-blur-2xl text-white font-bold py-1 px-2 rounded-md mr-2 transition duration-200"
                        >
                          Enable
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="bg-red-500/50 hover:bg-red-600 backdrop-blur-2xl text-white font-bold py-1 px-2 rounded-md transition duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

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
            />

            <div className="col-span-1 w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-8 rounded-md shadow-md animate-fade animate-delay-500">
              <h2 className="text-3xl font-bold mb-4">Admin Config</h2>
              <div className="flex gap-4">
                <form onSubmit={handleConfigSubmit}>
                  <div className="mb-4">
                    <label htmlFor="denyThreshold" className="block text-neutral-900 dark:text-gray-300">Deny Threshold:</label>
                    <input
                      type="number"
                      id="denyThreshold"
                      name="denyThreshold"
                      value={config.denyThreshold}
                      onChange={handleConfigChange}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md focus:outline-none focus:bg-neutral-200 dark:focus:bg-neutral-700"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md focus:outline-none focus:bg-blue-600"
                  >
                    Update Config
                  </button>
                </form>
                <form onSubmit={handleConfigSubmit}>
                  <div className="mb-4">
                    <label htmlFor="latestVideoLink" className="block text-neutral-900 dark:text-gray-300">Latest Video Link:</label>
                    <input
                      type="text"
                      id="latestVideoLink"
                      name="latestVideoLink"
                      value={config.latestVideoLink}
                      onChange={handleConfigChange}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md focus:outline-none focus:bg-neutral-200 dark:focus:bg-neutral-700"
                      required
                    />
                  </div>
                </form>
              </div>
            </div>

            <div className="col-span-1 w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-8 rounded-md shadow-md animate-fade animate-delay-[600ms]">
              <h2 className="text-3xl font-bold mb-4">Download Clips</h2>
              {downloading && (
                <div className="flex flex-col justify-center items-center space-y-2">
                  <BiLoaderCircle className="animate-spin h-5 w-5 text-white" />
                  <span>Downloading Clips...</span>
                  <progress value={progress} max="100" className="w-full"></progress>
                </div>
              )}
              <button
                onClick={downloadClips}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-md focus:outline-none focus:bg-green-600"
              >
                Download All Clips
              </button>
              <h2 className="text-3xl font-bold my-4">Reset Database</h2>
              <button
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-md focus:outline-none focus:bg-red-600"
                onClick={handleDeleteAllClips}
              >
                Reset Database
              </button>
            </div>

            <div className="col-span-1 w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-8 rounded-md shadow-md animate-fade animate-delay-[700ms]">
              <h2 className="text-3xl font-bold mb-4">Upload Zip</h2>
              <form onSubmit={handleZipSubmit}>
                <div className="mb-4">
                  <label htmlFor="zip" className="block text-neutral-900 dark:text-gray-300">Zip File:</label>
                  <input
                    type="file"
                    id="zip"
                    name="zip"
                    onChange={handleZipChange}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md focus:outline-none focus:bg-neutral-200 dark:focus:bg-neutral-700"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md focus:outline-none focus:bg-blue-600"
                >
                  Upload Zip
                </button>
              </form>
            </div>

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
