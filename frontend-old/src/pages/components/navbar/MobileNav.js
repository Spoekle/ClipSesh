import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaSearch, FaBars, FaTimes, FaUserCircle, FaRegChartBar } from 'react-icons/fa';
import { MdLogin, MdLogout, MdDashboard, MdHome } from "react-icons/md";
import LoginModal from '../LoginModal';

function MobileNavbar({
  toggleLoginModal,
  isLoginModalOpen,
  user,
  handleLogout,
  fetchUser,
  setSearchInput,
  searchInput,
  handleSearch,
  recentSearches,
  removeRecentSearch
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (!menuOpen) setShowSearch(false);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    handleSearch(e);
    setShowSearch(false);
    setMenuOpen(false);
  };

  return (
    <div className="relative">
      {/* Top right icons */}
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleSearch}
          className="p-2 rounded-full bg-neutral-100/50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          aria-label="Search"
        >
          <FaSearch size={18} />
        </button>
        
        <button
          onClick={toggleMenu}
          className="p-2 rounded-full bg-neutral-100/50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile search dropdown */}
      {showSearch && (
        <div className="absolute top-12 right-0 bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-3 w-screen max-w-md z-30">
          <form onSubmit={handleSubmitSearch}>
            <div className="flex">
              <input
                type="text"
                className="flex-grow px-3 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search clips..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoFocus
              />
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-lg flex items-center"
              >
                <FaSearch />
              </button>
            </div>
          </form>

          {recentSearches.length > 0 && (
            <div className="mt-3 border-t border-neutral-200 dark:border-neutral-700 pt-2">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Recent Searches</h3>
                <button
                  onClick={() => {
                    localStorage.setItem('recentSearches', '[]');
                    removeRecentSearch('all');
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>
              
              <ul className="mt-1 max-h-64 overflow-y-auto">
                {recentSearches.map(search => (
                  <li key={search} className="py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 px-2 rounded-lg">
                    <button 
                      className="w-full text-left text-sm flex gap-2 items-center"
                      onClick={() => {
                        setSearchInput(search);
                        handleSearch({ preventDefault: () => {}, target: { search } });
                        setShowSearch(false);
                      }}
                    >
                      <FaSearch size={12} className="text-neutral-400" />
                      {search}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Full screen mobile menu - Fixed portal approach */}
      {menuOpen && (
        <div
          id="mobile-menu-portal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999999,
            overflowY: 'auto'
          }}
          className="fixed top-0 left-0 right-0 bottom-0 width-[100vw] height[100vh] z-20 bg-white dark:bg-neutral-900"
        >
          {/* Close button */}
          <div 
            style={{ 
              position: 'absolute',
              top: '1rem',
              right: '1rem'
            }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <FaTimes size={24} className="text-neutral-700 dark:text-white" />
            </button>
          </div>
          
          {/* Content container */}
          <div 
            style={{ 
              padding: '5rem 1.5rem 6rem',
              maxWidth: '48rem',
              margin: '0 auto'
            }}
          >
            {/* Navigation Links */}
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Navigation</h2>
            
            <nav className="mb-8">
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/"
                    className={({isActive}) => `flex items-center p-3 rounded-lg ${
                      isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <MdHome size={22} className="mr-3" />
                    <span className="font-medium">Home</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/clips"
                    className={({isActive}) => `flex items-center p-3 rounded-lg ${
                      isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <FaSearch size={22} className="mr-3" />
                    <span className="font-medium">Browse Clips</span>
                  </NavLink>
                </li>
                
                {/* Team Links */}
                {user && (user.roles?.includes('admin') || user.roles?.includes('editor')) && (
                  <li>
                    <NavLink
                      to="/editor"
                      className={({isActive}) => `flex items-center p-3 rounded-lg ${
                        isActive 
                          ? 'bg-blue-500 text-white' 
                          : 'text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <FaUserCircle size={22} className="mr-3" />
                      <span className="font-medium">Editor Dashboard</span>
                    </NavLink>
                  </li>
                )}
                
                {user && user.roles?.includes('admin') && (
                  <li>
                    <NavLink
                      to="/admin"
                      className={({isActive}) => `flex items-center p-3 rounded-lg ${
                        isActive 
                          ? 'bg-blue-500 text-white' 
                          : 'text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <MdDashboard size={22} className="mr-3" />
                      <span className="font-medium">Admin Dashboard</span>
                    </NavLink>
                  </li>
                )}
              </ul>
            </nav>
            
            {/* User Account */}
            {user ? (
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Account</h2>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                      alt={user.username} 
                      className="w-12 h-12 rounded-full object-cover" 
                    />
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white">{user.username}</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {user.roles?.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-1 mb-4">
                    <li>
                      <NavLink
                        to="/profile"
                        className={({isActive}) => `flex items-center p-2 rounded-lg ${
                          isActive 
                            ? 'bg-blue-500 text-white' 
                            : 'text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <FaUserCircle size={18} className="mr-3" />
                        <span>Profile</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/stats"
                        className={({isActive}) => `flex items-center p-2 rounded-lg ${
                          isActive 
                            ? 'bg-blue-500 text-white' 
                            : 'text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <FaRegChartBar size={18} className="mr-3" />
                        <span>Statistics</span>
                      </NavLink>
                    </li>
                  </ul>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <MdLogout size={20} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-6 mb-6 flex flex-col items-center">
                <h3 className="text-center text-lg font-medium text-neutral-900 dark:text-white mb-4">Sign in to your account</h3>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    toggleLoginModal();
                  }}
                  className="py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
                >
                  <MdLogin size={20} />
                  <span>Sign In</span>
                </button>
              </div>
            )}
            
            {/* Search box */}
            <div className="mt-8 mb-20">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Search</h2>
              <form onSubmit={handleSubmitSearch}>
                <div className="flex">
                  <input
                    type="text"
                    className="flex-grow px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-l-lg border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search clips..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-r-lg flex items-center"
                  >
                    <FaSearch size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <LoginModal
          isLoginModalOpen={isLoginModalOpen}
          setIsLoginModalOpen={toggleLoginModal}
          fetchUser={fetchUser}
        />
      )}
    </div>
  );
}

export default MobileNavbar;