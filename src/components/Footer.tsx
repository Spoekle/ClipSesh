import { safeLocalStorage } from '@/utils/storage';
import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/lib/routerCompat';
import { FaDiscord, FaGithub, FaYoutube } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { SnowOverlay } from 'react-snow-overlay';

function Footer() {
  const [isSnowMonth] = useState(() => {
    const month = new Date().getMonth();
    return month === 11 || month === 0;
  });

  const [snow, setSnow] = useState(() => {
    const savedSnow = safeLocalStorage.getItem('snow');
    return savedSnow !== 'false';
  });

  // Listen for storage changes (when navbar toggles snow)
  const handleStorageChange = useCallback(() => {
    const savedSnow = safeLocalStorage.getItem('snow');
    setSnow(savedSnow !== 'false');
  }, []);

  useEffect(() => {
    // Listen for storage events from other components
    window.addEventListener('storage', handleStorageChange);

    // Also set up an interval to check more frequently (for same-tab changes)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [handleStorageChange]);

  return (
    <footer className="bg-[#0f0f0f] border-t border-[#262626] py-12 text-[#f1f1f1] transition duration-200">
      {isSnowMonth && snow && <SnowOverlay />}

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Mission Column */}
          <div className="md:col-span-2 flex flex-col items-start">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <img
                src="/img/branding/logo.svg"
                alt="Cube Community Logo"
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-[#f1f1f1] group-hover:text-[#f23030] transition-colors">
                  ClipSesh
                </span>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <span className="hidden sm:inline-block text-[10px] font-bold text-white bg-[#f23030] shadow-sm shadow-[#f23030]/30 rounded-[6px] px-1.5 py-0.5 ml-1">
                  DEV
                </span>
              )}
            </Link>
            <p className="text-sm text-[#aaaaaa] leading-relaxed mb-5 max-w-sm">
              The official Beat Saber highlight repository for Cube Community. Discover, rate, and submit your clips for the seasonal compilations.
            </p>
            <span className="text-xs text-[#717171] font-semibold uppercase tracking-wider">V{process.env.NEXT_PUBLIC_APP_VERSION || '3.0.0'}</span>
          </div>

          {/* Column 1: WEBSITE */}
          <div className="flex flex-col">
            <div className="text-xs font-bold uppercase tracking-wider text-[#f1f1f1] mb-3.5">
              Website
            </div>
            <ul className="flex flex-col space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-[#aaaaaa] hover:text-[#f23030] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/clips" className="text-[#aaaaaa] hover:text-[#f23030] transition-colors">
                  Clips
                </Link>
              </li>
              <li>
                <Link to="/archive" className="text-[#aaaaaa] hover:text-[#f23030] transition-colors">
                  The ClipVault
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: ABOUT */}
          <div className="flex flex-col">
            <div className="text-xs font-bold uppercase tracking-wider text-[#f1f1f1] mb-3.5">
              About
            </div>
            <ul className="flex flex-col space-y-2.5 text-sm">
              <li>
                <Link to="/privacystatement" className="text-[#aaaaaa] hover:text-[#f23030] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Spoekle/ClipSesh"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#aaaaaa] hover:text-[#f23030] transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: SOCIALS */}
          <div className="flex flex-col">
            <div className="text-xs font-bold uppercase tracking-wider text-[#f1f1f1] mb-3.5">
              Socials
            </div>
            <ul className="flex flex-col space-y-2.5 text-sm">
              <li>
                <a
                  href="https://youtube.com/CubeCommunity"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#aaaaaa] hover:text-[#f23030] transition-colors"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/CubeCommunityVR"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#aaaaaa] hover:text-[#f23030] transition-colors"
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://twitch.tv/CubeCommunity"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#aaaaaa] hover:text-[#f23030] transition-colors"
                >
                  Twitch
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/dwe8mbC"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#aaaaaa] hover:text-[#f23030] transition-colors"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#262626] mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-[#717171]">
          <p className="text-center md:text-left mb-2 md:mb-0">
            © {new Date().getFullYear()} Spoekle. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;