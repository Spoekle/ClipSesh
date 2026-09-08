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
      case 'youtube': return <FaYoutube className="text-white" />;
      case 'twitch': return <FaTwitch className="text-white" />;
      case 'twitter': return <FaTwitter className="text-white" />;
      case 'instagram': return <FaInstagram className="text-white" />;
      case 'github': return <FaGithub className="text-white" />;
      default: return <FaGlobe className="text-white" />;
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

  const hasLinks = website || Object.values(socialLinks).some(link => link);

  if (!hasLinks) {
    return null;
  }

  return (
    <div className="bg-[#181818] rounded-2xl border border-[#262626] p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] mb-4 flex items-center gap-2">
        <div className="w-7 h-7 bg-cc-red/15 text-cc-red rounded-xl flex items-center justify-center">
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
            className="group flex items-center gap-3 bg-[#141414] px-3.5 py-2.5 rounded-xl transition-all border border-[#262626] hover:border-[#383838] cursor-pointer"
          >
            <div className="w-7 h-7 bg-cc-red text-white rounded-lg flex items-center justify-center text-xs">
              <FaGlobe />
            </div>
            <span className="text-xs text-[#aaaaaa] font-medium group-hover:text-[#f1f1f1] transition-colors">
              Website
            </span>
          </motion.a>
        )}

        {Object.entries(socialLinks).map(([platform, url]) => {
          if (!url) return null;

          const formattedUrl = formatSocialUrl(platform, url);
          const getPlatformBg = (platform: string) => {
            switch (platform) {
              case 'youtube': return 'bg-[#FF0000]';
              case 'twitch': return 'bg-[#9146FF]';
              case 'twitter': return 'bg-[#1DA1F2]';
              case 'instagram': return 'bg-[#E1306C]';
              case 'github': return 'bg-[#333333]';
              default: return 'bg-cc-red';
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
              className="group flex items-center gap-3 bg-[#141414] px-3.5 py-2.5 rounded-xl transition-all border border-[#262626] hover:border-[#383838] cursor-pointer"
            >
              <div className={`w-7 h-7 ${getPlatformBg(platform)} text-white rounded-lg flex items-center justify-center text-xs`}>
                {getSocialIcon(platform)}
              </div>
              <span className="text-xs text-[#aaaaaa] font-medium group-hover:text-[#f1f1f1] transition-colors capitalize">
                {platform}
              </span>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
};

export default SocialLinks;
