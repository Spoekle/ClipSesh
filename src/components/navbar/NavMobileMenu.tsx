'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Film, Archive, Shield } from 'lucide-react';
import NavLink from './NavLink';

interface NavMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  mobileMenuRef: React.RefObject<HTMLDivElement | null>;
  pathname: string;
  isAdmin: boolean;
}

export const NavMobileMenu: React.FC<NavMobileMenuProps> = ({
  isOpen,
  onClose,
  mobileMenuRef,
  pathname,
  isAdmin,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={mobileMenuRef}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="lg:hidden border-t border-border bg-background overflow-hidden"
        >
          <div className="px-4 py-3 space-y-1">
            <NavLink
              to="/"
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-card text-primary font-semibold border-l-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`
              }
            >
              <Home className="size-4" />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/clips"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-card text-primary font-semibold border-l-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`
              }
            >
              <Film className="size-4" />
              <span>Clips</span>
            </NavLink>

            <NavLink
              to="/archive"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive || pathname.startsWith('/archive')
                    ? 'bg-card text-primary font-semibold border-l-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`
              }
            >
              <Archive className="size-4" />
              <span>ClipVault</span>
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive || pathname.startsWith('/admin')
                      ? 'bg-card text-primary font-semibold border-l-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  }`
                }
              >
                <Shield className="size-4" />
                <span>Admin</span>
              </NavLink>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NavMobileMenu;
