'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaFlag, FaSnowflake } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
import { User } from '@/types/adminTypes';
import { getUserAvatarUrl, handleAvatarError } from '@/utils/generateAvatar';
import NavLink from './NavLink';

interface NavUserDropdownProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  isSnowMonth: boolean;
  snow: boolean;
  toggleSnow: () => void;
  onLogout: () => void;
}

export const NavUserDropdown: React.FC<NavUserDropdownProps> = ({
  user,
  isOpen,
  setIsOpen,
  dropdownRef,
  isSnowMonth,
  snow,
  toggleSnow,
  onLogout,
}) => {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Open profile menu"
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-cc-card transition-all focus:outline-none cursor-pointer"
      >
        <img
          src={getUserAvatarUrl(user.username, user.profilePicture, 64)}
          alt={user.username}
          className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
          onError={(e) => handleAvatarError(e, user.username, 64)}
        />
        <span className="hidden md:block font-medium text-sm text-cc-text max-w-30 truncate">
          {user.username}
        </span>
        <FaChevronDown size={10} className="text-muted-foreground hidden md:block" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-64 bg-cc-card rounded-xl shadow-2xl border border-border py-2 z-50 overflow-hidden"
          >
            {/* User Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <img
                  src={getUserAvatarUrl(user.username, user.profilePicture, 96)}
                  alt={user.username}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/40"
                  onError={(e) => handleAvatarError(e, user.username, 96)}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-white truncate">
                    {user.username}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="py-1">
              <NavLink
                to="/my-reports"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-cc-text hover:bg-cc-ground transition-colors"
              >
                <FaFlag size={15} className="text-muted-foreground" />
                <span>My Reports</span>
              </NavLink>
            </div>

            {/* Snow Effect (December / January) */}
            {isSnowMonth && (
              <div className="border-t border-border py-1">
                <button
                  onClick={toggleSnow}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-cc-text hover:bg-cc-ground transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FaSnowflake
                      size={17}
                      className={snow ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <span>Snow Effect</span>
                  </div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">
                    {snow ? 'On' : 'Off'}
                  </span>
                </button>
              </div>
            )}

            {/* Sign Out */}
            <div className="border-t border-border pt-1">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <MdLogout size={18} />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavUserDropdown;
