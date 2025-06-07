import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaGlobe, 
  FaYoutube, 
  FaTwitch, 
  FaTwitter, 
  FaInstagram, 
  FaGithub, 
  FaExternalLinkAlt,
  FaDiscord
} from 'react-icons/fa';
import { PublicProfile } from '../../../types/profileTypes';

interface ProfileSocialLinksProps {
  profile: PublicProfile | null;
}

const ProfileSocialLinks: React.FC<ProfileSocialLinksProps> = ({ profile }) => {
  if (!profile) {
    return null;
  }
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'website':
        return <FaGlobe className="text-blue-500" />;
      case 'youtube':
        return <FaYoutube className="text-red-500" />;
      case 'twitch':
        return <FaTwitch className="text-purple-500" />;
      case 'twitter':
        return <FaTwitter className="text-blue-400" />;
      case 'instagram':
        return <FaInstagram className="text-pink-500" />;
      case 'github':
        return <FaGithub className="text-neutral-400" />;
      case 'discord':
        return <FaDiscord className="text-indigo-500" />;
      default:
        return <FaExternalLinkAlt className="text-neutral-400" />;
    }
  };

  const socialLinks = [];

  // Add website
  if (profile.website) {
    socialLinks.push({
      platform: 'website',
      url: profile.website,
      label: 'Website'
    });
  }

  // Add social media links
  if (profile.socialLinks) {
    Object.entries(profile.socialLinks).forEach(([platform, url]) => {
      if (url) {
        socialLinks.push({
          platform,
          url,
          label: platform.charAt(0).toUpperCase() + platform.slice(1)
        });
      }
    });
  }

  // Add Discord if connected
  if (profile.discordUsername) {
    socialLinks.push({
      platform: 'discord',
      url: '#',
      label: `Discord: ${profile.discordUsername}`
    });
  }

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
    >
      <div className="flex items-center gap-3 mb-6 border-b border-neutral-400 dark:border-neutral-700 pb-4">
        <div className="p-3 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-green-900/20 dark:to-green-800/40 rounded-lg shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 -mt-3 -mr-3 rounded-full bg-green-500/20 dark:bg-green-500/10"></div>
          <FaExternalLinkAlt className="text-green-600 dark:text-green-400" size={20} />
        </div>
        <h3 className="text-xl font-bold">Social Links</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {socialLinks.map((link, index) => (
          <motion.a
            key={link.platform}
            href={link.platform === 'discord' ? undefined : link.url}
            target={link.platform === 'discord' ? undefined : '_blank'}
            rel={link.platform === 'discord' ? undefined : 'noopener noreferrer'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-3 p-4 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700/50 dark:to-neutral-600/50 rounded-lg shadow-inner transition-all duration-200 ${
              link.platform === 'discord' ? 'cursor-default' : 'cursor-pointer hover:shadow-md'
            }`}
          >
            <div className="flex-shrink-0">
              <div className="p-2 bg-neutral-100 dark:bg-neutral-600 rounded-lg">
                {getSocialIcon(link.platform)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 block truncate">
                {link.label}
              </span>
            </div>
            {link.platform !== 'discord' && (
              <div className="flex-shrink-0">
                <FaExternalLinkAlt className="text-xs text-neutral-600 dark:text-neutral-400" />
              </div>
            )}
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
};

export default ProfileSocialLinks;
