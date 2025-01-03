import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../media/CC_Logo_250px.png';
import MobileNavbar from './navbar/MobileNav';
import DesktopNavbar from './navbar/DefaultNav';
import useWindowWidth from '../../hooks/useWindowWidth';
import apiUrl from '../../config/config';

function Navbar({ setUser, user }) {
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 768;

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const [showRecentSearched, setShowRecentSearched] = useState(false);
    
    const [searchInput, setSearchInput] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

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
            } catch (error) {
                localStorage.removeItem('token');
                console.error('Error fetching user:', error);
            }
        }
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
            const existingSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
            const updatedSearches = [trimmedInput, ...existingSearches.filter((s) => s !== trimmedInput)];
            localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
            setSearchInput('');
            setIsSearchDropdownOpen(false);
            setRecentSearches(updatedSearches);
        }
    };

    const removeRecentSearch = (search) => {
        setRecentSearches(recentSearches.filter((s) => s !== search));
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches.filter((s) => s !== search)));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/clips';
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

    const toggleRecentSearched = () => {
        if (!showRecentSearched) {
            setIsDropdownOpen(false);
            setIsSearchDropdownOpen(false);
        }
        setShowRecentSearched(!showRecentSearched);
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
        <nav className="p-2 z-50 sticky text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200">
            <div className="container mx-auto flex items-center justify-between flex-wrap">
                <div className="flex items-center">
                    <NavLink to="/" className="flex items-center mr-6 bg-transparent hover:bg-gradient-to-r from-cc-red from-30% to-cc-blue hover:text-transparent hover:bg-clip-text hover:scale-110 transition-all duration-200">
                        <img src={logo} alt="Logo" className="h-10 mr-2" />
                        <span className="font-semibold text-xl tracking-tight">ClipSesh!</span>
                    </NavLink>
                </div>
                <div className="flex items-center">
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
                        />
                    ) : (
                        <DesktopNavbar
                            toggleLoginModal={toggleLoginModal}
                            isLoginModalOpen={isLoginModalOpen}
                            user={user}
                            isDropdownOpen={isDropdownOpen}
                            toggleDropdown={toggleDropdown}
                            handleLogout={handleLogout}
                            fetchUser={fetchUser}
                            setSearchInput={setSearchInput}
                            searchInput={searchInput}
                            handleSearch={handleSearch}
                            recentSearches={recentSearches}
                            showRecentSearched={setIsSearchDropdownOpen}
                            toggleRecentSearched={toggleRecentSearched}
                            removeRecentSearch={removeRecentSearch}
                        />
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;