'use client';

import React from 'react';
import Link from 'next/link';
import { FaCheckDouble, FaBroom } from 'react-icons/fa';
import { Button } from '@/components/Button';

interface NotificationHeaderProps {
  unreadCount: number;
  readCount: number;
  isMarkAllPending: boolean;
  isClearPending: boolean;
  onMarkAllAsRead: () => void;
  onClearRead: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  readCount,
  isMarkAllPending,
  isClearPending,
  onMarkAllAsRead,
  onClearRead,
}) => {
  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-muted-foreground/60 select-none">/</span>
          <span className="text-white font-medium">Notifications</span>
        </nav>

        {/* Title row with signature CC Red Underline */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="relative pb-3 w-fit">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight uppercase">
                NOTIFICATIONS
              </h1>
              <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-primary rounded-full" />
            </div>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              Stay updated on clip discussions, ratings, team chats, and mentions.
            </p>
          </div>

          {/* Top Toolbar Actions */}
          <div className="flex items-center gap-2.5 pb-1 flex-wrap">
            {unreadCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                pill
                onClick={onMarkAllAsRead}
                disabled={isMarkAllPending}
                isLoading={isMarkAllPending}
                leftIcon={<FaCheckDouble size={11} />}
              >
                Mark All Read
              </Button>
            )}

            {readCount > 0 && (
              <Button
                variant="card"
                size="sm"
                pill
                onClick={onClearRead}
                disabled={isClearPending}
                isLoading={isClearPending}
                leftIcon={<FaBroom size={11} />}
              >
                Clear Read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationHeader;
