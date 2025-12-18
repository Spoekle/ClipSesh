import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaDiscord, FaGithub, FaYoutube, FaHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { SnowOverlay } from 'react-snow-overlay';

function Footer() {
  const [isSnowMonth] = useState(() => {
    const month = new Date().getMonth();
    return month === 11 || month === 0;
  });

  const [snow, setSnow] = useState(() => {
    const savedSnow = localStorage.getItem('snow');
    return savedSnow !== 'false';
  });

  // Listen for storage changes (when navbar toggles snow)
  const handleStorageChange = useCallback(() => {
    const savedSnow = localStorage.getItem('snow');
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
    <footer className="bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 py-8 text-neutral-800 dark:text-white">
      {isSnowMonth && snow && <SnowOverlay />}

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and description */}
          <div className="flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center space-x-2 mb-3">
              <span className="text-xl font-bold">ClipSesh!</span>
            </Link>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center md:text-left mb-4">
              Discover, rate, and discuss the best Beat Saber clips from across the community.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Version {import.meta.env.VITE_APP_VERSION || 'unknown'}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold mb-3">Links</h3>
            <ul className="flex flex-col space-y-2 text-center md:text-left">
              <li>
                <Link to="/clips" className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition duration-200">
                  Browse Clips
                </Link>
              </li>
              <li>
                <Link to="/privacystatement" className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition duration-200">
                  Privacy Statement
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Spoekle/ClipSesh"
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition duration-200"
                >
                  Contribute on GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Social and theme toggles */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="text-lg font-semibold mb-3">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                href="https://discord.gg/dwe8mbC"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-600 dark:text-neutral-400 hover:text-[#5865F2] dark:hover:text-[#5865F2] transition-colors"
                aria-label="Discord"
              >
                <FaDiscord size={24} />
              </motion.a>
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                href="https://www.youtube.com/@CubeCommunity"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-600 dark:text-neutral-400 hover:text-[#FF0000] dark:hover:text-[#FF0000] transition-colors"
                aria-label="YouTube"
              >
                <FaYoutube size={24} />
              </motion.a>
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com/Spoekle/ClipSesh"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <FaGithub size={24} />
              </motion.a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-4 md:mb-0">
            © {new Date().getFullYear()} Spoekle. All rights reserved.
          </p>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center">
            Made with <FaHeart className="mx-1 text-red-500" /> for the Beat Saber community
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;