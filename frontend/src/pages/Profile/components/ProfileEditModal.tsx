import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaCamera, 
  FaDiscord, 
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaYoutube,
  FaTwitch,
  FaTwitter,
  FaInstagram,
  FaGithub,
  FaSave,
  FaSpinner,
  FaUpload,
  FaTimes
} from 'react-icons/fa';
import { User } from '../../../types/adminTypes';
import { ProfileFormData } from '../../../types/profileTypes';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  profileFormData: ProfileFormData;
  setProfileFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  profilePicture: File | null;
  setProfilePicture: React.Dispatch<React.SetStateAction<File | null>>;
  previewUrl: string | null;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
  showUnlinkConfirmation: boolean;
  setShowUnlinkConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
  updateLoading: boolean;
  onAccountUpdate: () => void;
  onProfileUpdate: () => void;
  onProfilePictureUpload: () => void;
  onProfilePictureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDiscordAuth: () => void;
  onDiscordUnlink: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  profileFormData,
  setProfileFormData,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  profilePicture,
  previewUrl,
  showUnlinkConfirmation,
  setShowUnlinkConfirmation,
  updateLoading,
  onAccountUpdate,
  onProfileUpdate,
  onProfilePictureUpload,
  onProfilePictureChange,
  onDiscordAuth,
  onDiscordUnlink
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'profile' | 'avatar' | 'connections'>('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: <FaUser /> },
    { id: 'profile', label: 'Profile', icon: <FaGlobe /> },
    { id: 'avatar', label: 'Avatar', icon: <FaCamera /> },
    { id: 'connections', label: 'Connections', icon: <FaDiscord /> }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Edit Profile</h2>
            <button
              onClick={onClose}
              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-3 text-neutral-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-3 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Password (leave blank to keep current)
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onAccountUpdate}
                  disabled={updateLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  Update Account
                </motion.button>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileFormData.bio}
                    onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <FaGlobe className="absolute left-3 top-3 text-neutral-500" />
                    <input
                      type="url"
                      value={profileFormData.website}
                      onChange={(e) => setProfileFormData({ ...profileFormData, website: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://your-website.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      YouTube
                    </label>
                    <div className="relative">
                      <FaYoutube className="absolute left-3 top-3 text-red-500" />
                      <input
                        type="url"
                        value={profileFormData.socialLinks.youtube}
                        onChange={(e) => setProfileFormData({
                          ...profileFormData,
                          socialLinks: { ...profileFormData.socialLinks, youtube: e.target.value }
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="YouTube channel URL"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Twitch
                    </label>
                    <div className="relative">
                      <FaTwitch className="absolute left-3 top-3 text-purple-500" />
                      <input
                        type="url"
                        value={profileFormData.socialLinks.twitch}
                        onChange={(e) => setProfileFormData({
                          ...profileFormData,
                          socialLinks: { ...profileFormData.socialLinks, twitch: e.target.value }
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Twitch channel URL"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Twitter
                    </label>
                    <div className="relative">
                      <FaTwitter className="absolute left-3 top-3 text-blue-400" />
                      <input
                        type="url"
                        value={profileFormData.socialLinks.twitter}
                        onChange={(e) => setProfileFormData({
                          ...profileFormData,
                          socialLinks: { ...profileFormData.socialLinks, twitter: e.target.value }
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Twitter profile URL"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Instagram
                    </label>
                    <div className="relative">
                      <FaInstagram className="absolute left-3 top-3 text-pink-500" />
                      <input
                        type="url"
                        value={profileFormData.socialLinks.instagram}
                        onChange={(e) => setProfileFormData({
                          ...profileFormData,
                          socialLinks: { ...profileFormData.socialLinks, instagram: e.target.value }
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Instagram profile URL"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      GitHub
                    </label>
                    <div className="relative">
                      <FaGithub className="absolute left-3 top-3 text-neutral-600 dark:text-neutral-400" />
                      <input
                        type="url"
                        value={profileFormData.socialLinks.github}
                        onChange={(e) => setProfileFormData({
                          ...profileFormData,
                          socialLinks: { ...profileFormData.socialLinks, github: e.target.value }
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="GitHub profile URL"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={profileFormData.isPublic}
                    onChange={(e) => setProfileFormData({ ...profileFormData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPublic" className="text-neutral-700 dark:text-neutral-300">
                    Make profile public
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onProfileUpdate}
                  disabled={updateLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  Update Profile
                </motion.button>
              </div>
            )}

            {activeTab === 'avatar' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-neutral-300 dark:bg-neutral-800 mb-4">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : user.profilePicture ? (
                      <img src={user.profilePicture} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-neutral-600 dark:text-neutral-500">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <label className="inline-block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onProfilePictureChange}
                      className="hidden"
                    />
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg transition-colors"
                    >
                      <FaUpload />
                      Choose Image
                    </motion.div>
                  </label>
                  
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>

                {profilePicture && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onProfilePictureUpload}
                    disabled={updateLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    Upload Avatar
                  </motion.button>
                )}
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="space-y-6">
                <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaDiscord className="text-2xl text-indigo-500" />
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white">Discord</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {user.discordUsername ? `Connected as ${user.discordUsername}` : 'Connect your Discord account'}
                        </p>
                      </div>
                    </div>
                    
                    {user.discordUsername ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowUnlinkConfirmation(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Disconnect
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onDiscordAuth}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        Connect
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showUnlinkConfirmation}
          onCancel={() => setShowUnlinkConfirmation(false)}
          onConfirm={onDiscordUnlink}
          title="Unlink Discord Account"
          message="Are you sure you want to unlink your Discord account? This action cannot be undone."
          confirmText="Unlink"
          cancelText="Cancel"
          confirmVariant="danger"
        />
      </div>
    </AnimatePresence>
  );
};

export default ProfileEditModal;
