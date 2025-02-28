import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaUserCircle, FaClipboard, FaRegChartBar, FaCog } from 'react-icons/fa';
import { MdLogin, MdLogout, MdDashboard } from "react-icons/md";
import LoginModal from '../LoginModal';

function DesktopNavbar({
  toggleLoginModal,
  isLoginModalOpen,
  user,
  isDropdownOpen,
  setIsDropdownOpen, // Added missing prop
  toggleDropdown,
  handleLogout,
  fetchUser,
  setSearchInput,
  searchInput,
  handleSearch,
  recentSearches,
  showRecentSearched,
  setShowRecentSearched,
  removeRecentSearch,
  dropdownRef
}) {
  const searchRef = useRef(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Close recent searches dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowRecentSearched(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [setShowRecentSearched]);

  const navLinkClass = ({ isActive }) => 
    `relative text-md font-medium px-3 py-2 rounded-lg transition duration-300 
    ${isActive 
      ? 'text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30' 
      : 'text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400'
    }`;

  const navLinkEffect = ({ isActive }) => (
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
        <div className="flex space-x-1 text-neutral-800 dark:text-white">
          <NavLink to="/clips" className={navLinkClass}>
            {navLinkEffect}
            <span>Clips</span>
          </NavLink>
          
          {user && (user.roles.includes('admin') || user.roles.includes('editor')) && (
            <NavLink to="/editor" className={navLinkClass}>
              {navLinkEffect}
              <span>Editor</span>
            </NavLink>
          )}
          
          {user && user.roles.includes('admin') && (
            <NavLink to="/admin" className={navLinkClass}>
              {navLinkEffect}
              <span>Admin</span>
            </NavLink>
          )}
          
          {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
            <NavLink to="/stats" className={navLinkClass}>
              {navLinkEffect}
              <span>Stats</span>
            </NavLink>
          )}
        </div>
        
        {/* Search bar */}
        <div ref={searchRef} className="relative search-container">
          <form onSubmit={handleSearch} className="flex">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setShowRecentSearched(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-40 focus:w-56 px-3 py-2 pl-9 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/80 border 
                  ${searchFocused ? 'border-blue-400' : 'border-transparent'} 
                  focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 text-neutral-800 dark:text-white`}
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
                transition={{ duration: 0.2 }}
                className="absolute top-12 right-0 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-2 z-10"
              >
                <div className="flex items-center justify-between px-3 py-1 mb-1">
                  <h3 className="text-sm font-medium">Recent Searches</h3>
                  <button
                    onClick={() => setShowRecentSearched(false)}
                    className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
                <div className="max-h-60 overflow-auto">
                  {recentSearches.map((search) => (
                    <div key={search} className="px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-between group">
                      <button
                        className="text-sm text-left flex-grow truncate"
                        onClick={() => {
                          setSearchInput(search);
                          handleSearch({ preventDefault: () => {}, target: { value: search } });
                        }}
                      >
                        {search}
                      </button>
                      <button
                        onClick={() => removeRecentSearch(search)}
                        className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* User menu or login button */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <img
                src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                alt={user.username}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
              />
              <span className="hidden lg:block font-medium">{user.username}</span>
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50"
                >
                  <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center space-x-3">
                      <img
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
                    <NavLink
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      <FaUserCircle className="mr-3 text-neutral-500" />
                      <span>Profile</span>
                    </NavLink>
                    
                    {user.roles.includes('admin') && (
                      <NavLink
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <MdDashboard className="mr-3 text-neutral-500" />
                        <span>Admin Dashboard</span>
                      </NavLink>
                    )}
                    
                    {(user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                      <NavLink
                        to="/stats"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <FaRegChartBar className="mr-3 text-neutral-500" />
                        <span>Statistics</span>
                      </NavLink>
                    )}
                  </div>
                  
                  <div className="border-t border-neutral-200 dark:border-neutral-700 py-1">
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={toggleLoginModal}
            className="flex items-center font-medium px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
          >
            <MdLogin className="mr-1.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
      
      {isLoginModalOpen && (
        <LoginModal
          isLoginModalOpen={isLoginModalOpen}
          setIsLoginModalOpen={toggleLoginModal}
          fetchUser={fetchUser}
        />
      )}
    </>
  );
}

export default DesktopNavbar;