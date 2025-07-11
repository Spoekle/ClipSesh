import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { FaExclamationTriangle, FaArrowLeft, FaUser, FaChartBar } from 'react-icons/fa';
import LoadingBar from 'react-top-loading-bar';
import { getPublicProfile, getMyProfile } from '../../services/profileService';
import { PublicProfile } from '../../types/profileTypes';
import { User } from '../../types/adminTypes';
import EditProfileModal from './EditModal';
import ProfileHeader from './components/ProfileHeader';
import ClipsSection from './components/ClipsSection';
import TrophiesSection from './components/TrophiesSection';
import SocialLinks from './components/SocialLinks';
import StatsSection from './components/StatsSection';

const ProfilePage: React.FC<{ currentUser?: User }> = ({ currentUser }) => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); const [currentView, setCurrentView] = useState<'profile' | 'stats'>(() => {
    // Remember user's last selected view if they have stats access
    const savedView = localStorage.getItem('profileViewPreference');
    return (savedView === 'stats' || savedView === 'profile') ? savedView : 'profile';
  });

  // Simple timestamp to trigger data refresh when switching views
  const [viewSwitchTimestamp, setViewSwitchTimestamp] = useState<number>(Date.now());
  // Save view preference to localStorage and trigger refresh - simple direct state change like EditModal
  const handleViewChange = (view: 'profile' | 'stats') => {
    console.log('Switching view from', currentView, 'to', view);
    setCurrentView(view);
    localStorage.setItem('profileViewPreference', view);
    // Update timestamp to trigger fresh data fetch in components
    setViewSwitchTimestamp(Date.now());
    console.log('View switched to', view, 'timestamp:', Date.now());
  };

  // Get current user info for comparison
  const token = localStorage.getItem('token');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    // Get current user ID if logged in
    if (token) {
      const getCurrentUser = async () => {
        try {
          const myProfile = await getMyProfile();
          setCurrentUserId(myProfile._id);
        } catch (err) {
          // Not critical if this fails
        }
      };
      getCurrentUser();
    }
  }, [token]); useEffect(() => {
    // Handle special cases for routing
    if (userId === 'me' && token && currentUserId) {
      // Redirect /profile/me to actual user ID
      navigate(`/profile/${currentUserId}`, { replace: true });
      return;
    }

    // If no userId in URL but user is logged in, redirect to their own profile
    if (!userId && token && currentUserId) {
      navigate(`/profile/${currentUserId}`, { replace: true });
      return;
    }

    const fetchProfile = async () => {
      if (!userId || userId === 'me') return;

      setProgress(10);
      setLoading(true);
      setError('');

      try {
        setProgress(50);

        // Check if this is the user's own profile
        const ownProfile = currentUserId === userId;
        setIsOwnProfile(ownProfile);

        let profileData: PublicProfile;

        if (ownProfile && token) {
          // Use private endpoint for own profile
          profileData = await getMyProfile();
        } else {
          // Use public endpoint for other users
          profileData = await getPublicProfile(userId);
        }
        console.log('Fetched profile:', profileData);
        setProfile(profileData);

        setProgress(100);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
        setProgress(100);
      } finally {
        setLoading(false);
      }
    };

    if (userId && (currentUserId || !token)) {
      fetchProfile();
    }
  }, [userId, currentUserId, token, navigate]);
  const hasClipteamRole = currentUser?.roles?.includes('clipteam') || false;

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-200 dark:bg-neutral-900 transition-colors duration-200">
        <LoadingBar
          color="#3b82f6"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
          shadow={true}
          height={4}
        />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-neutral-300 border-t-blue-500 rounded-full"
          />
        </div>
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-neutral-200 dark:bg-neutral-900 transition-colors duration-200">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-200/50 dark:border-amber-700/50">
              <FaExclamationTriangle className="text-4xl text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              Profile Not Found
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              {error || 'The profile you are looking for does not exist or is private.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center mx-auto shadow-lg hover:shadow-xl"
            >
              <FaArrowLeft className="mr-2" />
              Go Back
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-neutral-200 dark:bg-neutral-900 transition-all duration-300"
    >
      <Helmet>
        <title>{profile.username} - Profile | ClipSesh</title>
        <meta
          name="description"
          content={`View ${profile.username}'s profile on ClipSesh. ${profile.profile?.bio || 'Beat Saber community member.'}`}
        />
      </Helmet>

      <LoadingBar
        color="#3b82f6"
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
        shadow={true}
        height={4}
      />

      {/* Hero Background */}
      <div className="relative overflow-hidden">

        <div className="relative container mx-auto px-4 pt-8 pb-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-10"
          >
            {/* Profile Header */}
            <motion.div variants={fadeIn}>
              <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                onEditClick={() => setShowEditModal(true)}
              />
            </motion.div>
            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6 lg:gap-8">
              {/* Left Sidebar - Social & Trophies */}
              <div className="lg:col-span-1 space-y-6">

                {/* Social Links */}
                {(profile.profile?.website || Object.values(profile.profile?.socialLinks || {}).some(link => link)) && (
                  <motion.div variants={fadeIn}>
                    <SocialLinks
                      socialLinks={profile.profile?.socialLinks || {}}
                      website={profile.profile?.website || ''}
                    />
                  </motion.div>
                )}

                {/* Trophies Section */}
                {(profile.profile?.trophies?.length || 0) > 0 && (
                  <motion.div variants={fadeIn}>
                    <TrophiesSection trophies={profile.profile?.trophies || []} />
                  </motion.div>
                )}
              </div>
              {/* Main Content - Clips & Stats */}
              <div className="lg:col-span-3 space-y-6 lg:space-y-8">
                {/* Tab Navigation - Only show if user has access to stats */}
                {isOwnProfile && currentUser && hasClipteamRole && (
                  <motion.div variants={fadeIn}>
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="flex relative">
                        <motion.div
                          className="absolute top-0 bottom-0 bg-blue-500 transition-all duration-300 ease-in-out"
                          style={{
                            width: '50%',
                            left: currentView === 'profile' ? '0%' : '50%'
                          }}
                        />                        
                        <button
                          onClick={() => handleViewChange('profile')}
                          className={`relative z-10 flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${currentView === 'profile'
                              ? 'text-white'
                              : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100'
                            }`}
                        >
                          <FaUser className="w-4 h-4" />
                          Profile View
                        </button>
                        <button
                          onClick={() => handleViewChange('stats')}
                          className={`relative z-10 flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${currentView === 'stats'
                              ? 'text-white'
                              : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100'
                            }`}
                        >
                          <FaChartBar className="w-4 h-4" />
                          Stats View
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentView === 'profile' && (
                  <>
                    {/* Clips Section */}
                    {profile.discordId && (
                      <ClipsSection
                        profile={profile}
                        isOwnProfile={isOwnProfile}
                        viewSwitchTimestamp={viewSwitchTimestamp}
                      />
                    )}
                  </>
                )}

                {currentView === 'stats' && (
                  <>
                    {/* Stats Section - Only for logged-in users with clipteam role */}
                    {isOwnProfile && currentUser && hasClipteamRole && (
                      <StatsSection
                        user={currentUser}
                        viewSwitchTimestamp={viewSwitchTimestamp}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          onClose={() => setShowEditModal(false)}
          onSuccess={(updatedProfile) => {
            setProfile(updatedProfile);
            setShowEditModal(false);
          }}
        />
      )}
    </motion.div>
  );
};

export default ProfilePage;