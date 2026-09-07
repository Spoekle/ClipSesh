import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from '@/lib/routerCompat';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBars,
  FaUserCircle,
  FaFlag,
  FaSun,
  FaMoon,
  FaSnowflake,
  FaDiscord,
  FaYoutube,
  FaTwitter,
  FaGithub,
  FaBell,
  FaChevronDown,
  FaTools,
} from 'react-icons/fa';
import { MdLogout, MdLogin, MdAdminPanelSettings, MdDashboard } from 'react-icons/md';
import { useNotification } from '../context/AlertContext';
import logo from '../media/CC_Logo_250px.png';
import LoginModal from './LoginModal';
import { User } from '../types/adminTypes';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useUnreadCount } from '../hooks/useNotifications';
import NotificationBadge from './Notification/NotificationBadge';
import OfflineBanner from './common/OfflineBanner';

interface NavbarProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser, onToggleSidebar }) => {
  const isOnline = useOnlineStatus();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: unreadCount = 0 } = useUnreadCount();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = safeLocalStorage.getItem('theme');
    return savedTheme !== 'light';
  });

  // Snow state (December / January)
  const [isSnowMonth] = useState(() => {
    const month = new Date().getMonth();
    return month === 11 || month === 0;
  });

  const [snow, setSnow] = useState(() => {
    const savedSnow = safeLocalStorage.getItem('snow');
    return savedSnow !== 'false';
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      safeLocalStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      safeLocalStorage.setItem('theme', 'light');
    }
  };

  const toggleSnow = () => {
    const newSnow = !snow;
    setSnow(newSnow);
    safeLocalStorage.setItem('snow', newSnow ? 'true' : 'false');
    window.dispatchEvent(new Event('storage'));
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  const toggleLoginModal = (): void => {
    setIsLoginModalOpen(!isLoginModalOpen);
  };

  const handleLogout = (): void => {
    safeLocalStorage.removeItem('token');
    setUser(null);
    setIsDropdownOpen(false);
    showSuccess('Logged out successfully');
    navigate('/');
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsDropdownOpen(false);
    setIsToolsOpen(false);
  }, [location.pathname]);

  const hasEditor = user && (user.roles.includes('admin') || user.roles.includes('editor'));
  const hasAdmin = user && user.roles.includes('admin');
  const hasTools = hasEditor || hasAdmin || !!user;

  return (
    <>
      <OfflineBanner isVisible={!isOnline} />

      <header className="sticky top-0 z-40 w-full bg-[#0f0f0f]/95 backdrop-blur-md border-b border-[#262626] transition-colors">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="flex items-center gap-3 group transition-opacity hover:opacity-95"
            >
              <img
                src={(logo as any)?.src || logo}
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
            </NavLink>
          </div>

          {/* Desktop Navigation Links (YouTube style neutral pill chips) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white font-semibold bg-[#222222]'
                    : 'text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a]'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/clips"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white font-semibold bg-[#222222]'
                    : 'text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a]'
                }`
              }
            >
              Clips
            </NavLink>

            <NavLink
              to="/search"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white font-semibold bg-[#222222]'
                    : 'text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a]'
                }`
              }
            >
              Search
            </NavLink>

            {/* Notifications Link (if user logged in) */}
            {user && (
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white font-semibold bg-[#222222]'
                      : 'text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a]'
                  }`
                }
              >
                <FaBell size={13} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-[#f23030] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
            )}

            {/* Management / Tools Dropdown */}
            {hasTools && (
              <div className="relative" ref={toolsRef}>
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isToolsOpen
                      ? 'text-white font-semibold bg-[#222222]'
                      : 'text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  <FaTools size={12} />
                  <span>Tools</span>
                  <FaChevronDown size={10} className={`transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isToolsOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-48 bg-[#181818] rounded-xl shadow-2xl border border-[#262626] py-1.5 z-50 overflow-hidden"
                    >
                      {hasEditor && (
                        <NavLink
                          to="/editor"
                          onClick={() => setIsToolsOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#f1f1f1] hover:bg-[#222222] transition-colors"
                        >
                          <MdDashboard size={16} className="text-[#aaaaaa]" />
                          <span>Editor Dashboard</span>
                        </NavLink>
                      )}
                      {hasAdmin && (
                        <NavLink
                          to="/admin"
                          onClick={() => setIsToolsOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#f1f1f1] hover:bg-[#222222] transition-colors"
                        >
                          <MdAdminPanelSettings size={16} className="text-[#aaaaaa]" />
                          <span>Admin Portal</span>
                        </NavLink>
                      )}
                      {user && (
                        <NavLink
                          to="/my-reports"
                          onClick={() => setIsToolsOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#f1f1f1] hover:bg-[#222222] transition-colors"
                        >
                          <FaFlag size={14} className="text-[#aaaaaa]" />
                          <span>My Reports</span>
                        </NavLink>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Right Section: Socials + User Avatar / Sign In + Mobile Hamburger */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Social Links */}
            <div className="hidden sm:flex items-center gap-1 border-r border-[#262626] pr-3 mr-1">
              <a
                href="https://discord.gg/dwe8mbC"
                target="_blank"
                rel="noopener noreferrer"
                title="Discord"
                className="p-2 text-[#aaaaaa] hover:text-[#5865F2] hover:bg-[#1a1a1a] rounded-full transition-colors"
              >
                <FaDiscord size={18} />
              </a>
              <a
                href="https://youtube.com/CubeCommunity"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
                className="p-2 text-[#aaaaaa] hover:text-[#f23030] hover:bg-[#1a1a1a] rounded-full transition-colors"
              >
                <FaYoutube size={18} />
              </a>
              <a
                href="https://twitter.com/CubeCommunityVR"
                target="_blank"
                rel="noopener noreferrer"
                title="Twitter"
                className="p-2 text-[#aaaaaa] hover:text-[#1DA1F2] hover:bg-[#1a1a1a] rounded-full transition-colors"
              >
                <FaTwitter size={17} />
              </a>
              <a
                href="https://github.com/Spoekle/ClipSesh"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                className="p-2 text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a] rounded-full transition-colors"
              >
                <FaGithub size={17} />
              </a>
            </div>

            {/* Notification Bell Dropdown */}
            {user && (
              <NotificationBadge />
            )}

            {/* User Profile Dropdown or Sign In */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label="Open profile menu"
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#1a1a1a] transition-all focus:outline-none"
                >
                  <img
                    src={
                      user.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`
                    }
                    alt={user.username}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-[#262626]"
                  />
                  <span className="hidden md:block font-medium text-sm text-[#f1f1f1] max-w-30 truncate">
                    {user.username}
                  </span>
                  <FaChevronDown size={10} className="text-[#aaaaaa] hidden md:block" />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-64 bg-[#181818] rounded-xl shadow-2xl border border-[#262626] py-2 z-50 overflow-hidden"
                    >
                      {/* User Header */}
                      <div className="px-4 py-3 border-b border-[#262626]">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.profilePicture ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`
                            }
                            alt={user.username}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-[#f23030]/40"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm text-white truncate">
                              {user.username}
                            </div>
                            <div className="text-xs text-[#aaaaaa] truncate">
                              {user.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="py-1">
                        <NavLink
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#f1f1f1] hover:bg-[#222222] transition-colors"
                        >
                          <FaUserCircle size={17} className="text-[#aaaaaa]" />
                          <span>Your Profile</span>
                        </NavLink>

                        <NavLink
                          to="/my-reports"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#f1f1f1] hover:bg-[#222222] transition-colors"
                        >
                          <FaFlag size={17} className="text-[#aaaaaa]" />
                          <span>My Reports</span>
                        </NavLink>
                      </div>

                      {/* Appearance Options */}
                      <div className="border-t border-[#262626] py-1">
                        <button
                          onClick={toggleDarkMode}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#f1f1f1] hover:bg-[#222222] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isDarkMode ? (
                              <FaSun size={17} className="text-amber-400" />
                            ) : (
                              <FaMoon size={17} className="text-[#aaaaaa]" />
                            )}
                            <span>Appearance</span>
                          </div>
                          <span className="text-xs text-[#aaaaaa] capitalize">
                            {isDarkMode ? 'Dark' : 'Light'}
                          </span>
                        </button>

                        {isSnowMonth && (
                          <button
                            onClick={toggleSnow}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#f1f1f1] hover:bg-[#222222] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FaSnowflake
                                size={17}
                                className={snow ? 'text-[#f23030]' : 'text-[#aaaaaa]'}
                              />
                              <span>Snow Effect</span>
                            </div>
                            <span className="text-xs text-[#aaaaaa] uppercase font-semibold">
                              {snow ? 'On' : 'Off'}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-[#262626] pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <MdLogout size={18} />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={toggleLoginModal}
                className="bg-[#f23030] hover:bg-[#d92222] text-white font-medium text-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-sm transition-all active:scale-98"
              >
                <MdLogin size={17} />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-full hover:bg-[#1a1a1a] text-[#aaaaaa] hover:text-white transition-all focus:outline-none"
            >
              <FaBars size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* LoginModal */}
      {isLoginModalOpen && (
        <LoginModal
          isLoginModalOpen={isLoginModalOpen}
          setIsLoginModalOpen={setIsLoginModalOpen}
        />
      )}
    </>
  );
};

export default Navbar;