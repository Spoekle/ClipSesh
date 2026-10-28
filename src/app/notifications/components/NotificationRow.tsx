'use client';

import React from 'react';
import { format } from 'timeago.js';
import {
  Check,
  Trash2,
  Users,
  MessageSquare,
  Star,
  Flag,
  Bell,
  Info,
} from 'lucide-react';
import { UserNotification } from '@/types/notificationTypes';
import { Badge } from '@/components/ui/badge';

interface NotificationRowProps {
  notification: UserNotification;
  onClick: (notification: UserNotification) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const getCategoryConfig = (type: string) => {
  switch (type) {
    case 'team_message':
      return {
        icon: <Users className="size-4" />,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/15 border-indigo-500/30',
        label: 'Team Chat',
      };
    case 'comment_reply':
      return {
        icon: <MessageSquare className="size-4" />,
        color: 'text-primary',
        bg: 'bg-primary/15 border-primary/30',
        label: 'Comment Reply',
      };
    case 'mention':
      return {
        icon: <Bell className="size-4" />,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border-emerald-500/30',
        label: 'Mention',
      };
    case 'rating':
      return {
        icon: <Star className="size-4" />,
        color: 'text-amber-400',
        bg: 'bg-amber-500/15 border-amber-500/30',
        label: 'Rating',
      };
    case 'report':
    case 'report_update':
      return {
        icon: <Flag className="size-4" />,
        color: 'text-rose-400',
        bg: 'bg-rose-500/15 border-rose-500/30',
        label: 'Report',
      };
    case 'system':
    default:
      return {
        icon: <Info className="size-4" />,
        color: 'text-sky-400',
        bg: 'bg-sky-500/15 border-sky-500/30',
        label: 'System',
      };
  }
};

export const NotificationRow: React.FC<NotificationRowProps> = ({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
}) => {
  const category = getCategoryConfig(notification.type);

  return (
    <div
      onClick={() => onClick(notification)}
      className={`group p-4 flex items-start gap-3.5 cursor-pointer transition-colors relative ${
        !notification.read
          ? 'bg-primary/[0.06] hover:bg-primary/[0.10]'
          : 'hover:bg-secondary/40'
      }`}
    >
      {!notification.read && (
        <span className="absolute left-2 top-6 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
      )}

      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${category.bg} ${category.color} mt-0.5`}
        title={category.label}
      >
        {category.icon}
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {notification.senderUsername || 'Notification'}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border-border text-muted-foreground"
            >
              {category.label}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 font-medium">
            {format(new Date(notification.createdAt))}
          </span>
        </div>

        <p
          className={`text-xs sm:text-sm leading-relaxed ${
            !notification.read ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}
        >
          {notification.message}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification._id);
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer"
            title="Mark as read"
          >
            <Check className="size-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
          className="p-2 text-muted-foreground hover:text-rose-400 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationRow;
