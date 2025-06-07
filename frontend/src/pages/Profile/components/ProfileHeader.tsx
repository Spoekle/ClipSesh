import React from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaCalendarAlt, FaShieldAlt, FaUserShield } from 'react-icons/fa';
import { PublicProfile } from '../../../types/profileTypes';

interface ProfileHeaderProps {
  profileData: PublicProfile;
  isOwnProfile: boolean;
  isEditing: boolean;
  onEditToggle: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileData,
  isOwnProfile,
  isEditing,
  onEditToggle
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaShieldAlt className="text-red-500 ml-2" />;
      case 'moderator':
        return <FaUserShield className="text-blue-500 ml-2" />;
      default:
        return null;
    }
  };



  const getBackgroundImage = () => {
    return profileData.profilePicture || '';
  };

  return (
    <div className="relative">
      {/* Hero Background with Profile Picture */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-96 w-full justify-center items-center drop-shadow-xl"
        style={{
          backgroundImage: profileData.profilePicture 
            ? `url(${getBackgroundImage()})` 
            : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ef4444 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
        }}
      >
        <div className="flex bg-gradient-to-b from-neutral-900/70 to-black/40 backdrop-blur-lg justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center relative z-10">
            {/* Profile Picture */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative flex-shrink-0 mb-6"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl bg-neutral-800 dark:bg-neutral-800">
                {profileData.profilePicture ? (
                  <img
                    src={profileData.profilePicture}
                    alt={`${profileData.username}'s profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl text-white">
                    {profileData.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Profile Info */}
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-5xl font-bold mb-4 text-white"
              >
                {profileData.username}
                {profileData.roles && profileData.roles.length > 0 && getRoleIcon(profileData.roles[0])}
              </motion.h1>
              
              {profileData.roles && profileData.roles.length > 0 && (
                <motion.span 
                  initial={{ opacity: 0, y: -20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium bg-black/30 dark:bg-black/30 backdrop-blur-sm text-white mb-4 ring-1 ring-white/20`}
                >
                  {profileData.roles[0].charAt(0).toUpperCase() + profileData.roles[0].slice(1)}
                </motion.span>
              )}

              {profileData?.bio && (
                <motion.p 
                  initial={{ opacity: 0, y: -20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-4"
                >
                  {profileData.bio}
                </motion.p>
              )}

              {/* Join Date */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center justify-center gap-2 text-white/80 mb-6"
              >
                <FaCalendarAlt />

              </motion.div>

              {/* Edit Button */}
              {isOwnProfile && (
                <motion.button
                  initial={{ opacity: 0, y: -20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEditToggle}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 mx-auto backdrop-blur-sm ${
                    isEditing
                      ? 'bg-red-600/80 hover:bg-red-700/80 text-white ring-1 ring-red-500/50'
                      : 'bg-blue-600/80 hover:bg-blue-700/80 text-white ring-1 ring-blue-500/50'
                  }`}
                >
                  <FaEdit />
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileHeader;
