import React from 'react';
import { FaDiscord, FaYoutube, FaTwitter } from 'react-icons/fa';

export const NavSocialLinks: React.FC = () => {
  return (
    <div className="hidden sm:flex items-center gap-1 border-r border-border pr-3 mr-1">
      <a
        href="https://discord.gg/dwe8mbC"
        target="_blank"
        rel="noopener noreferrer"
        title="Discord"
        className="p-2 text-muted-foreground hover:text-[#5865F2] hover:bg-cc-card rounded-full transition-colors"
      >
        <FaDiscord size={18} />
      </a>
      <a
        href="https://youtube.com/CubeCommunity"
        target="_blank"
        rel="noopener noreferrer"
        title="YouTube"
        className="p-2 text-muted-foreground hover:text-primary hover:bg-cc-card rounded-full transition-colors"
      >
        <FaYoutube size={18} />
      </a>
      <a
        href="https://twitter.com/CubeCommunityVR"
        target="_blank"
        rel="noopener noreferrer"
        title="Twitter"
        className="p-2 text-muted-foreground hover:text-[#1DA1F2] hover:bg-cc-card rounded-full transition-colors"
      >
        <FaTwitter size={17} />
      </a>
    </div>
  );
};

export default NavSocialLinks;
