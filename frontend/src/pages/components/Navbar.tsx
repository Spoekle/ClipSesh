import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import logo from '../../media/CC_Logo_250px.png';
import MobileNavbar from './navbar/MobileNav';
import DesktopNavbar from './navbar/DefaultNav';
import LoginModal from './LoginModal';
import useWindowWidth from '../../hooks/useWindowWidth';
import apiUrl from '../../config/config';
import { User } from '../../types/adminTypes';

interface NavbarProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser }) => {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  
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

  // Check scroll position to add background effect
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

  const fetchUser = async (): Promise<User | null> => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get<User>(`${apiUrl}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        return response.data;
      } catch (error) {
        localStorage.removeItem('token');
        console.error('Error fetching user:', error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    fetchUser();
    setRecentSearches(JSON.parse(localStorage.getItem('recentSearches') || '[]'));
  }, []);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (searchInput.trim() !== '') {
      const trimmedInput = searchInput.trim();
      navigate(`/search?query=${encodeURIComponent(trimmedInput)}`);
      
      // Update recent searches
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
      <motion.nav
        initial="initial"
        animate="animate"
        variants={navbarVariants}
        className={`p-2 z-50 sticky top-0 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-md' 
            : 'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm'
        } text-neutral-800 dark:text-white`}
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
                className="font-bold text-xl tracking-tight text-neutral-800 dark:text-white group-hover:bg-gradient-to-r group-hover:from-cc-red group-hover:from-30% group-hover:to-cc-blue group-hover:bg-clip-text group-hover:text-transparent"
              >
                ClipSesh!
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
              />
            )}
          </motion.div>
        </div>
      </motion.nav>
      
      {/* LoginModal rendered outside the navbar for proper page-level centering */}
      {isLoginModalOpen && (
        <LoginModal
          isLoginModalOpen={isLoginModalOpen}
          setIsLoginModalOpen={setIsLoginModalOpen}
          fetchUser={fetchUser}
        />
      )}
    </>
  );
}

export default Navbar;