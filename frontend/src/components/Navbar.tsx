import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotification } from '../context/AlertContext';
import logo from '../media/CC_Logo_250px.png';
import MobileNavbar from './navbar/MobileNav';
import DesktopNavbar from './navbar/DefaultNav';
import LoginModal from './LoginModal';
import useWindowWidth from '../hooks/useWindowWidth';
import { User } from '../types/adminTypes';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import OfflineBanner from './common/OfflineBanner';

interface NavbarProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser }) => {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  const isOnline = useOnlineStatus();

  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [showRecentSearched, setShowRecentSearched] = useState<boolean>(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleLoginModal = (): void => {
    setIsLoginModalOpen(!isLoginModalOpen);
  };

  useEffect(() => {
    setRecentSearches(JSON.parse(localStorage.getItem('recentSearches') || '[]'));
  }, []);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (searchInput.trim() !== '') {
      const trimmedInput = searchInput.trim();
      navigate(`/search?query=${encodeURIComponent(trimmedInput)}`);

      const existingSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updatedSearches = [trimmedInput, ...existingSearches.filter((s: string) => s !== trimmedInput)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

      setSearchInput('');
      setIsSearchDropdownOpen(false);
      setShowRecentSearched(false);
      setRecentSearches(updatedSearches);
    }
  };

  const removeRecentSearch = (search: string): void => {
    if (search === 'all') {
      setRecentSearches([]);
      localStorage.setItem('recentSearches', JSON.stringify([]));
      return;
    }

    const updatedSearches = recentSearches.filter((s) => s !== search);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    setUser(null);
    showSuccess('Logged out successfully');
    navigate('/');
  };

  const toggleDropdown = (): void => {
    if (!isDropdownOpen) {
      setIsSearchDropdownOpen(false);
      setShowRecentSearched(false);
      setIsNotificationDropdownOpen(false);
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleNotificationDropdown = (): void => {
    if (!isNotificationDropdownOpen) {
      setIsDropdownOpen(false);
      setIsSearchDropdownOpen(false);
      setShowRecentSearched(false);
    }
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
  };

  const toggleSearchDropdown = (): void => {
    if (!isSearchDropdownOpen) {
      setIsDropdownOpen(false);
      setShowRecentSearched(false);
      setIsNotificationDropdownOpen(false);
    }
    setIsSearchDropdownOpen(!isSearchDropdownOpen);
  };

  const closeDropdown = (e: MouseEvent): void => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false);
      setIsNotificationDropdownOpen(false);
      setIsSearchDropdownOpen(false);
      setShowRecentSearched(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', closeDropdown);
    return () => {
      document.removeEventListener('mousedown', closeDropdown);
    };
  }, []);

  // Navbar animation variants
  const navbarVariants = {
    initial: {
      y: -20,
      opacity: 0
    },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const logoVariants = {
    initial: { opacity: 0, rotate: -10 },
    animate: {
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 15
      }
    },
    hover: {
      rotate: 10,
      transition: {
        duration: 0.3,
        yoyo: Infinity,
        repeatDelay: 0.5
      }
    }
  };

  return (
    <>
      <OfflineBanner isVisible={!isOnline} />
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center overflow-visible">
        <motion.nav
          initial="initial"
          animate="animate"
          variants={navbarVariants}
          style={{
            width: isScrolled ? '100%' : '96%',
            maxWidth: isScrolled ? '100%' : '1600px',
            borderRadius: isScrolled ? '0px' : '24px',
            marginTop: isScrolled ? '0px' : '20px',
            transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          className={`p-3 transition-all duration-300 ${isScrolled
            ? 'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl shadow-lg border-b border-neutral-200 dark:border-neutral-800'
            : 'bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-md'
            } text-neutral-800 dark:text-white overflow-visible`}
        >
          <div className="container mx-auto flex items-center justify-between flex-wrap">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center"
            >
              <NavLink
                to="/"
                className="flex items-center mr-6 bg-transparent hover:text-transparent transition-all duration-300 group"
              >
                <motion.img
                  variants={logoVariants}
                  whileHover="hover"
                  transition={{ duration: 0.5 }}
                  src={logo}
                  alt="Logo"
                  className="h-10 mr-2"
                />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="items-center font-bold text-xl tracking-tight text-neutral-800 dark:text-white hover:text-cc-red transition-colors duration-100"
                >
                  ClipSesh!
                  {process.env.NODE_ENV === 'development' && (
                    <span className="ml-2 text-sm text-white bg-cc-red rounded-lg px-2 py-1">
                      DEV
                    </span>
                  )}
                </motion.span>
              </NavLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center"
            >
              {isMobile ? (
                <MobileNavbar
                  toggleLoginModal={toggleLoginModal}
                  user={user}
                  isDropdownOpen={isDropdownOpen}
                  toggleDropdown={toggleDropdown}
                  isSearchDropdownOpen={isSearchDropdownOpen}
                  toggleSearchDropdown={toggleSearchDropdown}
                  handleLogout={handleLogout}
                  setSearchInput={setSearchInput}
                  searchInput={searchInput}
                  handleSearch={handleSearch}
                  recentSearches={recentSearches}
                  removeRecentSearch={removeRecentSearch}
                  isNotificationDropdownOpen={isNotificationDropdownOpen}
                  toggleNotificationDropdown={toggleNotificationDropdown}
                  navigate={navigate}
                />
              ) : (
                <DesktopNavbar
                  toggleLoginModal={toggleLoginModal}
                  user={user}
                  isDropdownOpen={isDropdownOpen}
                  setIsDropdownOpen={setIsDropdownOpen}
                  toggleDropdown={toggleDropdown}
                  handleLogout={handleLogout}
                  setSearchInput={setSearchInput}
                  searchInput={searchInput}
                  handleSearch={handleSearch}
                  recentSearches={recentSearches}
                  showRecentSearched={showRecentSearched}
                  setShowRecentSearched={setShowRecentSearched}
                  removeRecentSearch={removeRecentSearch}
                  dropdownRef={dropdownRef}
                  isNotificationDropdownOpen={isNotificationDropdownOpen}
                  toggleNotificationDropdown={toggleNotificationDropdown}
                  navigate={navigate}
                />
              )}
            </motion.div>
          </div>
        </motion.nav>
      </div>

      {/* LoginModal rendered outside the navbar for proper page-level centering */}
      {isLoginModalOpen && (
        <LoginModal
          isLoginModalOpen={isLoginModalOpen}
          setIsLoginModalOpen={setIsLoginModalOpen}
        />
      )}
    </>
  );
}

export default Navbar;