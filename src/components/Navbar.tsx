'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogIn } from 'lucide-react';
import { safeLocalStorage } from '@/utils/storage';
import { useNotification } from '../context/AlertContext';
import LoginModal from './LoginModal';
import { User } from '../types/adminTypes';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import NotificationBadge from './NotificationDropdown';
import OfflineBanner from './common/OfflineBanner';
import { useLogout } from '../hooks/useUser';
import NavLink from './navbar/NavLink';
import NavSocialLinks from './navbar/NavSocialLinks';
import NavUserDropdown from './navbar/NavUserDropdown';
import NavMobileMenu from './navbar/NavMobileMenu';
import { Button } from './common/Button';

interface NavbarProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser }) => {
  const isOnline = useOnlineStatus();
  const { showSuccess } = useNotification();
  const router = useRouter();
  const pathname = usePathname();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
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
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const toggleLoginModal = (): void => {
    setIsLoginModalOpen(!isLoginModalOpen);
  };

  const logout = useLogout();

  const handleLogout = (): void => {
    logout();
    setUser(null);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    showSuccess('Logged out successfully');
    router.push('/');
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
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
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isAdmin = Boolean(user && user.roles.includes('admin'));

  return (
    <>
      <OfflineBanner isVisible={!isOnline} />

      <header className="sticky top-0 z-40 w-full bg-cc-ground/95 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-300 mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="flex items-center gap-3 group transition-opacity hover:opacity-95"
            >
              <img
                src="/img/branding/logo.svg"
                alt="Cube Community Logo"
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-cc-text group-hover:text-primary transition-colors">
                  ClipSesh
                </span>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <span className="hidden sm:inline-block text-[10px] font-bold text-white bg-primary shadow-sm shadow-primary/30 rounded-md px-1.5 py-0.5 ml-1">
                  DEV
                </span>
              )}
            </NavLink>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white font-semibold bg-cc-card'
                    : 'text-muted-foreground hover:text-white hover:bg-cc-card'
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
                    ? 'text-white font-semibold bg-cc-card'
                    : 'text-muted-foreground hover:text-white hover:bg-cc-card'
                }`
              }
            >
              Clips
            </NavLink>

            <NavLink
              to="/archive"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive || pathname.startsWith('/archive')
                    ? 'text-white font-semibold bg-cc-card'
                    : 'text-muted-foreground hover:text-white hover:bg-cc-card'
                }`
              }
            >
              ClipVault
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive || pathname.startsWith('/admin')
                      ? 'text-white font-semibold bg-cc-card'
                      : 'text-muted-foreground hover:text-white hover:bg-cc-card'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          {/* Right Section: Socials + Notification Bell + User Avatar / Sign In + Mobile Hamburger */}
          <div className="flex items-center gap-3 sm:gap-4">
            <NavSocialLinks />

            {user && <NotificationBadge />}

            {user ? (
              <NavUserDropdown
                user={user}
                isOpen={isDropdownOpen}
                setIsOpen={setIsDropdownOpen}
                dropdownRef={dropdownRef}
                isSnowMonth={isSnowMonth}
                snow={snow}
                toggleSnow={toggleSnow}
                onLogout={handleLogout}
              />
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={toggleLoginModal}
                leftIcon={<LogIn className="size-4" />}
              >
                Sign In
              </Button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="mobile-menu-toggle lg:hidden p-2 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-all focus:outline-none cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <NavMobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          mobileMenuRef={mobileMenuRef}
          pathname={pathname}
          isAdmin={isAdmin}
        />
      </header>

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