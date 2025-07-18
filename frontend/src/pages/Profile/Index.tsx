import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { FaExclamationTriangle, FaArrowLeft, FaUser, FaChartBar } from 'react-icons/fa';
import LoadingBar from 'react-top-loading-bar';
import { User } from '../../types/adminTypes';
import EditProfileModal from './EditModal';
import ProfileHeader from './components/ProfileHeader';
import ClipsSection from './components/ClipsSection';
import TrophiesSection from './components/TrophiesSection';
import SocialLinks from './components/SocialLinks';
import StatsSection from './components/StatsSection';

import { usePublicProfile, useMyProfile } from '../../hooks/useProfile';
import { useCurrentUser } from '../../hooks/useUser';

const ProfilePage: React.FC<{ currentUser?: User }> = ({ currentUser }) => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: currentUserData } = useCurrentUser();
  const user = currentUser || currentUserData;
  
  const token = localStorage.getItem('token');
  const currentUserId = user?._id || '';
  
  const isOwnProfile = !userId || userId === 'me' || userId === currentUserId;
  
  const { 
    data: profile, 
    isLoading, 
    error,
    refetch 
  } = isOwnProfile 
    ? useMyProfile() 
    : usePublicProfile(userId || '');

  const [showEditModal, setShowEditModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentView, setCurrentView] = useState<'profile' | 'stats'>(() => {
    const savedView = localStorage.getItem('profileViewPreference');
    return (savedView === 'stats' || savedView === 'profile') ? savedView : 'profile';
  });

  const [viewSwitchTimestamp, setViewSwitchTimestamp] = useState<number>(Date.now());
  
  const handleViewChange = (view: 'profile' | 'stats') => {
    console.log('Switching view from', currentView, 'to', view);
    setCurrentView(view);
    localStorage.setItem('profileViewPreference', view);
    setViewSwitchTimestamp(Date.now());
    console.log('View switched to', view, 'timestamp:', Date.now());
  };

  useEffect(() => {
    if (userId === 'me' && token && currentUserId) {
      navigate(`/profile/${currentUserId}`, { replace: true });
      return;
    }

    if (!userId && token && currentUserId) {
      navigate(`/profile/${currentUserId}`, { replace: true });
      return;
    }
  }, [userId, currentUserId, token, navigate]);

  useEffect(() => {
    if (isLoading) {
      setProgress(50);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [isLoading]);

  const hasClipteamRole = user?.roles?.includes('clipteam') || false;

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

  if (isLoading) {
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
              {error?.message || 'The profile you are looking for does not exist or is private.'}
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
                {isOwnProfile && user && hasClipteamRole && (
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
                    {isOwnProfile && user && hasClipteamRole && (
                      <StatsSection
                        user={user}
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
          onSuccess={() => {
            refetch();
            setShowEditModal(false);
          }}
        />
      )}
    </motion.div>
  );
};

export default ProfilePage;
