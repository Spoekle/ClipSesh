import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from '@/lib/routerCompat';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBars,
  FaFlag,
  FaSnowflake,
  FaDiscord,
  FaYoutube,
  FaTwitter,
  FaGithub,
  FaChevronDown,
  FaTools,
} from 'react-icons/fa';
import { MdLogout, MdLogin, MdAdminPanelSettings, MdDashboard, MdClose, MdHome, MdMovie, MdSearch, MdArchive } from 'react-icons/md';
import { useNotification } from '../context/AlertContext';
import LoginModal from './LoginModal';
import { User } from '../types/adminTypes';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import NotificationBadge from './Notification/NotificationBadge';
import OfflineBanner from './common/OfflineBanner';
import { getUserAvatarUrl, handleAvatarError } from '@/utils/generateAvatar';

interface NavbarProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser }) => {
  const isOnline = useOnlineStatus();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Snow state (December / January)
  const [isSnowMonth] = useState(() => {
    const month = new Date().getMonth();
    return month === 11 || month === 0;
  });

  const [snow, setSnow] = useState(() => {
    const savedSnow = safeLocalStorage.getItem('snow');
    return savedSnow !== 'false';
  });

  const toggleSnow = () => {
    const newSnow = !snow;
    setSnow(newSnow);
    safeLocalStorage.setItem('snow', newSnow ? 'true' : 'false');
    window.dispatchEvent(new Event('storage'));
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const toggleLoginModal = (): void => {
    setIsLoginModalOpen(!isLoginModalOpen);
  };

  const handleLogout = (): void => {
    safeLocalStorage.removeItem('token');
    setUser(null);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
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
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.mobile-menu-toggle')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close all menus on route change
  useEffect(() => {
    setIsDropdownOpen(false);
    setIsToolsOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const hasEditor = user && (user.roles.includes('admin') || user.roles.includes('editor'));
  const hasAdmin = user && user.roles.includes('admin');
  const hasTools = hasEditor || hasAdmin;

  return (
    <>
      <OfflineBanner isVisible={!isOnline} />

      <header className="sticky top-0 z-40 w-full bg-[#0f0f0f]/95 backdrop-blur-md border-b border-[#262626] transition-colors">
        <div className="max-w-300 mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="flex items-center gap-3 group transition-opacity hover:opacity-95"
            >
              <img
                src="/CC_logo_250px.png"
                alt="Cube Community Logo"
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-[#f1f1f1] group-hover:text-cc-red transition-colors">
                  ClipSesh
                </span>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <span className="hidden sm:inline-block text-[10px] font-bold text-white bg-cc-red shadow-sm shadow-cc-red/30 rounded-md px-1.5 py-0.5 ml-1">
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
              to="/archive"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive || location.pathname.startsWith('/archive')
                    ? 'text-white font-semibold bg-[#222222]'
                    : 'text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a]'
                }`
              }
            >
              ClipVault
            </NavLink>

            {/* Management / Tools Dropdown (Only for Editor / Admin) */}
            {hasTools && (
              <div className="relative" ref={toolsRef}>
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
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
                          <span>Admin Dashboard</span>
                        </NavLink>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Right Section: Socials + Notification Bell + User Avatar / Sign In + Mobile Hamburger */}
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
                className="p-2 text-[#aaaaaa] hover:text-cc-red hover:bg-[#1a1a1a] rounded-full transition-colors"
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

            {/* Notification Bell Dropdown (Only next to profile) */}
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
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#1a1a1a] transition-all focus:outline-none cursor-pointer"
                >
                  <img
                    src={getUserAvatarUrl(user.username, user.profilePicture, 64)}
                    alt={user.username}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-[#262626]"
                    onError={(e) => handleAvatarError(e, user.username, 64)}
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
                            src={getUserAvatarUrl(user.username, user.profilePicture, 96)}
                            alt={user.username}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-cc-red/40"
                            onError={(e) => handleAvatarError(e, user.username, 96)}
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
                          to="/my-reports"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#f1f1f1] hover:bg-[#222222] transition-colors"
                        >
                          <FaFlag size={15} className="text-[#aaaaaa]" />
                          <span>My Reports</span>
                        </NavLink>
                      </div>

                      {/* Snow Effect (December / January) */}
                      {isSnowMonth && (
                        <div className="border-t border-[#262626] py-1">
                          <button
                            onClick={toggleSnow}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#f1f1f1] hover:bg-[#222222] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <FaSnowflake
                                size={17}
                                className={snow ? 'text-cc-red' : 'text-[#aaaaaa]'}
                              />
                              <span>Snow Effect</span>
                            </div>
                            <span className="text-xs text-[#aaaaaa] uppercase font-semibold">
                              {snow ? 'On' : 'Off'}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Sign Out */}
                      <div className="border-t border-[#262626] pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
                className="bg-cc-red hover:bg-cc-red-hover text-white font-semibold text-xs rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <MdLogin size={16} />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="mobile-menu-toggle lg:hidden p-2 rounded-xl hover:bg-[#1a1a1a] text-[#aaaaaa] hover:text-white transition-all focus:outline-none cursor-pointer"
            >
              {isMobileMenuOpen ? <MdClose size={22} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden border-t border-[#262626] bg-[#121212] overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                <NavLink
                  to="/"
                  end
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#181818] text-cc-red font-semibold border-l-2 border-cc-red'
                        : 'text-[#aaaaaa] hover:text-white hover:bg-[#181818]'
                    }`
                  }
                >
                  <MdHome size={18} />
                  <span>Home</span>
                </NavLink>

                <NavLink
                  to="/clips"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#181818] text-cc-red font-semibold border-l-2 border-cc-red'
                        : 'text-[#aaaaaa] hover:text-white hover:bg-[#181818]'
                    }`
                  }
                >
                  <MdMovie size={18} />
                  <span>Clips</span>
                </NavLink>

                <NavLink
                  to="/archive"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive || location.pathname.startsWith('/archive')
                        ? 'bg-[#181818] text-cc-red font-semibold border-l-2 border-cc-red'
                        : 'text-[#aaaaaa] hover:text-white hover:bg-[#181818]'
                    }`
                  }
                >
                  <MdArchive size={18} />
                  <span>ClipVault</span>
                </NavLink>

                {hasTools && (
                  <>
                    <div className="border-t border-[#262626] my-2 pt-2">
                      <span className="text-[10px] font-bold text-[#717171] uppercase tracking-wider px-3.5">
                        Tools
                      </span>
                    </div>

                    {hasEditor && (
                      <NavLink
                        to="/editor"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[#181818] text-cc-red font-semibold'
                              : 'text-[#aaaaaa] hover:text-white hover:bg-[#181818]'
                          }`
                        }
                      >
                        <MdDashboard size={17} />
                        <span>Editor Dashboard</span>
                      </NavLink>
                    )}

                    {hasAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[#181818] text-cc-red font-semibold'
                              : 'text-[#aaaaaa] hover:text-white hover:bg-[#181818]'
                          }`
                        }
                      >
                        <MdAdminPanelSettings size={17} />
                        <span>Admin Dashboard</span>
                      </NavLink>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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