// src/components/MobileNavbar.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { MdLogin, MdLogout } from 'react-icons/md';
import LoginModal from '../LoginModal';

function MobileNavbar({
    toggleLoginModal,
    isLoginModalOpen,
    user,
    isDropdownOpen,
    toggleDropdown,
    isSearchDropdownOpen,
    toggleSearchDropdown,
    handleLogout,
    fetchUser,
    setSearchInput,
    searchInput,
    handleSearch
}) {
    return (
        <>
            <div className="flex items-center space-x-3">
                <NavLink
                    to="/clips"
                    className={({ isActive }) =>
                        `text-md ${isActive ? 'underline bg-black/20 scale-110' : 'hover:bg-black/20 hover:scale-110'} rounded-md py-2 px-3 transition duration-200`
                    }
                >
                    Clips
                </NavLink>
                <div className="relative">
                    <button
                        onClick={toggleSearchDropdown}
                        className="flex items-center py-3 px-3 bg-transparent hover:bg-black/20 rounded-md hover:scale-110 transition duration-200"
                    >
                        <FaSearch />
                    </button>
                    {isSearchDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg">
                            <form onSubmit={handleSearch} className="flex">
                                <div className="relative flex">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchInput}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="px-3 py-2 rounded-md bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                    />
                                    <button
                                        onClick={handleSearch}
                                    >
                                        <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
                {user ? (
                    <div className="relative">
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
                                <NavLink
                                    to="/profile"
                                    className="flex px-4 py-2 text-sm items-center text-neutral-900 dark:text-white hover:bg-black/20"
                                    onClick={toggleDropdown}
                                >
                                    <img
                                        src={user.profilePicture}
                                        alt={user.username}
                                        className="h-10 w-10 rounded-full"
                                    />
                                    <div className="ml-4">
                                        <p className="font-semibold">{user.username}</p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.roles.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')}</p>
                                    </div>
                                </NavLink>
                                {user && (
                                    <>
                                        <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
                                        {(user.roles.includes('admin') || user.roles.includes('editor')) && (
                                            <NavLink
                                                to="/editor"
                                                className="block px-4 py-2 text-sm font-semibold text-neutral-900 dark:text-white hover:bg-black/20"
                                                onClick={toggleDropdown}
                                            >
                                                Editor Dash
                                            </NavLink>
                                        )}
                                        {user.roles.includes('admin') && (
                                            <NavLink
                                                to="/admin"
                                                className="block px-4 py-2 text-sm font-semibold text-neutral-900 dark:text-white hover:bg-black/20"
                                                onClick={toggleDropdown}
                                            >
                                                Admin Dash
                                            </NavLink>
                                        )}
                                        {(user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                                            <NavLink
                                                to="/stats"
                                                className="relative block px-4 py-2 text-sm text-neutral-900 dark:text-white hover:bg-black/20"
                                                onClick={toggleDropdown}
                                            >
                                                Stats
                                            </NavLink>
                                        )}
                                    </>
                                )}

                                <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center text-left px-4 py-2 text-sm text-neutral-900 dark:text-white hover:bg-black/20"
                                >
                                    Logout <MdLogout size={16} className='ml-2' />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={toggleLoginModal}
                        className="font-semibold py-2 px-3 bg-transparent hover:bg-black/20 rounded-md transition duration-200"
                    >
                        Login
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

export default MobileNavbar;