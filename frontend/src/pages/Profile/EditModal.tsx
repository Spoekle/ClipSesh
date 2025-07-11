import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  FaUser,
  FaSave,
  FaTimes,
  FaGlobe,
  FaYoutube,
  FaTwitch,
  FaTwitter,
  FaInstagram,
  FaGithub,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
  FaDiscord,
  FaLink,
  FaUnlink,
  FaCog,
  FaInfoCircle,
  FaShareAlt
} from 'react-icons/fa';
import LoadingBar from 'react-top-loading-bar';
import { getMyProfile, updateProfile } from '../../services/profileService';
import { updateMyBasicInfo, updateMyBasicInfoWithPassword, uploadProfilePicture } from '../../services/userService';
import { linkDiscordAccount, unlinkDiscordAccount } from '../../services/discordService';
import { PublicProfile, ProfileFormData, BasicUserInfo, VR_HEADSETS } from '../../types/profileTypes';
import { useNotification } from '../../context/AlertContext';

type TabType = 'user-info' | 'profile' | 'social-links' | 'privacy';

interface EditProfileModalProps {
  onClose: () => void;
  onSuccess: (updatedProfile: PublicProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, onSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('user-info');
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    bio: '',
    website: '',
    socialLinks: {
      youtube: '',
      twitch: '',
      twitter: '',
      instagram: '',
      github: ''
    },
    vrheadset: 'Other',
    isPublic: true
  });
  // User basic info form state
  const [userInfo, setUserInfo] = useState<BasicUserInfo>({
    username: '',
    email: ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Utility functions for social links
  const getSocialPrefix = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'https://youtube.com/@';
      case 'twitch': return 'https://twitch.tv/';
      case 'twitter': return 'https://twitter.com/';
      case 'instagram': return 'https://instagram.com/';
      case 'github': return 'https://github.com/';
      default: return '';
    }
  };

  const stripSocialPrefix = (platform: string, url: string): string => {
    if (!url) return '';

    // If it's already a username (no protocol), return as is
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url;
    }

    const prefix = getSocialPrefix(platform);
    if (prefix && url.startsWith(prefix)) {
      return url.slice(prefix.length);
    }

    // Handle other URL formats for the platform
    switch (platform) {
      case 'youtube':
        if (url.includes('youtube.com/c/')) {
          return url.split('youtube.com/c/')[1] || '';
        }
        if (url.includes('youtube.com/channel/')) {
          return url.split('youtube.com/channel/')[1] || '';
        }
        if (url.includes('youtube.com/user/')) {
          return url.split('youtube.com/user/')[1] || '';
        }
        break;
      case 'twitter':
        if (url.includes('twitter.com/')) {
          return url.split('twitter.com/')[1]?.replace('@', '') || '';
        }
        break;
      case 'instagram':
        if (url.includes('instagram.com/')) {
          return url.split('instagram.com/')[1] || '';
        }
        break;
      case 'twitch':
        if (url.includes('twitch.tv/')) {
          return url.split('twitch.tv/')[1] || '';
        }
        break;
      case 'github':
        if (url.includes('github.com/')) {
          return url.split('github.com/')[1] || '';
        }
        break;
    }

    // If we can't parse it, return the original URL
    return url;
  };

  const addSocialPrefix = (platform: string, username: string): string => {
    if (!username) return '';

    // If it's already a full URL, return as is
    if (username.startsWith('http://') || username.startsWith('https://')) {
      return username;
    }

    const prefix = getSocialPrefix(platform);
    return prefix ? `${prefix}${username}` : username;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setProgress(10);
      setLoading(true);

      try {
        setProgress(50);
        const profileData = await getMyProfile();
        setProfile(profileData);        // Initialize profile form data with cleaned social links
        setFormData({
          bio: profileData.profile?.bio || '',
          website: profileData.profile?.website || '',
          socialLinks: {
            youtube: stripSocialPrefix('youtube', profileData.profile?.socialLinks?.youtube || ''),
            twitch: stripSocialPrefix('twitch', profileData.profile?.socialLinks?.twitch || ''),
            twitter: stripSocialPrefix('twitter', profileData.profile?.socialLinks?.twitter || ''),
            instagram: stripSocialPrefix('instagram', profileData.profile?.socialLinks?.instagram || ''),
            github: stripSocialPrefix('github', profileData.profile?.socialLinks?.github || '')
          },
          vrheadset: profileData.profile?.vrheadset || 'Other',
          isPublic: profileData.profile?.isPublic !== false // Default to true if undefined
        });

        // Initialize user info form data
        setUserInfo({
          username: profileData.username || '',
          email: profileData.email || ''
        });

        setProfilePicturePreview(profileData.profilePicture || '');
        setProgress(100);
      } catch (err: unknown) {
        console.error('Error fetching profile:', err);
        showError('Failed to load profile');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [onClose, showError]);
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate username
    if (!userInfo.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (userInfo.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Validate email
    if (userInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password fields if any password field is filled
    const isChangingPassword = passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword;
    if (isChangingPassword) {
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      if (!passwordData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (passwordData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      }
      if (!passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Validate bio
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const cleanFormDataForSubmission = () => {
    const cleanedSocialLinks: { [key: string]: string } = {};

    Object.entries(formData.socialLinks).forEach(([platform, url]) => {
      cleanedSocialLinks[platform] = addSocialPrefix(platform, url as string);
    });

    return {
      ...formData,
      socialLinks: cleanedSocialLinks
    };
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Please fix the errors before submitting');
      return;
    }

    setSaving(true);
    setProgress(10);

    try {      // Update profile picture first if there's a new one
      if (profilePictureFile) {
        setProgress(30);
        await uploadProfilePicture(profilePictureFile);
      }      // Update user basic info (with or without password)
      setProgress(50);
      const isChangingPassword = passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword;
      
      if (isChangingPassword) {
        await updateMyBasicInfoWithPassword({
          ...userInfo,
          password: passwordData.newPassword
        });
      } else {
        await updateMyBasicInfo(userInfo);
      }

      // Update profile data with cleaned social links
      setProgress(70);
      const cleanedFormData = cleanFormDataForSubmission();
      await updateProfile(cleanedFormData); setProgress(100);
      showSuccess('Profile updated successfully');

      // Clear password fields after successful update
      if (isChangingPassword) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }

      // Fetch updated profile and pass to parent
      const updatedProfile = await getMyProfile();
      onSuccess(updatedProfile);
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      showError((err as Error)?.message || 'Failed to update profile');
      setProgress(100);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value as string
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value as string
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  const handleUserInfoChange = (field: keyof BasicUserInfo, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChange = (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleLinkDiscord = () => {
    if (profile?._id) {
      linkDiscordAccount(profile._id);
    } else {
      showError('Unable to link Discord account. Please try again.');
    }
  };

  const handleUnlinkDiscord = async () => {
    if (!profile?._id) {
      showError('Unable to unlink Discord account. Please try again.');
      return;
    }

    try {
      setSaving(true);
      await unlinkDiscordAccount(profile._id);

      // Update local state to reflect the change
      setProfile(prev => prev ? {
        ...prev,
        discordId: undefined,
        discordUsername: undefined
      } : prev);

      showSuccess('Discord account unlinked successfully');
    } catch (error: unknown) {
      showError((error as Error)?.message || 'Failed to unlink Discord account');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image file must be less than 5MB');
        return;
      }

      setProfilePictureFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <FaYoutube className="text-red-500" />;
      case 'twitch': return <FaTwitch className="text-purple-500" />;
      case 'twitter': return <FaTwitter className="text-blue-400" />;
      case 'instagram': return <FaInstagram className="text-pink-500" />;
      case 'github': return <FaGithub className="text-neutral-700 dark:text-neutral-300" />;
      default: return <FaGlobe className="text-neutral-500" />;
    }
  };

  const tabs = [
    {
      id: 'user-info' as TabType,
      label: 'User Info',
      icon: <FaUser className="w-4 h-4" />
    },
    {
      id: 'profile' as TabType,
      label: 'Profile',
      icon: <FaInfoCircle className="w-4 h-4" />
    },
    {
      id: 'social-links' as TabType,
      label: 'Social Links',
      icon: <FaShareAlt className="w-4 h-4" />
    },
    {
      id: 'privacy' as TabType,
      label: 'Privacy',
      icon: <FaCog className="w-4 h-4" />
    }
  ];
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <LoadingBar
          color="#3b82f6"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
          shadow={true}
          height={4}
        />
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-neutral-300 border-t-blue-500 rounded-full mx-auto"
          />
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-center">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-neutral-800 rounded-xl p-8 max-w-md mx-4"
        >
          <FaExclamationTriangle className="text-6xl text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 text-center">
            Access Denied
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center">
            You need to be logged in to edit your profile.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Profile | ClipSesh</title>
        <meta name="description" content="Edit your ClipSesh profile settings" />
      </Helmet>

      <LoadingBar
        color="#3b82f6"
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
        shadow={true}
        height={4}
      />
      {/* Modal Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-200/50 dark:border-neutral-700/50 w-full max-w-5xl h-[85vh] sm:h-[85vh] md:h-[85vh] flex flex-col overflow-hidden mx-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="dark:bg-neutral-900/50 text-white p-6 relative overflow-hidden flex-shrink-0">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <FaUser className="text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Edit Profile</h1>
                  <p className="text-white/80">Update your profile information</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 border border-white/30"
              >
                <FaTimes className="text-lg" />
              </motion.button>
            </div>
          </div>
          {/* Tab Navigation */}
          <div className="border-b border-neutral-200/50 dark:border-neutral-700/50 bg-neutral-50/50 dark:bg-neutral-900/50 flex-shrink-0">
            <nav className="flex overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 hover:scrollbar-thumb-neutral-400 dark:hover:scrollbar-thumb-neutral-500 px-6 space-x-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 py-4 px-4 sm:px-6 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-lg whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800 shadow-md transform translate-y-0'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/70 dark:hover:bg-neutral-800/70 hover:transform hover:-translate-y-0.5'
                    }`}
                >
                  <div className='w-5 h-5 rounded flex items-center justify-center'>
                    {tab.icon}
                  </div>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                </motion.button>
              ))}
            </nav>
          </div>          {/* Tab Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-300 dark:scrollbar-track-neutral-800 dark:scrollbar-thumb-neutral-600 hover:scrollbar-thumb-neutral-400 dark:hover:scrollbar-thumb-neutral-500 pb-32 sm:pb-24">
              <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="flex-1 min-h-[500px] max-w-4xl mx-auto w-full">
                  <AnimatePresence mode="wait">

                    {activeTab === 'user-info' && (
                      <motion.div
                        key="user-info"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={fadeIn}
                        className="space-y-6 sm:space-y-8 h-full"
                      >
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                          User Information
                        </h2>
                        {/* Profile Picture */}
                        <div className="space-y-4">
                          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Profile Picture
                          </label>
                          <div className="flex items-center space-x-8">
                            <div className="relative group">
                              <img
                                src={profilePicturePreview || profile?.profilePicture}
                                alt="Profile"
                                className="w-24 h-24 rounded-2xl object-cover border-3 border-neutral-200 dark:border-neutral-600 group-hover:border-blue-400 transition-all duration-300 shadow-lg group-hover:shadow-xl"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                                <span className="text-white text-xs font-medium">Change</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                              file:mr-4 file:py-3 file:px-6
                              file:rounded-xl file:border-0
                              file:text-sm file:font-semibold
                              file:bg-gradient-to-r file:from-blue-50 file:to-purple-50 file:text-blue-700
                              hover:file:from-blue-100 hover:file:to-purple-100 file:transition-all file:duration-200 file:shadow-sm hover:file:shadow-md
                              dark:file:from-blue-900/20 dark:file:to-purple-900/20 dark:file:text-blue-400"
                              />
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                                <strong>Tip:</strong> Square images work best. Recommended size: 400x400px or larger (max 5MB)
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* Username */}
                        <div className="space-y-4">
                          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Username
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={userInfo.username}
                              onChange={(e) => handleUserInfoChange('username', e.target.value)}
                              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg ${errors.username ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                                }`}
                              placeholder="Your username"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                              <FaUser className="text-neutral-400" />
                            </div>
                          </div>
                          {errors.username && (
                            <motion.span
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
                            >
                              <FaExclamationTriangle className="text-xs" />
                              {errors.username}
                            </motion.span>
                          )}
                        </div>

                        {/* Email */}
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Email
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={userInfo.email}
                              onChange={(e) => handleUserInfoChange('email', e.target.value)}
                              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white transition-all duration-200 ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                                }`}
                              placeholder="your.email@example.com"
                            />
                          </div>
                          {errors.email && (
                            <motion.span
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm flex items-center gap-2"
                            >
                              <FaExclamationTriangle className="text-xs" />
                              {errors.email}
                            </motion.span>
                          )}
                        </div>                        {/* Discord Linking */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Discord Account
                          </label>

                          {profile?.discordId ? (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <FaDiscord className="text-[#5865F2] text-xl" />
                                  <div>
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                      Discord Linked
                                    </p>
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                      {profile.discordUsername || 'Unknown Username'}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleUnlinkDiscord}
                                  disabled={saving}
                                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                                >
                                  <FaUnlink className="mr-2" />
                                  Unlink
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <FaDiscord className="text-[#5865F2] text-xl" />
                                  <div>
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                      Link Discord Account
                                    </p>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                      Connect your Discord account for enhanced features
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleLinkDiscord}
                                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-[#5865F2] hover:bg-[#4752C4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5865F2]"
                                >
                                  <FaLink className="mr-2" />
                                  Link Discord
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Password Change Section */}
                        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-8">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                            Change Password
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                            Leave these fields empty if you don't want to change your password.
                          </p>

                          {/* Current Password */}
                          <div className="space-y-3 mb-6">
                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white transition-all duration-200 pr-12 ${errors.currentPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                                  }`}
                                placeholder="Enter your current password"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                              >
                                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                            {errors.currentPassword && (
                              <motion.span
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm flex items-center gap-2"
                              >
                                <FaExclamationTriangle className="text-xs" />
                                {errors.currentPassword}
                              </motion.span>
                            )}
                          </div>

                          {/* New Password */}
                          <div className="space-y-3 mb-6">
                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                              New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white transition-all duration-200 pr-12 ${errors.newPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                                  }`}
                                placeholder="Enter your new password"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                              >
                                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                            {errors.newPassword && (
                              <motion.span
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm flex items-center gap-2"
                              >
                                <FaExclamationTriangle className="text-xs" />
                                {errors.newPassword}
                              </motion.span>
                            )}
                          </div>

                          {/* Confirm Password */}
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white transition-all duration-200 pr-12 ${errors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                                  }`}
                                placeholder="Confirm your new password"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                              >
                                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                            {errors.confirmPassword && (
                              <motion.span
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm flex items-center gap-2"
                              >
                                <FaExclamationTriangle className="text-xs" />
                                {errors.confirmPassword}
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'profile' && (
                      <motion.div
                        key="profile"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={fadeIn}
                        className="space-y-6 sm:space-y-8 h-full"
                      >
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                          Profile Information
                        </h2>

                        {/* Bio */}
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Bio
                          </label>
                          <div className="relative">
                            <textarea
                              value={formData.bio}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              placeholder="Tell the community about yourself..."
                              rows={5}
                              maxLength={500}
                              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 transition-all duration-200 resize-none ${errors.bio ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                                }`}
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-neutral-400 bg-white dark:bg-neutral-700 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-600">
                              {(formData.bio || '').length}/500
                            </div>
                          </div>
                          {errors.bio && (
                            <motion.span
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm flex items-center gap-2"
                            >
                              <FaExclamationTriangle className="text-xs" />
                              {errors.bio}
                            </motion.span>
                          )}
                        </div>

                        {/* Website */}
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Website
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={formData.website}
                              onChange={(e) => handleInputChange('website', e.target.value)}
                              placeholder="https://your-website.com"
                              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 transition-all duration-200 ${errors.website ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                                }`}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <FaGlobe className="text-neutral-400" />
                            </div>
                          </div>
                          {errors.website && (
                            <motion.span
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm flex items-center gap-2"
                            >
                              <FaExclamationTriangle className="text-xs" />
                              {errors.website}
                            </motion.span>
                          )}
                        </div>

                        {/* VR Headset */}
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            VR Headset
                          </label>
                          <div className="relative">
                            <select
                              value={formData.vrheadset}
                              onChange={(e) => handleInputChange('vrheadset', e.target.value)}
                              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer ${errors.vrheadset ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                                }`}
                            >
                              {VR_HEADSETS.map((headset) => (
                                <option key={headset} value={headset}>
                                  {headset}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-5 h-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          {errors.vrheadset && (
                            <motion.span
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm flex items-center gap-2"
                            >
                              <FaExclamationTriangle className="text-xs" />
                              {errors.vrheadset}
                            </motion.span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'social-links' && (
                      <motion.div
                        key="social-links"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={fadeIn}
                        className="space-y-8 h-full"
                      >                    <div>
                          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
                            Social Media Links
                          </h2>
                        </div>
                        {/* Social Links */}
                        <div className="grid gap-8">
                          {Object.entries(formData.socialLinks).map(([platform, url]) => (
                            <div key={platform} className="space-y-4">
                              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 capitalize mb-2">
                                {getSocialIcon(platform)}
                                {platform}
                              </label>
                              <div className="relative flex shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-700 dark:to-neutral-600 border-2 border-r-0 border-neutral-200 dark:border-neutral-600 px-4 rounded-l-xl">
                                  <div className="flex items-center gap-3 whitespace-nowrap">
                                    <div className="text-lg">
                                      {getSocialIcon(platform)}
                                    </div>
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono bg-white dark:bg-neutral-800 px-2 py-1 rounded border">
                                      {getSocialPrefix(platform)}
                                    </span>
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  value={url}
                                  onChange={(e) => handleInputChange(`socialLinks.${platform}`, e.target.value)}
                                  placeholder="yourusername"
                                  className={`flex-1 px-4 py-4 border-2 border-l-0 rounded-r-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 transition-all duration-200 ${errors[`socialLinks.${platform}`] ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                                    }`}
                                />
                              </div>
                              {errors[`socialLinks.${platform}`] && (
                                <motion.span
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-red-500 text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
                                >
                                  <FaExclamationTriangle className="text-xs" />
                                  {errors[`socialLinks.${platform}`]}
                                </motion.span>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'privacy' && (
                      <motion.div
                        key="privacy"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={fadeIn}
                        className="space-y-8 h-full"
                      >
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                          Privacy Settings
                        </h2>

                        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-600 shadow-sm">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${formData.isPublic
                                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                                  : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                                }`}>
                                {formData.isPublic ? (
                                  <FaEye className="text-xl" />
                                ) : (
                                  <FaEyeSlash className="text-xl" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                                  Public Profile
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                  {formData.isPublic
                                    ? 'Your profile is visible to everyone and appears in search results. Other users can view your clips, stats, and activity.'
                                    : 'Your profile is private and only visible to you. It won\'t appear in search results and your content is hidden from other users.'
                                  }
                                </p>
                                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${formData.isPublic
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                  }`}>
                                  <div className={`w-2 h-2 rounded-full ${formData.isPublic ? 'bg-green-500' : 'bg-amber-500'
                                    }`} />
                                  {formData.isPublic ? 'Public' : 'Private'}
                                </div>
                              </div>
                            </div>

                            <motion.label
                              className="relative inline-flex items-center cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.isPublic}
                                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-14 h-8 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all after:shadow-md dark:border-neutral-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
                            </motion.label>
                          </div>
                        </div>

                        {/* Additional Privacy Info */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <FaInfoCircle className="text-blue-500 text-lg mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                                Privacy Notice
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-400">
                                Changing your privacy settings will take effect immediately.
                                Your clips and activity history will be affected by this setting.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>                </div>
              </form>
            </div>
            
            {/* Modal Footer - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm p-4 sm:p-6">
              <div className="flex justify-end gap-3 sm:gap-4 max-w-4xl mx-auto">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 sm:px-8 py-3 border-2 border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.02, y: saving ? 0 : -1 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 sm:px-10 py-3 rounded-xl transition-all duration-200 flex items-center justify-center font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-md"
                  onClick={handleSubmit}
                >
                  {saving ? (
                  <>
                    <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Saving...
                  </>
                  ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default EditProfileModal;
