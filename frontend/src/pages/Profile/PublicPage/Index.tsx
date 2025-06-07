import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaDiscord, 
  FaGlobe,
  FaYoutube,
  FaTwitch,
  FaTwitter,
  FaInstagram,
  FaGithub,
  FaClipboard,
  FaArrowLeft,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { getPublicProfile } from '../../../services/profileService';
import { PublicProfile } from '../../../types/profileTypes';
import { useNotification } from '../../../context/NotificationContext';

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showError } = useNotification();
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('Invalid user ID');
        setLoading(false);
        return;
      }

      try {
        const profileData = await getPublicProfile(userId);
        setProfile(profileData);
      } catch (err: any) {
        console.error('Error fetching public profile:', err);
        setError(err.message || 'Failed to load profile');
        showError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, showError]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-200 dark:bg-neutral-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <FaSpinner className="text-4xl text-blue-500 animate-spin mb-4 mx-auto" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-neutral-200 dark:bg-neutral-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <FaExclamationTriangle className="text-4xl text-yellow-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
            Profile Not Found
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {error || 'This profile is either private or does not exist.'}
          </p>
          <button
            onClick={() => navigate('/clips')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            <FaArrowLeft /> Back to Clips
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>{profile.username}'s Profile - ClipSesh</title>
        <meta name="description" content={`View ${profile.username}'s public profile on ClipSesh`} />
      </Helmet>
      
      {/* Header Section */}
      <div
        className="flex h-96 justify-center items-center animate-fade"
        style={{
          backgroundImage: `url(${profile.profilePicture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
        }}
      >
        <div className="flex bg-gradient-to-b from-neutral-900/80 to-bg-black/40 backdrop-blur-md justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center px-4 md:px-0">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <img 
                src={profile.profilePicture} 
                alt={profile.username} 
                className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg" 
              />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold mb-2 text-center text-white drop-shadow-lg"
            >
              {profile.username}
            </motion.h1>
            
            {profile.discordUsername && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-2 text-white/90 drop-shadow-md"
              >
                <FaDiscord className="text-indigo-400" />
                <span>{profile.discordUsername}</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-12 pb-16">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors"
          >
            <FaArrowLeft /> Back
          </motion.button>

          {/* Bio Section */}
          {profile.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-6 shadow-md"
            >
              <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white flex items-center">
                <FaUser className="mr-2" /> About
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {profile.bio}
              </p>
            </motion.div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-6 shadow-md"
            >
              <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white flex items-center">
                <FaClipboard className="mr-2" /> Stats
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Clips Submitted:</span>
                  <span className="font-semibold text-neutral-800 dark:text-white">
                    {profile.stats?.clipsSubmitted || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Member Since:</span>
                  <span className="font-semibold text-neutral-800 dark:text-white">
                    {formatDate(profile.joinDate)}
                  </span>
                </div>
                {profile.lastActive && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 dark:text-neutral-400">Last Active:</span>
                    <span className="font-semibold text-neutral-800 dark:text-white">
                      {formatDate(profile.lastActive)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Links Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-6 shadow-md"
            >
              <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white flex items-center">
                <FaGlobe className="mr-2" /> Links
              </h2>
              <div className="space-y-3">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                  >
                    <FaGlobe className="text-blue-500" />
                    <span className="text-neutral-800 dark:text-white">Website</span>
                  </a>
                )}
                
                {Object.entries(profile.socialLinks || {}).map(([platform, url]) => (
                  url && (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    >
                      {getSocialIcon(platform)}
                      <span className="text-neutral-800 dark:text-white capitalize">
                        {platform}
                      </span>
                    </a>
                  )
                ))}
                
                {!profile.website && 
                 (!profile.socialLinks || Object.values(profile.socialLinks).every(link => !link)) && (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
                    No links available
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* User Roles Badge */}
          {profile.roles && profile.roles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2 justify-center"
            >
              {profile.roles.map((role: string) => (
                <span
                  key={role}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    role === 'admin'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : role === 'editor'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : role === 'clipteam'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
