import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import axios from 'axios';

function ProfilePage({ user, setUser }) {
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [message, setMessage] = useState('');

  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleProfilePictureUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    try {
      const response = await axios.post(`${apiUrl}/api/users/uploadProfilePicture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setUser({ ...user, profilePicture: response.data.profilePictureUrl });
        setMessage('Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setMessage('Error uploading profile picture');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const updateData = { username };
    if (password) updateData.password = password;

    try {
      const response = await axios.put(`${apiUrl}/api/users/${user._id}`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.message) {
        setUser({ ...user, username });
        setMessage('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile');
    }
  };

  const linkDiscordAccount = () => {
    window.location.href = `${apiUrl}/api/discord/auth?siteUserId=${user._id}`;
  };

  const unlinkDiscordAccount = () => {
    const response = axios.put(`${apiUrl}/api/users/${user._id}`, { discordId: "", discordUsername: "" }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (response.data.message) {
      setUser({ ...user, discordId: response.data.discordId, discordUsername: response.data.discordUsername });
      setMessage('Discord account unlinked successfully');
    }
  };

  return (
    <div className="min-h-screen text-white relative bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>{user && user.username + "'s profile"}</title>
        <meta name="description" description={user && user.username + "'s profile page"}
        />
      </Helmet>
      <div className="flex h-96 justify-center items-center animate-fade" style={{ backgroundImage: `url(${user.profilePicture})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="flex bg-gradient-to-b from-neutral-900 to-bg-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-4xl font-bold mb-4 text-center">Profile Page</h1>
            <h1 className="text-2xl font-semibold mb-4 text-center">{user.username}</h1>
          </div>
        </div>
      </div>
      <div className="grid text-white p-4 pt-8 bg-neutral-200 dark:bg-neutral-900 transition duration-200 justify-center">
        {message && <p className="my-4 px-4 py-3 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200">{message}</p>}
        <div className="grid md:grid-cols-2 gap-4 justify-center container animate-fade">
          <div className="flex-col items-center justify-center p-4 mt-2 rounded-md text-neutral-900 dark:text-white bg-neutral-300 dark:bg-neutral-800 transition duration-200">
            <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-4">
                <label className="block text-neutral-800 dark:text-gray-200">New Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full text-neutral-900 rounded-md p-1"
                />
              </div>
              <div className="mb-4">
                <label className="block text-neutral-800 dark:text-gray-200">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full text-neutral-900 rounded-md p-1"
                />
              </div>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                Update
              </button>
            </form>
          </div>
          <div className="flex-col items-center justify-center p-4 mt-2 rounded-md text-neutral-900 dark:text-white bg-neutral-300 dark:bg-neutral-800 transition duration-200">
            <h1 className="text-2xl font-bold mb-4">Edit Profile Picture</h1>
            <img src={user.profilePicture} alt={user.username} className="h-32 w-32 rounded-full" />
            <form onSubmit={handleProfilePictureUpload} className="mt-4">
              <div className="mb-4">
                <label className="block text-neutral-800 dark:text-gray-200">Profile Picture</label>
                <input type="file" onChange={handleProfilePictureChange} accept="image/*" className="mt-1 block w-full" />
              </div>
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                Upload Profile Picture
              </button>
            </form>
          </div>
          <div className="items-center justify-center p-4 mt-2 rounded-md text-neutral-900 dark:text-white bg-neutral-300 dark:bg-neutral-800 transition duration-200">
            <h1 className="text-2xl font-bold">Discord</h1>
            {user.discordId ? (
              <>
                <p>Discord account linked to {user.discordUsername}</p>
                <p>Discord ID: {user.discordId}</p>
                <button onClick={unlinkDiscordAccount} className="flex items-center justify-center w-full my-2 bg-blurple hover:bg-blurple-dark text-white py-2 rounded-md focus:outline-none focus:bg-blurple-dark transition duration-300">
                  Unlink?
                </button>
              </>
            ) : (
              <>
                <p>Link your Discord account to access more features</p>
                <button onClick={linkDiscordAccount} className="flex items-center justify-center w-full my-2 bg-blurple hover:bg-blurple-dark text-white py-2 rounded-md focus:outline-none focus:bg-blurple-dark transition duration-300">
                  Link Discord Account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;