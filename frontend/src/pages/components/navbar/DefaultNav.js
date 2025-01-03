import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { MdLogin, MdLogout } from "react-icons/md";
import LoginModal from '../LoginModal';

function DesktopNavbar({
    toggleLoginModal,
    isLoginModalOpen,
    user,
    isDropdownOpen,
    toggleDropdown,
    handleLogout,
    fetchUser,
    setSearchInput,
    searchInput,
    handleSearch,
    recentSearches,
    removeRecentSearch,
}) {
    const [showRecentSearched, setShowRecentSearched] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                !event.target.closest('.search-container') &&
                !event.target.closest('.recent-searches')
            ) {
                setShowRecentSearched(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <div className="flex items-center space-x-3">
                <div className="flex space-x-3">
                    <NavLink
                        to="/clips"
                        className={({ isActive }) =>
                            `text-md ${isActive ? 'underline bg-black/20 scale-110' : 'hover:bg-black/20 hover:scale-110'} rounded-md py-2 px-3 transition duration-200 text-left`
                        }
                    >
                        Clips
                    </NavLink>
                    {user && (user.roles.includes('admin') || user.roles.includes('editor')) && (
                        <NavLink
                            to="/editor"
                            className={({ isActive }) =>
                                `text-md font-semibold ${isActive ? 'underline bg-black/20 scale-110' : 'hover:bg-black/20 hover:scale-110'} rounded-md py-2 px-3 transition duration-200 text-left`
                            }
                        >
                            Editor Dash
                        </NavLink>
                    )}
                    {user && user.roles.includes('admin') && (
                        <>
                            <NavLink
                                to="/admin"
                                className={({ isActive }) =>
                                    `text-md font-semibold ${isActive ? 'underline bg-black/20 scale-110' : 'hover:bg-black/20 hover:scale-110'} rounded-md py-2 px-3 transition duration-200 text-left`
                                }
                            >
                                Admin Dash
                            </NavLink>
                        </>
                    )}
                </div>
                <div className="flex items-center space-x-3">
                    <form onSubmit={handleSearch} className="flex relative search-container">
                        <div className="relative flex">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchInput}
                                onFocus={() => setShowRecentSearched(true)}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="px-3 py-2 rounded-md bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                            />
                            <FaSearch
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition duration-200 hover:rotate-90 cursor-pointer"
                                onClick={handleSearch}
                            />
                        </div>
                        {showRecentSearched && (
                            <div className="absolute top-8 mt-2 w-full bg-white/60 dark:bg-neutral-900 rounded-md shadow-lg py-2 z-10 recent-searches">
                                <button
                                    type="button"
                                    onClick={() => setShowRecentSearched(false)}
                                    className="absolute top-1 right-1 p-2 text-sm hover:text-neutral-200"
                                >
                                    <FaTimes />
                                </button>
                                <h1 className="px-2 text-md font-semibold text-left">Recent Searches</h1>
                                <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
                                {recentSearches.length === 0 && (
                                    <p className="text-sm text-left px-3">No recent searches.</p>
                                )}
                                <div className="flex flex-col mt-1">
                                    {recentSearches
                                        .slice(0, 4)
                                        .map((search) => (
                                            <div key={search} className="flex items-center bg-black/10 hover:bg-black/20 justify-between px-2 py-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setSearchInput(search);
                                                        setShowRecentSearched(false);
                                                        setSearchInput(search);
                                                        setShowRecentSearched(false);
                                                        handleSearch({ target: { value: search }, preventDefault: () => { } });
                                                    }}
                                                    className="text-sm text-left flex-1"
                                                >
                                                    {search}
                                                </button>
                                                <FaTimes
                                                    onClick={() => removeRecentSearch(search)}
                                                    className="text-red-500 hover:text-red-600 cursor-pointer"
                                                />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </form>
                    {user ? (
                        <div className="relative" >
                            <button
                                onClick={toggleDropdown}
                                className="flex items-center py-1 px-1 bg-transparent hover:bg-black/60 rounded-full hover:scale-110 transition duration-200"
                            >
                                <img
                                    src={user.profilePicture}
                                    alt={user.username}
                                    className="h-12 w-12 rounded-full"
                                />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-md shadow-lg py-2">
                                    <div className="flex items-center justify-between">
                                        <NavLink
                                            to="/profile"
                                            className="flex px-4 py-2 text-sm text-neutral-900 dark:text-white hover:bg-black/20"
                                            onClick={toggleDropdown}
                                        >
                                            <img
                                                src={user.profilePicture}
                                                alt={user.username}
                                                className="h-8 w-8 rounded-full"
                                            />
                                            <div className="ml-4">
                                                <p className="font-semibold">{user.username}</p>
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.roles.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')}</p>
                                            </div>

                                        </NavLink>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center justify-end p-4 pl-6 text-sm text-neutral-900 dark:text-white hover:bg-black/20"
                                        >
                                            <MdLogout size={16} className='mr-2' />
                                        </button>
                                    </div>
                                    {(user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                                        <NavLink
                                            to="/stats"
                                            className="relative block px-4 py-2 text-sm text-neutral-900 dark:text-white hover:bg-black/20"
                                            onClick={toggleDropdown}
                                        >
                                            Stats
                                        </NavLink>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={toggleLoginModal}
                            className="flex items-center font-semibold py-2 px-3 bg-transparent hover:bg-black/20 rounded-md transition duration-200 text-left"
                        >
                            Login<MdLogin size={24} className='ml-1' />
                        </button>
                    )}
                </div>
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