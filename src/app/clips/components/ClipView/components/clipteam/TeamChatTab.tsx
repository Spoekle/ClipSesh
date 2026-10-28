'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { format } from 'timeago.js';
import { Message as MessageType } from '@/services/messageService';
import { User } from '@/types/adminTypes';
import { getUserAvatarUrl, handleAvatarError } from '@/utils/generateAvatar';

interface TeamChatTabProps {
  messages: MessageType[];
  chatLoading: boolean;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  handleSendMessage: () => Promise<void>;
  handleDeleteMessage: (id: string) => Promise<void>;
  user: User | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const TeamChatTab: React.FC<TeamChatTabProps> = ({
  messages,
  chatLoading,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleDeleteMessage,
  user,
  messagesEndRef,
}) => {
  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col h-[520px]"
    >
      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-background select-text custom-scrollbar">
        {chatLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin size-6 text-primary" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isOwnMessage = user && msg.userId === user._id;
            const avatarUrl = getUserAvatarUrl(msg.user, msg.profilePicture, 64);

            return (
              <div
                key={msg._id}
                id={`message-${msg._id}`}
                className="group flex items-start gap-2.5 hover:bg-muted/30 p-1.5 rounded-xl transition-colors"
              >
                {/* Author Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-card border border-border mt-0.5">
                  <img
                    src={avatarUrl}
                    alt={msg.user}
                    onError={(e) => handleAvatarError(e, msg.user, 64)}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-bold text-foreground truncate">{msg.user}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(msg.timestamp))}
                      </span>
                    </div>

                    {(user?.roles?.includes('admin') || user?._id === msg.userId) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-opacity cursor-pointer"
                        title="Delete message"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>

                  <div
                    className={`mt-1 text-xs sm:text-sm leading-relaxed p-2.5 rounded-xl break-words ${
                      isOwnMessage
                        ? 'bg-card border border-border text-foreground'
                        : 'bg-background border border-border/80 text-foreground/90'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
            <p>No messages yet in this clip.</p>
            <p className="opacity-70 mt-1">Start the team conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Fixed Bottom Bar */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-end gap-2 bg-background border border-border focus-within:border-border/80 rounded-xl p-2 transition-colors">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="w-full bg-transparent resize-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-24 py-1 px-1"
            placeholder="Message team... (Enter to send)"
            rows={1}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              newMessage.trim()
                ? 'bg-foreground text-background hover:bg-foreground/90 shadow-xs'
                : 'text-muted-foreground/40 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TeamChatTab;
