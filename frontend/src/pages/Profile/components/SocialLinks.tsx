import React from 'react';
import { motion } from 'framer-motion';
import {
  FaGlobe,
  FaYoutube,
  FaTwitch,
  FaTwitter,
  FaInstagram,
  FaGithub
} from 'react-icons/fa';
import { SocialLinks as SocialLinksType } from '../../../types/profileTypes';

interface SocialLinksProps {
  socialLinks: SocialLinksType;
  website: string;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ socialLinks, website }) => {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <FaYoutube className="text-neutral-300" />;
      case 'twitch': return <FaTwitch className="text-neutral-300" />;
      case 'twitter': return <FaTwitter className="text-neutral-300" />;
      case 'instagram': return <FaInstagram className="text-neutral-300" />;
      case 'github': return <FaGithub className="text-neutral-300" />;
      default: return <FaGlobe className="text-neutral-300" />;
    }
  };

  const getSocialPrefix = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'https://youtube.com/@';
      case 'twitch': return 'https://twitch.tv/';
      case 'twitter': return 'https://twitter.com/';
      case 'instagram': return 'https://instagram.com/';
      case 'github': return 'https://github.com/';
      default: return '';
    }
  };

  const formatSocialUrl = (platform: string, url: string) => {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('www.')) {
      return `https://${url}`;
    }

    const prefix = getSocialPrefix(platform);
    return prefix ? `${prefix}${url}` : url;
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // Check if there are any social links or website to display
  const hasLinks = website || Object.values(socialLinks).some(link => link);

  if (!hasLinks) {
    return null;
  }
  return (
    <motion.div
      variants={fadeIn}
      className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/50 dark:border-neutral-700/50 p-6 hover:shadow-xl transition-all duration-300"
    >
      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-5 flex items-center group">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
          <FaGlobe className="text-white text-sm" />
        </div>
        Social Links
      </h2>

      <div className="grid grid-cols-1 gap-3">
        {website && (
          <motion.a
            href={formatSocialUrl('website', website)}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center gap-3 bg-neutral-50 dark:bg-neutral-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-4 py-3 rounded-xl transition-all duration-200 border border-neutral-200 dark:border-neutral-600 hover:border-blue-300 dark:hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <FaGlobe className="text-white text-sm" />
            </div>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
              Website
            </span>
          </motion.a>
        )}

        {Object.entries(socialLinks).map(([platform, url]) => {
          if (!url) return null;

          const formattedUrl = formatSocialUrl(platform, url);
          const getPlatformColor = (platform: string) => {
            switch (platform) {
              case 'youtube': return 'bg-red-600';
              case 'twitch': return 'bg-purple-600';
              case 'twitter': return 'bg-blue-500';
              case 'instagram': return 'bg-pink-600';
              case 'github': return 'bg-neutral-700';
              default: return 'bg-blue-600';
            }
          };

          const getPlatformHoverBg = (platform: string) => {
            switch (platform) {
              case 'youtube': return 'hover:bg-red-50 dark:hover:bg-red-900/30';
              case 'twitch': return 'hover:bg-purple-50 dark:hover:bg-purple-900/30';
              case 'twitter': return 'hover:bg-blue-50 dark:hover:bg-blue-900/30';
              case 'instagram': return 'hover:bg-pink-50 dark:hover:bg-pink-900/30';
              case 'github': return 'hover:bg-neutral-100 dark:hover:bg-neutral-600/50';
              default: return 'hover:bg-blue-50 dark:hover:bg-blue-900/30';
            }
          };

          const getPlatformHoverText = (platform: string) => {
            switch (platform) {
              case 'youtube': return 'group-hover:text-red-600 dark:group-hover:text-red-400';
              case 'twitch': return 'group-hover:text-purple-600 dark:group-hover:text-purple-400';
              case 'twitter': return 'group-hover:text-blue-600 dark:group-hover:text-blue-400';
              case 'instagram': return 'group-hover:text-pink-600 dark:group-hover:text-pink-400';
              case 'github': return 'group-hover:text-neutral-800 dark:group-hover:text-neutral-200';
              default: return 'group-hover:text-blue-600 dark:group-hover:text-blue-400';
            }
          };

          return (
            <motion.a
              key={platform}
              href={formattedUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`group flex items-center gap-3 bg-neutral-50 dark:bg-neutral-700 ${getPlatformHoverBg(platform)} px-4 py-3 rounded-xl transition-all duration-200 border border-neutral-200 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800`}
            >
              <div className={`w-8 h-8 ${getPlatformColor(platform)} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                {getSocialIcon(platform)}
              </div>
              <span className={`text-neutral-700 dark:text-neutral-300 font-medium ${getPlatformHoverText(platform)} transition-colors duration-200 capitalize`}>
                {platform}
              </span>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SocialLinks;
