'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AiOutlineDelete } from 'react-icons/ai';
import { format } from 'timeago.js';
import { User } from '@/types/adminTypes';
import { Message as MessageType } from '@/services/messageService';
import { getUserAvatarUrl, handleAvatarError } from '@/utils/generateAvatar';

interface TeamMessageItemProps {
  msg: MessageType;
  user: User | null;
  isHighlighted: boolean;
  onDelete: (id: string) => void;
}

export const TeamMessageItem: React.FC<TeamMessageItemProps> = ({
  msg,
  user,
  isHighlighted,
  onDelete,
}) => {
  const isOwnMessage = Boolean(user && msg.userId === user._id);
  const avatarUrl = getUserAvatarUrl(msg.user, msg.profilePicture, 64);
  const canDelete = Boolean(
    (Array.isArray(user?.roles) && user.roles.includes('admin')) ||
    (typeof user?.roles === 'string' && user.roles === 'admin') ||
    user?._id === msg.userId
  );

  return (
    <motion.div
      id={`message-${msg._id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`group flex items-start gap-2.5 hover:bg-secondary/20 p-1.5 rounded-xl transition-colors ${
        isHighlighted ? 'bg-secondary/40 ring-1 ring-border' : ''
      }`}
    >
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-secondary/30 border border-border mt-0.5">
        <img
          src={avatarUrl}
          alt={msg.user}
          onError={(e) => handleAvatarError(e, msg.user, 64)}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-bold text-foreground truncate">{msg.user}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {format(new Date(msg.timestamp))}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={() => onDelete(msg._id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-cc-red p-0.5 transition-opacity cursor-pointer"
              title="Delete message"
            >
              <AiOutlineDelete size={13} />
            </button>
          )}
        </div>
        <div
          className={`mt-1 text-xs leading-relaxed p-2.5 rounded-xl break-words ${
            isOwnMessage
              ? 'bg-secondary/60 border border-border text-foreground'
              : 'bg-cc-card border border-border text-foreground'
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.message}</p>
        </div>
      </div>
    </motion.div>
  );
};
