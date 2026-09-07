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
      className="bg-[#161d21] rounded-[10px] border border-[#263238] p-5"
    >
      <h2 className="text-sm font-bold uppercase tracking-wider text-[#b3b3b3] mb-4 flex items-center gap-2">
        <div className="w-7 h-7 bg-[#f23030]/10 text-[#f23030] rounded-[8px] flex items-center justify-center">
          <FaGlobe size={13} />
        </div>
        <span>Social Links</span>
      </h2>

      <div className="grid grid-cols-1 gap-2.5">
        {website && (
          <motion.a
            href={formatSocialUrl('website', website)}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            className="group flex items-center gap-3 bg-[#0e1315] px-3.5 py-2.5 rounded-[8px] transition-all duration-150 border border-[#263238] hover:border-[#f23030]/30"
          >
            <div className="w-7 h-7 bg-[#f23030] text-white rounded-[8px] flex items-center justify-center text-xs">
              <FaGlobe />
            </div>
            <span className="text-xs text-[#b3b3b3] font-medium group-hover:text-[#f23030] transition-colors">
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
              case 'twitter': return 'bg-sky-500';
              case 'instagram': return 'bg-pink-600';
              case 'github': return 'bg-neutral-800 dark:bg-neutral-700';
              default: return 'bg-[#f23030]';
            }
          };

          return (
            <motion.a
              key={platform}
              href={formattedUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.99 }}
              className="group flex items-center gap-3 bg-[#0e1315] px-3.5 py-2.5 rounded-[8px] transition-all duration-150 border border-[#263238] hover:border-[#f23030]/30"
            >
              <div className={`w-7 h-7 ${getPlatformColor(platform)} text-white rounded-[8px] flex items-center justify-center text-xs`}>
                {getSocialIcon(platform)}
              </div>
              <span className="text-xs text-[#b3b3b3] font-medium group-hover:text-[#f23030] transition-colors capitalize">
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
