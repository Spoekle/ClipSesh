'use client';

import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineSend, AiOutlineClose } from 'react-icons/ai';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/context/AlertContext';
import { User } from '@/types/adminTypes';
import { 
  getMessagesForClip, 
  sendMessage, 
  deleteMessage, 
  Message as MessageType, 
  SendMessageData 
} from '@/services/messageService';
import { TeamMessageItem } from './TeamMessageItem';

interface MessagesPopupProps {
  clipId: string;
  setPopout: (value: string) => void;
  user: User | null;
  highlightedMessageId?: string | null;
}

const MessagesPopup: React.FC<MessagesPopupProps> = ({ 
  clipId, 
  setPopout, 
  user, 
  highlightedMessageId = null 
}) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [highlightedMessage] = useState<string | null>(highlightedMessageId);
  
  const { showError } = useNotification();

  useEffect(() => {
    const fetchMessages = async () => {
      const token = safeLocalStorage.getItem('token');
      if (token) {
        try {
          setLoading(true);
          const messagesData = await getMessagesForClip(clipId);
          setMessages(messagesData);
          setLoading(false);
        } catch (error: unknown) {
          console.error('Failed to fetch messages:', error);
          showError('Failed to load team chat messages');
          setLoading(false);
        }
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 10000);
    return () => clearInterval(intervalId);
  }, [clipId, showError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (highlightedMessage) {
      const messageElement = document.getElementById(`message-${highlightedMessage}`);
      if (messageElement) {
        const timer1 = setTimeout(() => {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          messageElement.classList.add('highlight-animation');
          const timer2 = setTimeout(() => {
            messageElement.classList.remove('highlight-animation');
          }, 2000);
          return () => clearTimeout(timer2);
        }, 500);
        return () => clearTimeout(timer1);
      }
    }
  }, [highlightedMessage, messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      const messageData: SendMessageData = {
        clipId,
        userId: user._id,
        user: user.username,
        message: newMessage.trim(),
        profilePicture: user.profilePicture,
      };
      
      const newMessageData = await sendMessage(messageData);
      setMessages((prevMessages) => [newMessageData, ...prevMessages]);
      setNewMessage('');
    } catch (error: unknown) {
      console.error('Failed to send message:', error);
      showError('Failed to send message. Please try again.');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!user) return;
    
    try {
      await deleteMessage(id, user._id, user.roles);
      setMessages((prevMessages) => 
        prevMessages.filter((msg) => msg._id !== id)
      );
    } catch (error: unknown) {
      console.error('Failed to delete message:', error);
      showError('Failed to delete message. Please try again.');
    }
  };

  const hasPermission = Boolean(
    user && (
      (Array.isArray(user.roles) && (user.roles.includes('admin') || user.roles.includes('clipteam'))) ||
      (typeof user.roles === 'string' && (user.roles === 'admin' || user.roles === 'clipteam'))
    )
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-18 right-0 md:right-4 md:bottom-0 w-full md:w-96 z-30 bg-cc-card border border-border text-foreground rounded-t-2xl shadow-2xl overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3.5 border-b border-border bg-cc-ground">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">Clip Team Discussion</h3>
        </div>
        <button
          className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
          onClick={() => setPopout('')}
        >
          <AiOutlineClose size={18} />
        </button>
      </div>
      
      {/* Messages Scroll Area */}
      <div 
        ref={messagesContainerRef}
        className="messages bg-background p-3.5 overflow-y-auto h-96 w-full space-y-3 select-text"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary"></div>
          </div>
        ) : messages.length > 0 ? (
          <AnimatePresence>
            {messages.map((msg) => (
              <TeamMessageItem
                key={msg._id}
                msg={msg}
                user={user}
                isHighlighted={msg._id === highlightedMessage}
                onDelete={handleDeleteMessage}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
            <p>No messages yet</p>
            <p className="text-muted-foreground/60 mt-1">Be the first to start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {hasPermission ? (
        <div className="p-3 bg-cc-ground border-t border-border">
          <div className="flex items-end gap-2 bg-secondary/30 border border-border focus-within:border-primary/50 rounded-xl p-2 transition-colors">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent resize-none text-xs text-foreground placeholder:text-muted-foreground focus:outline-none max-h-24 py-1 px-1"
              placeholder="Type message... (Enter to send)"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()} 
              className={`p-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                newMessage.trim() 
                  ? 'bg-primary hover:bg-primary-hover text-white shadow-xs' 
                  : 'text-muted-foreground/40 cursor-not-allowed'
              }`}
              title="Send"
            >
              <AiOutlineSend size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-cc-ground border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Only clip team members can send messages
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MessagesPopup;
