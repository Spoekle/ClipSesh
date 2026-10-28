'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import { User } from '@/types/adminTypes';
import { getUserAvatarUrl, handleAvatarError } from '@/utils/generateAvatar';
import { getRoleBadgeClasses } from '../utils/roleBadgeHelper';
import { Button } from '@/components/ui/button';

interface UserCardProps {
  user: User;
  isSelected: boolean;
  onSelect: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, isSelected, onSelect }) => {
  const isDisabled = user.status === 'disabled';
  const isDiscordLinked = Boolean(
    (user.discordId && typeof user.discordId === 'string' && user.discordId.trim()) ||
    (user.discordUsername && typeof user.discordUsername === 'string' && user.discordUsername.trim())
  );
  const isCcLinked = Boolean(
    (user.ccId && typeof user.ccId === 'string' && user.ccId.trim()) ||
    (user.ccUsername && typeof user.ccUsername === 'string' && user.ccUsername.trim())
  );
  const avatarUrl = getUserAvatarUrl(user.username, user.profilePicture, 80);

  return (
    <motion.div
      layout="position"
      onClick={() => onSelect(user)}
      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-cc-card border-primary ring-1 ring-primary/40 shadow-xs'
          : 'bg-cc-ground hover:bg-cc-card border-border hover:border-border/80'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-cc-card">
              <img
                src={avatarUrl}
                alt={user.username}
                className="w-full h-full object-cover"
                onError={(e) => handleAvatarError(e, user.username, 80)}
              />
            </div>
            {/* Account Link Indicators */}
            <div className="absolute flex flex-col gap-5 -top-2 -left-2.5">
              {/* Discord Indicator */}
              <span
                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                  isDiscordLinked
                    ? 'bg-cc-ground border-[#5865F2]/50 text-[#5865F2]'
                    : 'bg-cc-ground border-border/80 text-muted-foreground/30'
                }`}
              >
                <FaDiscord className="text-[9.5px] shrink-0" />
              </span>

              {/* CC Indicator */}
              <span
                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                  isCcLinked
                    ? 'bg-cc-ground border-sky-500/50'
                    : 'bg-cc-ground border-border/80 '
                }`}
              >
                <img
                  src="/cc-icon.svg"
                  alt="CC"
                  className={`w-2.5 h-2.5 object-contain shrink-0 ${
                    isCcLinked ? '' : 'grayscale opacity-50'
                  }`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                {user.username}
              </h3>
              {isDisabled && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/15 text-primary border border-primary/30 uppercase tracking-wide shrink-0">
                  Disabled
                </span>
              )}
            </div>

            {/* Role Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {user.roles &&
                user.roles.map((role) => (
                  <span
                    key={role}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${getRoleBadgeClasses(
                      role,
                      true
                    )}`}
                  >
                    {role}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* Right: Edit Button */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="icon-xs"
            onClick={() => onSelect(user)}
            title="Edit User"
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;
