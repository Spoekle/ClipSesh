import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaUserCircle, FaRegChartBar } from 'react-icons/fa';
import { MdLogin, MdLogout, MdDashboard, MdNotifications } from "react-icons/md";
import { User } from '../../types/adminTypes';
import NotificationBadge from '../Notification/NotificationBadge';

interface DesktopNavbarProps {
  toggleLoginModal: () => void;
  user: User | null;
  isDropdownOpen: boolean;
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDropdown: () => void;
  handleLogout: () => void;
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;
  searchInput: string;
  handleSearch: (e: React.FormEvent) => void;
  recentSearches: string[];
  showRecentSearched: boolean;
  setShowRecentSearched: React.Dispatch<React.SetStateAction<boolean>>;
  removeRecentSearch: (search: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  isNotificationDropdownOpen: boolean;
  toggleNotificationDropdown: () => void;
}

function DesktopNavbar({
  toggleLoginModal,
  user,
  isDropdownOpen,
  setIsDropdownOpen,
  toggleDropdown,
  handleLogout,
  setSearchInput,
  searchInput,
  handleSearch,
  recentSearches,
  showRecentSearched,
  setShowRecentSearched,
  removeRecentSearch,
  dropdownRef,
  isNotificationDropdownOpen,
  toggleNotificationDropdown
}: DesktopNavbarProps) {
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Close recent searches dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowRecentSearched(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [setShowRecentSearched]);

  // Animation variants
  const navItemVariants = {
    hover: { 
      y: -2,
      transition: { type: "spring", stiffness: 300, damping: 10 }
    },
    tap: { scale: 0.95 }
  };
  
  const buttonVariants = {
    hover: { 
      scale: 1.05,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
  };
  
  const searchInputVariants = {
    focused: { 
      width: "14rem",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)",
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    blur: { 
      width: "10rem",
      boxShadow: "0 0 0 0px rgba(59, 130, 246, 0)",
      transition: { duration: 0.3 }
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }): string => 
    `relative text-md font-medium px-3 py-2 rounded-lg transition duration-300 
    ${isActive 
      ? 'text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30' 
      : 'text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400'
    }`;

  const navLinkEffect = ({ isActive }: { isActive: boolean }) => (
    isActive && (
      <motion.div
        layoutId="nav-active"
        className="absolute inset-0 rounded-lg bg-blue-100/50 dark:bg-blue-900/30 -z-10"
        initial={false}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      />
    )
  );

  return (
    <>
      <div className="flex items-center space-x-2">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex space-x-1 text-neutral-800 dark:text-white"
        >
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={navItemVariants}
          >
            <NavLink to="/clips" className={navLinkClass}>
              {(props) => (
                <>
                  {navLinkEffect(props)}
                  <span>Clips</span>
                </>
              )}
            </NavLink>
          </motion.div>
          
          {user && (user.roles.includes('admin') || user.roles.includes('editor')) && (
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={navItemVariants}
            >
              <NavLink to="/editor" className={navLinkClass}>
                {(props) => (
                  <>
                    {navLinkEffect(props)}
                    <span>Editor</span>
                  </>
                )}
              </NavLink>
            </motion.div>
          )}
          
          {user && user.roles.includes('admin') && (
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={navItemVariants}
            >
              <NavLink to="/admin" className={navLinkClass}>
                {(props) => (
                  <>
                    {navLinkEffect(props)}
                    <span>Admin</span>
                  </>
                )}
              </NavLink>
            </motion.div>
          )}
          
          {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={navItemVariants}
            >
              <NavLink to="/stats" className={navLinkClass}>
                {(props) => (
                  <>
                    {navLinkEffect(props)}
                    <span>Stats</span>
                  </>
                )}
              </NavLink>
            </motion.div>
          )}
        </motion.div>
        
        {/* Search bar with animations */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          ref={searchRef} 
          className="relative search-container"
        >
          <form onSubmit={handleSearch} className="flex">
            <div className="relative flex items-center">
              <motion.input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => {
                  setShowRecentSearched(true);
                  setSearchFocused(true);
                }}
                onBlur={() => setSearchFocused(false)}
                variants={searchInputVariants}
                animate={searchFocused ? "focused" : "blur"}
                className={`px-3 py-2 pl-9 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/80 border 
                  ${searchFocused ? 'border-blue-400' : 'border-transparent'} 
                  focus:outline-none transition-all duration-300 text-neutral-800 dark:text-white`}
              />
              <FaSearch className="absolute left-3 text-neutral-500 dark:text-neutral-400" />
            </div>
          </form>
          
          <AnimatePresence>
            {showRecentSearched && recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                className="absolute top-12 right-0 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-2 z-10"
              >
                <div className="flex items-center justify-between px-3 py-1 mb-1">
                  <h3 className="text-sm font-medium">Recent Searches</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowRecentSearched(false)}
                    className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    <FaTimes size={14} />
                  </motion.button>
                </div>
                <div className="max-h-60 overflow-auto">
                  {recentSearches.map((search) => (
                    <motion.div 
                      key={search} 
                      className="px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-between group"
                      whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        className="text-sm text-left flex-grow truncate"
                        onClick={() => {
                          setSearchInput(search);
                          handleSearch({ preventDefault: () => {}} as React.FormEvent);
                        }}
                      >
                        {search}
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        onClick={() => removeRecentSearch(search)}
                        className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTimes size={12} />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* User menu or login button with animations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center space-x-2">
                {/* NotificationBadge with external state management */}
                <NotificationBadge 
                  isOpen={isNotificationDropdownOpen}
                  onToggle={toggleNotificationDropdown}
                />
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <motion.img
                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                    alt={user.username}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
                    whileHover={{ rotate: 10 }}
                    transition={{ duration: 0.2 }}
                  />
                  <span className="hidden lg:block font-medium">{user.username}</span>
                </motion.button>
              </div>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 500 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50"
                  >
                    <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center space-x-3">
                        <motion.img
                          whileHover={{ rotate: 10, scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                          src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                          alt={user.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {user.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <NavLink
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          <FaUserCircle className="mr-3 text-neutral-500" />
                          <span>Profile</span>
                        </NavLink>
                      </motion.div>

                      <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <NavLink
                          to="/notifications"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          <MdNotifications className="mr-3 text-neutral-500" />
                          <span>All Notifications</span>
                        </NavLink>
                      </motion.div>
                      
                      {user.roles.includes('admin') && (
                        <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                          <NavLink
                            to="/admin"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            <MdDashboard className="mr-3 text-neutral-500" />
                            <span>Admin Dashboard</span>
                          </NavLink>
                        </motion.div>
                      )}
                      
                      {(user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                        <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                          <NavLink
                            to="/stats"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            <FaRegChartBar className="mr-3 text-neutral-500" />
                            <span>Statistics</span>
                          </NavLink>
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="border-t border-neutral-200 dark:border-neutral-700 py-1">
                      <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsDropdownOpen(false);
                          }}
                          className="flex w-full items-center px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 text-red-600 dark:text-red-400"
                        >
                          <MdLogout className="mr-3" />
                          <span>Sign out</span>
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={toggleLoginModal}
              className="flex items-center font-medium px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
            >
              <MdLogin className="mr-1.5" />
              <span>Sign In</span>
            </motion.button>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default DesktopNavbar;