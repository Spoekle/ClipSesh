import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaCamera, 
  FaDiscord, 
  FaCheck, 
  FaTimes, 
  FaUpload, 
  FaEdit,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';
import { User } from '../types/adminTypes';

interface ProfilePageProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, setUser }) => {
  const [username, setUsername] = useState<string>(user.username);
  const [email, setEmail] = useState<string>(user.email || '');
  const [password, setPassword] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'connections'>('profile');
  
  const { showSuccess, showError, showWarning } = useNotification();
  
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5000000) {
        showError('Image size should be less than 5MB');
        return;
      }
      
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpload = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!profilePicture) {
      showWarning('Please select an image first');
      return;
    }

    setLoading(true);
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
        showSuccess('Profile picture updated successfully');
        setProfilePicture(null);
        setPreviewUrl(null);
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      showError(error.response?.data?.message || 'Error uploading profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (username.trim() === '') {
      showError('Username cannot be empty');
      return;
    }
    
    if (email.trim() === '') {
      showError('Email cannot be empty');
      return;
    }
    
    const updateData: { username: string; email: string; password?: string } = { username, email };
    if (password) updateData.password = password;

    setLoading(true);
    try {
      const response = await axios.put(`${apiUrl}/api/users/${user._id}`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.message) {
        setUser({ ...user, username, email });
        showSuccess('Profile updated successfully');
        setPassword('');
        setShowPassword(false);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const linkDiscordAccount = (): void => {
    window.location.href = `${apiUrl}/api/discord/auth?siteUserId=${user._id}`;
  };

  const unlinkDiscordAccount = async (): Promise<void> => {
    if (window.confirm('Are you sure you want to unlink your Discord account?')) {
      setLoading(true);
      try {
        const response = await axios.put(`${apiUrl}/api/users/${user._id}`, { discordId: "", discordUsername: "" }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data.message) {
          setUser({ ...user, discordId: undefined, discordUsername: undefined });
          showSuccess('Discord account unlinked successfully');
        }
      } catch (error: any) {
        console.error('Error unlinking Discord account:', error);
        showError(error.response?.data?.message || 'Error unlinking Discord account');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen text-white relative bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>{user && user.username + "'s profile"}</title>
        <meta name="description" content={user && user.username + "'s profile page"} />
      </Helmet>
      
      <div
        className="flex h-96 justify-center items-center animate-fade"
        style={{
          backgroundImage: `url(${user.profilePicture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
        }}
      >
        <div className="flex bg-gradient-to-b from-neutral-900/80 to-bg-black/40 backdrop-blur-md justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center px-4 md:px-0">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4 text-center text-white drop-shadow-lg"
            >
              Profile Page
            </motion.h1>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl font-semibold mb-4 text-center text-white/90 drop-shadow-md"
            >
              {user.username}
            </motion.h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-12 pb-16 bg-neutral-200 dark:bg-neutral-900 transition duration-200">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto mb-6 gap-2 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-white'
            }`}
          >
            <FaUser /> My Profile
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'avatar'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-white'
            }`}
          >
            <FaCamera /> Profile Picture
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'connections'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-white'
            }`}
          >
            <FaDiscord /> Connections
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-md hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
              <FaEdit className="mr-2" /> Edit Profile
            </h2>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                  <FaUser className="mr-2" /> Username:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="p-3 pl-10 w-full rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-400 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    placeholder="Enter your username"
                  />
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                  <FaEnvelope className="mr-2" /> Email:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-3 pl-10 w-full rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-400 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    placeholder="Enter your email address"
                  />
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                  <FaLock className="mr-2" /> Password:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p-3 pl-10 pr-10 w-full rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-400 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    placeholder="Leave blank to keep current password"
                  />
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
                  
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 focus:outline-none"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 flex justify-center items-center"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                ) : (
                  <>
                    <FaCheck className="mr-2" /> Update Profile
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Avatar Tab */}
        {activeTab === 'avatar' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-md hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
              <FaCamera className="mr-2" /> Profile Picture
            </h2>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <img 
                  src={previewUrl || user.profilePicture} 
                  alt={user.username} 
                  className="h-40 w-40 rounded-full object-cover border-4 border-neutral-200 dark:border-neutral-700" 
                />
                {previewUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <span className="text-white font-medium">Preview</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full">
                <form onSubmit={handleProfilePictureUpload} className="space-y-6">
                  <div className="flex flex-col">
                    <label className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                      <FaUpload className="mr-2" /> Upload New Image:
                    </label>
                    
                    <div className="mt-1 relative">
                      <input 
                        type="file" 
                        onChange={handleProfilePictureChange} 
                        accept="image/*" 
                        className="hidden" 
                        id="profile-picture-upload" 
                      />
                      <label 
                        htmlFor="profile-picture-upload" 
                        className="cursor-pointer flex items-center justify-center w-full p-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white rounded-lg border border-dashed border-neutral-400 dark:border-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition duration-200"
                      >
                        <FaCamera className="mr-2" />
                        <span>Select an image</span>
                      </label>
                      {profilePicture && (
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                          Selected: {profilePicture.name} ({Math.round(profilePicture.size / 1024)} KB)
                        </p>
                      )}
                    </div>
                    
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      Recommended: Square image, max 5MB
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !profilePicture}
                    whileHover={{ scale: !loading && profilePicture ? 1.02 : 1 }}
                    whileTap={{ scale: !loading && profilePicture ? 0.98 : 1 }}
                    className={`w-full py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-200 flex justify-center items-center ${
                      !profilePicture
                        ? 'bg-neutral-400 text-white cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white font-bold focus:ring-green-500'
                    }`}
                  >
                    {loading ? (
                      <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                    ) : (
                      <>
                        <FaUpload className="mr-2" /> Upload New Picture
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-md hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
              <FaDiscord className="mr-2 text-indigo-500" /> Discord Integration
            </h2>

            <div className="flex flex-col items-center p-6 bg-neutral-200 dark:bg-neutral-700 rounded-xl">
              {user.discordId ? (
                <div className="w-full text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <FaDiscord className="text-4xl text-indigo-500" />
                    <div className="text-left">
                      <p className="font-medium text-lg">
                        Connected to Discord
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        as <span className="font-semibold">{user.discordUsername}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-100 dark:bg-neutral-600 p-4 rounded-lg mt-4 text-left">
                    <p className="text-sm">
                      <span className="font-medium">Discord ID:</span> {user.discordId}
                    </p>
                  </div>
                  
                  <motion.button
                    onClick={unlinkDiscordAccount}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition duration-200"
                  >
                    {loading ? (
                      <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                    ) : (
                      <>
                        <FaTimes /> Unlink Discord Account
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="w-full text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <FaDiscord className="text-4xl text-neutral-500 dark:text-neutral-400" />
                    <div className="text-left">
                      <p className="font-medium text-lg">
                        Not Connected
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Link your Discord account for additional features
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={linkDiscordAccount}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-200"
                  >
                    {loading ? (
                      <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                    ) : (
                      <>
                        <FaDiscord /> Connect Discord Account
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;