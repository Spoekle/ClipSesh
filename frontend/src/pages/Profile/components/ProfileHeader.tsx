import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaCalendarAlt, 
  FaDiscord,
  FaEdit,
  FaEyeSlash,
  FaCrown,
  FaShieldAlt,
  FaStar,
  FaVrCardboard
} from 'react-icons/fa';
import { PublicProfile } from '../../../types/profileTypes';

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, 
  isOwnProfile, 
  onEditClick 
}) => {
  const getRoleIcon = (roles: string[]) => {
    const role = roles[0];
    if (role === 'admin') return <FaCrown className="text-red-500" />;
    if (role === 'editor') return <FaShieldAlt className="text-green-500" />;
    if (role === 'clipteam') return <FaStar className="text-blue-500" />;
    if (role === 'uploader') return <FaUser className="text-yellow-500" />;
    return <FaUser className="text-neutral-500" />;
  };

  const getRoleColor = (roles: string[]) => {
    const role = roles[0];
    if (role === 'admin') return 'text-red-500';
    if (role === 'editor') return 'text-green-500';
    if (role === 'clipteam') return 'text-blue-500';
    if (role === 'uploader') return 'text-yellow-500';
    return 'text-neutral-500';
  };

  const getRoleName = (roles: string[]) => {
    const role = roles[0];
    if (role === 'admin') return 'Admin';
    if (role === 'editor') return 'Editor';
    if (role === 'clipteam') return 'Clip Team';
    if (role === 'uploader') return 'Uploader';
    if (role === 'user') return 'User';
    return 'Member';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  return (
    <motion.div
      variants={fadeIn}
      className="relative bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl border border-white/20 dark:border-neutral-700/30 rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20" />
      
      {/* Content */}
      <div className="relative px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
          {/* Profile Picture */}
          <div className="relative mb-6 lg:mb-0 flex justify-center lg:justify-start">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative"
            >
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-1 shadow-2xl">
                <div className="w-full h-full rounded-full border-4 border-white dark:border-neutral-800 overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                  <img
                    src={profile.profilePicture}
                    alt={`${profile.username}'s profile`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `${process.env.REACT_APP_API_URL || 'https://api.spoekle.com'}/profilePictures/profile_placeholder.png`;
                    }}
                  />
                </div>
              </div>
              
              {/* Status indicators */}
              {!profile.profile?.isPublic && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-2 shadow-lg border-2 border-white dark:border-neutral-800"
                >
                  <FaEyeSlash className="text-white text-sm" />
                </motion.div>
              )}
            </motion.div>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 text-center lg:text-left">
            {/* Name and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent mb-3"
                >
                  {profile.username}
                </motion.h1>
                
                {/* Roles */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap justify-center lg:justify-start items-center gap-3 mb-4"
                >
                  {profile.roles.map((role, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-600 border border-neutral-200 dark:border-neutral-600 shadow-sm"
                    >
                      {getRoleIcon([role])}
                      <span className={`text-sm font-semibold ${getRoleColor([role])}`}>
                        {getRoleName([role])}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              
              {/* Edit Button */}
              {isOwnProfile && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEditClick}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 self-center lg:self-start"
                >
                  <FaEdit />
                  Edit Profile
                </motion.button>
              )}
            </div>
            
            {/* Bio */}
            {profile.profile?.bio && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {profile.profile.bio}
                </p>
              </motion.div>
            )}
            
            {/* Stats Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {profile.discordId && profile.discordUsername && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-800/50">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaDiscord className="text-indigo-500 text-xl" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 text-center">Discord</p>
                  <p className="text-sm text-neutral-800 dark:text-white font-semibold text-center truncate">
                    {profile.discordUsername}
                  </p>
                </div>
              )}

              {profile.profile?.vrheadset && profile.profile.vrheadset !== 'Other' && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaVrCardboard className="text-purple-500 text-xl" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 text-center">VR Headset</p>
                  <p className="text-sm text-neutral-800 dark:text-white font-semibold text-center">
                    {profile.profile.vrheadset}
                  </p>
                </div>
              )}

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FaCalendarAlt className="text-emerald-500 text-xl" />
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 text-center">Joined</p>
                <p className="text-sm text-neutral-800 dark:text-white font-semibold text-center">
                  {formatDate(profile.joinDate)}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
