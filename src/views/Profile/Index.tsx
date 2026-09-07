import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/lib/routerCompat';
import { motion } from 'framer-motion';
import { Helmet } from '@/lib/helmetCompat';
import { FaExclamationTriangle, FaUser, FaChartBar, FaHome } from 'react-icons/fa';
import LoadingBar from 'react-top-loading-bar';
import { User } from '../../types/adminTypes';
import EditProfileModal from './EditModal';
import ProfileHeader from './components/ProfileHeader';
import ClipsSection from './components/ClipsSection';
import SocialLinks from './components/SocialLinks';
import StatsSection from './components/StatsSection';
import ProfileViewerHeader from './components/ProfileViewerHeader';
import Breadcrumbs from '../../components/common/Breadcrumbs';

import { usePublicProfile, useMyProfile } from '../../hooks/useProfile';
import { useCurrentUser } from '../../hooks/useUser';

const ProfilePage: React.FC<{ currentUser?: User }> = ({ currentUser }) => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: currentUserData } = useCurrentUser();
  const user = currentUser || currentUserData;

  const token = safeLocalStorage.getItem('token');
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
    const savedView = safeLocalStorage.getItem('profileViewPreference');
    return (savedView === 'stats' || savedView === 'profile') ? savedView : 'profile';
  });

  const [viewSwitchTimestamp, setViewSwitchTimestamp] = useState<number>(Date.now());

  const handleViewChange = (view: 'profile' | 'stats') => {
    console.log('Switching view from', currentView, 'to', view);
    setCurrentView(view);
    safeLocalStorage.setItem('profileViewPreference', view);
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
      <div className="min-h-screen bg-[#0e1315] transition-colors duration-200">
        <LoadingBar
          color="#f23030"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
          shadow={true}
          height={4}
        />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#263238] border-t-[#f23030] rounded-full"
          />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] transition-colors duration-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-24 h-24 bg-[#161d21] rounded-[10px] flex items-center justify-center mx-auto mb-6 border border-[#263238]">
              <FaExclamationTriangle className="text-4xl text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-[#e6e6e6] mb-4">
              Profile Not Found
            </h1>
            <p className="text-[#b3b3b3] mb-8 leading-relaxed">
              {error?.message || 'The profile you are looking for does not exist or is private.'}
            </p>
            <Breadcrumbs
              items={[
                { label: 'Home', path: '/', icon: <FaHome className="w-3.5 h-3.5" /> },
                { label: 'Profile' }
              ]}
              className="justify-center"
            />
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
      className="min-h-screen bg-[#0b0b0b] transition-all duration-300"
    >
      <Helmet>
        <title>{profile.username} - Profile | ClipSesh</title>
        <meta
          name="description"
          content={`View ${profile.username}'s profile on ClipSesh. ${profile.profile?.bio || 'Beat Saber community member.'}`}
        />
      </Helmet>

      <LoadingBar
        color="#f23030"
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
        shadow={true}
        height={4}
      />

      {/* Hero Header */}
      <ProfileViewerHeader username={profile.username} profilePicture={profile.profilePicture} />

      {/* Main Content */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8 pt-8 pb-20">
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
              {/* Left Sidebar - Social */}
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
              </div>

              {/* Main Content - Clips & Stats */}
              <div className="lg:col-span-3 space-y-6 lg:space-y-8">
                {/* Tab Navigation - Only show if user has access to stats */}
                {isOwnProfile && user && hasClipteamRole && (
                  <motion.div variants={fadeIn}>
                    <div className="inline-flex p-1 bg-[#161d21] rounded-[10px] border border-[#263238] w-full">
                      <button
                        onClick={() => handleViewChange('profile')}
                        className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-[8px] transition-all duration-150 flex items-center justify-center gap-2 ${currentView === 'profile'
                          ? 'bg-[#f23030] text-white'
                          : 'text-[#b3b3b3] hover:text-[#e6e6e6]'
                          }`}
                      >
                        <FaUser className="w-3.5 h-3.5" />
                        Profile View
                      </button>
                      <button
                        onClick={() => handleViewChange('stats')}
                        className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-[8px] transition-all duration-150 flex items-center justify-center gap-2 ${currentView === 'stats'
                          ? 'bg-[#f23030] text-white'
                          : 'text-[#b3b3b3] hover:text-[#e6e6e6]'
                          }`}
                      >
                        <FaChartBar className="w-3.5 h-3.5" />
                        Stats View
                      </button>
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
