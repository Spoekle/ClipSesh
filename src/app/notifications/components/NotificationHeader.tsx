'use client';

import React from 'react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { routeCrumbs } from '@/lib/breadcrumbs';
import { CheckCheck, Trash, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <Breadcrumbs items={[{ label: routeCrumbs.notifications.label }]} className="mb-2" />

        {/* Title row with signature CC Red Underline */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="relative pb-3 w-fit">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight uppercase">
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
              <Button className="rounded-full" onClick={onMarkAllAsRead} disabled={isMarkAllPending}>
                {isMarkAllPending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <CheckCheck data-icon="inline-start" className="size-3.5" />
                )}
                Mark All Read
              </Button>
            )}

            {readCount > 0 && (
              <Button variant="card" className="rounded-full" onClick={onClearRead} disabled={isClearPending}>
                {isClearPending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Trash data-icon="inline-start" className="size-3.5" />
                )}
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
