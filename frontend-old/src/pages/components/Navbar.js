import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext'; // Updated import
import logo from '../../media/CC_Logo_250px.png';
import MobileNavbar from './navbar/MobileNav';
import DesktopNavbar from './navbar/DefaultNav';
import useWindowWidth from '../../hooks/useWindowWidth';
import apiUrl from '../../config/config';

function Navbar({ setUser, user }) {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  
  // Use the new notification system
  const { showSuccess } = useNotification();
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [showRecentSearched, setShowRecentSearched] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

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

  const toggleLoginModal = () => {
    setIsLoginModalOpen(!isLoginModalOpen);
  };

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${apiUrl}/api/users/me`, {
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim() !== '') {
      const trimmedInput = searchInput.trim();
      navigate(`/search?query=${encodeURIComponent(trimmedInput)}`);
      
      // Update recent searches
      const existingSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updatedSearches = [trimmedInput, ...existingSearches.filter((s) => s !== trimmedInput)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      
      setSearchInput('');
      setIsSearchDropdownOpen(false);
      setShowRecentSearched(false);
      setRecentSearches(updatedSearches);
    }
  };

  const removeRecentSearch = (search) => {
    const updatedSearches = recentSearches.filter((s) => s !== search);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    showSuccess('Logged out successfully');
    navigate('/');
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      setIsSearchDropdownOpen(false);
      setShowRecentSearched(false);
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleSearchDropdown = () => {
    if (!isSearchDropdownOpen) {
      setIsDropdownOpen(false);
      setShowRecentSearched(false);
    }
    setIsSearchDropdownOpen(!isSearchDropdownOpen);
  };

  const closeDropdown = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', closeDropdown);
    return () => {
      document.removeEventListener('mousedown', closeDropdown);
    };
  }, []);

  return (
    <motion.nav
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
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              src={logo} 
              alt="Logo" 
              className="h-10 mr-2" 
            />
            <span className="font-bold text-xl tracking-tight text-neutral-800 dark:text-white group-hover:bg-gradient-to-r group-hover:from-cc-red group-hover:from-30% group-hover:to-cc-blue group-hover:bg-clip-text group-hover:text-transparent">
              ClipSesh!
            </span>
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
              isLoginModalOpen={isLoginModalOpen}
              user={user}
              isDropdownOpen={isDropdownOpen}
              toggleDropdown={toggleDropdown}
              isSearchDropdownOpen={isSearchDropdownOpen}
              toggleSearchDropdown={toggleSearchDropdown}
              handleLogout={handleLogout}
              fetchUser={fetchUser}
              setSearchInput={setSearchInput}
              searchInput={searchInput}
              handleSearch={handleSearch}
              recentSearches={recentSearches}
              removeRecentSearch={removeRecentSearch}
            />
          ) : (
            <DesktopNavbar
              toggleLoginModal={toggleLoginModal}
              isLoginModalOpen={isLoginModalOpen}
              user={user}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              toggleDropdown={toggleDropdown}
              handleLogout={handleLogout}
              fetchUser={fetchUser}
              setSearchInput={setSearchInput}
              searchInput={searchInput}
              handleSearch={handleSearch}
              recentSearches={recentSearches}
              showRecentSearched={showRecentSearched}
              setShowRecentSearched={setShowRecentSearched}
              removeRecentSearch={removeRecentSearch}
              dropdownRef={dropdownRef}
            />
          )}
        </motion.div>
      </div>
    </motion.nav>
  );
}

export default Navbar;