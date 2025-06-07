import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { User } from '../../types/adminTypes';
import { PublicProfile, ProfileFormData } from '../../types/profileTypes';

// Components
import ProfileHeader from './components/ProfileHeader';
import ProfileStats from './components/ProfileStats';
import ProfileSocialLinks from './components/ProfileSocialLinks';
import ProfileActivityFeed from './components/ProfileActivityFeed';
import ProfileEditModal from './components/ProfileEditModal';

// Services
import { 
  updateUserProfile, 
  uploadProfilePicture, 
  getDiscordAuthUrl, 
  unlinkDiscordAccount as unlinkDiscordService 
} from '../../services/userService';
import { getPublicProfile, updateProfile, getMyProfile } from '../../services/profileService';
import ProfileDetails from './components/ProfileDetails';

interface ProfilePageProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, setUser }) => {
  const { userId } = useParams<{ userId: string }>();
  const { showSuccess, showError, showWarning } = useNotification();
  
  // Profile data state
  const [profileData, setProfileData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  
  // Account form states
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Profile form states
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
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
  
  // Avatar states
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Dialog states
  const [showUnlinkConfirmation, setShowUnlinkConfirmation] = useState<boolean>(false);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      
      // Determine if this is the user's own profile
      const targetUserId = userId || user._id;
      const ownProfile = !userId || userId === user._id;
      setIsOwnProfile(ownProfile);
      
      try {
        if (ownProfile) {
          // Fetch own profile with full data
          const profileResponse = await getMyProfile();
          
          setUsername(profileResponse.username);
          setEmail(profileResponse.email || '');
          
          setProfileFormData({
            bio: profileResponse.bio || '',
            website: profileResponse.website || '',
            socialLinks: {
              youtube: profileResponse.socialLinks?.youtube || '',
              twitch: profileResponse.socialLinks?.twitch || '',
              twitter: profileResponse.socialLinks?.twitter || '',
              instagram: profileResponse.socialLinks?.instagram || '',
              github: profileResponse.socialLinks?.github || ''
            },
            isPublic: profileResponse.isPublic || false
          });
          
          setProfileData(profileResponse);
        } else {
          // Fetch public profile
          const response = await getPublicProfile(targetUserId);
          setProfileData(response);
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        showError(error.message || 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, user, showError]);

  // Event handlers
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

  const handleProfilePictureUpload = async (): Promise<void> => {
    if (!profilePicture) {
      showWarning('Please select an image first');
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await uploadProfilePicture(profilePicture);

      if (response.success) {
        setUser({ ...user, profilePicture: response.profilePictureUrl });
        if (profileData) {
          setProfileData({
            ...profileData,
            profilePicture: response.profilePictureUrl
          });
        }
        showSuccess('Profile picture updated successfully');
        setProfilePicture(null);
        setPreviewUrl(null);
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      showError(error.message || 'Error uploading profile picture');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAccountUpdate = async (): Promise<void> => {
    if (!username.trim()) {
      showError('Username cannot be empty');
      return;
    }
    
    if (!email.trim()) {
      showError('Email cannot be empty');
      return;
    }
    
    const updateData: { username: string; email: string; password?: string } = { username, email };
    if (password) updateData.password = password;

    setUpdateLoading(true);
    try {
      const response = await updateUserProfile(user._id, updateData);

      if (response.message) {
        setUser({ ...user, username, email });
        if (profileData) {
          setProfileData({
            ...profileData,
            username
          });
        }
        showSuccess('Account updated successfully');
        setPassword('');
        setShowPassword(false);
      }
    } catch (error: any) {
      console.error('Error updating account:', error);
      showError(error.message || 'Error updating account');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleProfileUpdate = async (): Promise<void> => {
    setUpdateLoading(true);
    try {
      const response = await updateProfile(profileFormData);
      
      if (response) {
        setProfileData(response);
        showSuccess('Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError(error.message || 'Error updating profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDiscordAuth = (): void => {
    window.location.href = getDiscordAuthUrl(user._id);
  };

  const handleDiscordUnlink = async (): Promise<void> => {
    setShowUnlinkConfirmation(false);
    setUpdateLoading(true);
    try {
      const response = await unlinkDiscordService(user._id);

      if (response.message) {
        setUser({ ...user, discordId: undefined, discordUsername: undefined });
        if (profileData) {
          setProfileData({
            ...profileData,
            discordId: undefined,
            discordUsername: undefined
          });
        }
        showSuccess('Discord account unlinked successfully');
      }
    } catch (error: any) {
      console.error('Error unlinking Discord account:', error);
      showError(error.message || 'Error unlinking Discord account');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditModalOpen(!isEditModalOpen);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-neutral-400">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  // Profile not found state
  if (!profileData) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-neutral-400">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <Helmet>
        <title>{profileData.username}'s Profile - ClipSesh</title>
        <meta name="description" content={`${profileData.username}'s profile on ClipSesh`} />
      </Helmet>
      
      {/* Profile Header */}
      <ProfileHeader profile={profileData} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <ProfileDetails
              profile={profileData}
              isOwnProfile={isOwnProfile}
              onEditClick={handleEditToggle}
            />
            {/* Stats */}
            <ProfileStats profile={profileData} />

            {/* Social Links */}
            <ProfileSocialLinks profile={profileData} />

            {/* Activity Feed */}
            <ProfileActivityFeed profile={profileData} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Additional profile info can go here */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Profile Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Visibility:</span>
                  <span className="text-neutral-300">
                    {profileData.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                {profileData.lastActive && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Last Active:</span>
                    <span className="text-neutral-300">
                      {new Date(profileData.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-400">Clips Submitted:</span>
                  <span className="text-neutral-300">{profileData.stats.clipsSubmitted}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        profileFormData={profileFormData}
        setProfileFormData={setProfileFormData}
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        profilePicture={profilePicture}
        setProfilePicture={setProfilePicture}
        previewUrl={previewUrl}
        setPreviewUrl={setPreviewUrl}
        showUnlinkConfirmation={showUnlinkConfirmation}
        setShowUnlinkConfirmation={setShowUnlinkConfirmation}
        updateLoading={updateLoading}
        onAccountUpdate={handleAccountUpdate}
        onProfileUpdate={handleProfileUpdate}
        onProfilePictureUpload={handleProfilePictureUpload}
        onProfilePictureChange={handleProfilePictureChange}
        onDiscordAuth={handleDiscordAuth}
        onDiscordUnlink={handleDiscordUnlink}
      />
    </div>
  );
};

export default ProfilePage;
