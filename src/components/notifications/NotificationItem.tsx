'use client';

import React from 'react';
import { format } from 'timeago.js';
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaUsers,
  FaComments,
  FaStar,
  FaFlag,
  FaInfoCircle,
} from 'react-icons/fa';
import { UserNotification } from '@/types/notificationTypes';

interface NotificationItemProps {
  notification: UserNotification;
  onClick: (notification: UserNotification) => void;
  onMarkAsRead: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const getCategoryConfig = (type: string) => {
  switch (type) {
    case 'team_message':
      return {
        icon: <FaUsers size={12} />,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/15 border-indigo-500/30',
        label: 'Team Chat',
      };
    case 'comment_reply':
      return {
        icon: <FaComments size={12} />,
        color: 'text-primary',
        bg: 'bg-primary/15 border-primary/30',
        label: 'Reply',
      };
    case 'rating':
      return {
        icon: <FaStar size={12} />,
        color: 'text-amber-400',
        bg: 'bg-amber-500/15 border-amber-500/30',
        label: 'Rating',
      };
    case 'report':
    case 'report_update':
      return {
        icon: <FaFlag size={12} />,
        color: 'text-rose-400',
        bg: 'bg-rose-500/15 border-rose-500/30',
        label: 'Report',
      };
    case 'mention':
      return {
        icon: <FaBell size={12} />,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border-emerald-500/30',
        label: 'Mention',
      };
    case 'system':
    default:
      return {
        icon: <FaInfoCircle size={12} />,
        color: 'text-sky-400',
        bg: 'bg-sky-500/15 border-sky-500/30',
        label: 'System',
      };
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
}) => {
  const category = getCategoryConfig(notification.type);

  return (
    <div
      onClick={() => onClick(notification)}
      className={`group p-3 px-4 flex items-start gap-3 cursor-pointer transition-all duration-150 relative ${
        !notification.read
          ? 'bg-primary/[0.06] hover:bg-primary/[0.10]'
          : 'hover:bg-cc-ground'
      }`}
    >
      {!notification.read && (
        <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
      )}

      <div
        className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 border ${category.bg} ${category.color} mt-0.5`}
        title={category.label}
      >
        {category.icon}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-xs font-semibold text-cc-text truncate">
            {notification.senderUsername || 'Notification'}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
            {format(new Date(notification.createdAt))}
          </span>
        </div>

        <p
          className={`text-xs leading-snug line-clamp-2 ${
            !notification.read ? 'text-cc-text font-medium' : 'text-muted-foreground'
          }`}
        >
          {notification.message}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.read && (
          <button
            onClick={(e) => onMarkAsRead(notification._id, e)}
            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-white/5 rounded-[6px] transition-colors cursor-pointer"
            title="Mark as read"
          >
            <FaCheck size={10} />
          </button>
        )}
        <button
          onClick={(e) => onDelete(notification._id, e)}
          className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-white/5 rounded-[6px] transition-colors cursor-pointer"
          title="Delete"
        >
          <FaTrash size={10} />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
