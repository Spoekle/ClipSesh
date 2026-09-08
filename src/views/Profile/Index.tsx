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
    setCurrentView(view);
    safeLocalStorage.setItem('profileViewPreference', view);
    setViewSwitchTimestamp(Date.now());
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
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] transition-colors duration-200 flex flex-col justify-center items-center">
        <LoadingBar
          color="#f23030"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
          shadow={true}
          height={3}
        />
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#262626] border-t-cc-red"></div>
        <span className="mt-3 text-xs text-[#aaaaaa]">Loading profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] py-16">
        <div className="max-w-300 mx-auto px-4 sm:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-center max-w-md mx-auto bg-[#181818] border border-[#262626] rounded-2xl p-8 shadow-sm"
          >
            <div className="w-16 h-16 bg-[#141414] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#262626] text-[#eab308]">
              <FaExclamationTriangle size={24} />
            </div>
            <h1 className="text-xl font-bold text-[#f1f1f1] mb-2">
              Profile Not Found
            </h1>
            <p className="text-xs text-[#aaaaaa] mb-6 leading-relaxed">
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
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1]"
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
        height={3}
      />

      {/* Hero Header */}
      <ProfileViewerHeader username={profile.username} profilePicture={profile.profilePicture} />

      {/* Main Content */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-300 mx-auto px-4 sm:px-8 pt-6 pb-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            {/* Profile Header Card */}
            <motion.div variants={fadeIn}>
              <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                onEditClick={() => setShowEditModal(true)}
              />
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar - Social Links */}
              <div className="lg:col-span-1 space-y-6">
                {(profile.profile?.website || Object.values(profile.profile?.socialLinks || {}).some(link => link)) && (
                  <motion.div variants={fadeIn}>
                    <SocialLinks
                      socialLinks={profile.profile?.socialLinks || {}}
                      website={profile.profile?.website || ''}
                    />
                  </motion.div>
                )}
              </div>

              {/* Main Content Area - Clips & Stats */}
              <div className={`${(profile.profile?.website || Object.values(profile.profile?.socialLinks || {}).some(link => link)) ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6`}>
                {/* Tab Navigation for Reviewers */}
                {isOwnProfile && user && hasClipteamRole && (
                  <motion.div variants={fadeIn}>
                    <div className="inline-flex p-1 bg-[#141414] rounded-xl border border-[#262626] w-full sm:w-auto">
                      <button
                        onClick={() => handleViewChange('profile')}
                        className={`flex-1 sm:flex-initial py-2 px-5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          currentView === 'profile'
                            ? 'bg-cc-red text-white shadow-sm'
                            : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                        }`}
                      >
                        <FaUser size={12} />
                        <span>Profile View</span>
                      </button>
                      <button
                        onClick={() => handleViewChange('stats')}
                        className={`flex-1 sm:flex-initial py-2 px-5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          currentView === 'stats'
                            ? 'bg-cc-red text-white shadow-sm'
                            : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                        }`}
                      >
                        <FaChartBar size={12} />
                        <span>Stats View</span>
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
                    {/* Stats Section */}
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
