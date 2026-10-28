'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, Flag, Snowflake, LogOut } from 'lucide-react';
import { User } from '@/types/adminTypes';
import { getUserAvatarUrl, handleAvatarError } from '@/utils/generateAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <div ref={dropdownRef}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          data-slot="dropdown-menu-trigger"
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-card transition-colors focus:outline-none cursor-pointer"
          aria-label="Open profile menu"
        >
          <img
            src={getUserAvatarUrl(user.username, user.profilePicture, 64)}
            alt={user.username}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
            onError={(e) => handleAvatarError(e, user.username, 64)}
          />
          <span className="hidden md:block font-medium text-sm text-foreground max-w-30 truncate">
            {user.username}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground hidden md:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-64 bg-card border border-border p-2 rounded-xl shadow-2xl text-foreground"
        >
          {/* User Header */}
          <div className="px-3 py-2 border-b border-border/80 mb-1">
            <div className="flex items-center gap-3">
              <img
                src={getUserAvatarUrl(user.username, user.profilePicture, 96)}
                alt={user.username}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/40"
                onError={(e) => handleAvatarError(e, user.username, 96)}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-foreground truncate">
                  {user.username}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <DropdownMenuItem
            className="cursor-pointer hover:bg-secondary rounded-lg"
            render={
              <Link
                href="/my-reports"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 w-full px-2 py-1.5 text-sm text-foreground"
              />
            }
          >
            <Flag className="size-4 text-muted-foreground" />
            <span>My Reports</span>
          </DropdownMenuItem>

          {/* Snow Effect (December / January) */}
          {isSnowMonth && (
            <>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={toggleSnow}
                className="flex items-center justify-between cursor-pointer hover:bg-secondary rounded-lg px-2 py-1.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Snowflake
                    className={`size-4 ${snow ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span>Snow Effect</span>
                </div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  {snow ? 'On' : 'Off'}
                </span>
              </DropdownMenuItem>
            </>
          )}

          {/* Sign Out */}
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem
            onClick={onLogout}
            className="flex items-center gap-2.5 text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg px-2 py-1.5 text-sm focus:text-destructive"
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NavUserDropdown;
