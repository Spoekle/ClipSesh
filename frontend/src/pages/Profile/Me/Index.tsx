import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaGlobe,
  FaYoutube,
  FaTwitch,
  FaTwitter,
  FaInstagram,
  FaGithub,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaSpinner
} from 'react-icons/fa';
import { useNotification } from '../../../context/NotificationContext';
import { getMyProfile, updateProfile } from '../../../services/profileService';
import { ProfileFormData } from '../../../types/profileTypes';

const MyProfileEdit: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  
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
    isPublic: false
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();
        if (response) {
          setFormData({
            bio: response.bio || '',
            website: response.website || '',
            socialLinks: {
              youtube: response.socialLinks?.youtube || '',
              twitch: response.socialLinks?.twitch || '',
              twitter: response.socialLinks?.twitter || '',
              instagram: response.socialLinks?.instagram || '',
              github: response.socialLinks?.github || ''
            },
            isPublic: response.isPublic || false
          });
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        showError('Failed to load profile');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, [showError]);

  const handleInputChange = (field: keyof ProfileFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await updateProfile(formData);
      if (response) {
        showSuccess('Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <FaYoutube className="text-red-500" />;
      case 'twitch': return <FaTwitch className="text-purple-500" />;
      case 'twitter': return <FaTwitter className="text-blue-400" />;
      case 'instagram': return <FaInstagram className="text-pink-500" />;
      case 'github': return <FaGithub className="text-gray-600 dark:text-gray-400" />;
      default: return <FaGlobe />;
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="text-2xl text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Bio Section */}
        <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white flex items-center">
            <FaUser className="mr-2" /> About Me
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full p-3 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-400 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Tell others about yourself..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Website
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full p-3 pl-10 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-400 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  placeholder="https://your-website.com"
                />
                <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">
            Social Links
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(formData.socialLinks).map(([platform, url]) => (
              <div key={platform}>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 capitalize">
                  {platform}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-400 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    placeholder={`Your ${platform} URL`}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {getSocialIcon(platform)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">
            Privacy Settings
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
            <div className="flex items-center gap-3">
              {formData.isPublic ? (
                <FaEye className="text-green-500" />
              ) : (
                <FaEyeSlash className="text-red-500" />
              )}
              <div>
                <p className="font-medium text-neutral-800 dark:text-white">
                  Public Profile
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {formData.isPublic 
                    ? 'Your profile is visible to everyone'
                    : 'Your profile is private'
                  }
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-500 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 flex justify-center items-center"
        >
          {loading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <>
              <FaSave className="mr-2" /> Save Profile
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default MyProfileEdit;
