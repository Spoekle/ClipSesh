import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineSend, AiOutlineDelete, AiOutlineClose } from 'react-icons/ai';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'timeago.js';
import { useNotification } from '../../../../../context/AlertContext';
import { User } from '../../../../../types/adminTypes';
import { 
  getMessagesForClip, 
  sendMessage, 
  deleteMessage, 
  Message as MessageType, 
  SendMessageData 
} from '../../../../../services/messageService';

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
        } catch (error) {
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
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (highlightedMessage) {
      const messageElement = document.getElementById(`message-${highlightedMessage}`);
      if (messageElement) {
        setTimeout(() => {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          messageElement.classList.add('highlight-animation');
          setTimeout(() => {
            messageElement.classList.remove('highlight-animation');
          }, 2000);
        }, 500);
      }
    }
  }, [highlightedMessage, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to delete message:', error);
      showError('Failed to delete message. Please try again.');
    }
  };

  const hasPermission = user && (
    (Array.isArray(user.roles) && (user.roles.includes('admin') || user.roles.includes('clipteam'))) ||
    (typeof user.roles === 'string' && (user.roles === 'admin' || user.roles === 'clipteam'))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-18 right-0 md:right-4 md:bottom-0 w-full md:w-96 z-30 bg-[#181818] border border-[#2a2a2a] text-[#f1f1f1] rounded-t-2xl shadow-2xl overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3.5 border-b border-[#262626] bg-[#121212]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-bold text-white">Team Discussion</h3>
        </div>
        <button
          className="text-neutral-400 hover:text-white p-1 transition-colors"
          onClick={() => setPopout('')}
        >
          <AiOutlineClose size={18} />
        </button>
      </div>
      
      {/* Messages Scroll Area */}
      <div 
        ref={messagesContainerRef}
        className="messages custom-scrollbar bg-[#101010] p-3.5 overflow-y-auto h-96 w-full space-y-3 select-text"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2a2a2a] border-t-[#f23030]"></div>
          </div>
        ) : messages.length > 0 ? (
          <AnimatePresence>
            {messages.map((msg) => {
              const isOwnMessage = user && msg.userId === user._id;
              const isHighlighted = msg._id === highlightedMessage;
              const avatarUrl = msg.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user)}&background=202020&color=fff`;
              
              return (
                <motion.div
                  key={msg._id}
                  id={`message-${msg._id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`group flex items-start gap-2.5 hover:bg-white/[0.02] p-1.5 rounded-xl transition-colors ${
                    isHighlighted ? 'bg-white/[0.04] ring-1 ring-neutral-500' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#1e1e1e] border border-[#2e2e2e] mt-0.5">
                    <img
                      src={avatarUrl}
                      alt={msg.user}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-white truncate">{msg.user}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{format(new Date(msg.timestamp))}</span>
                      </div>
                      {(user?.roles?.includes('admin') || user?._id === msg.userId) && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-0.5 transition-opacity"
                          title="Delete message"
                        >
                          <AiOutlineDelete size={13} />
                        </button>
                      )}
                    </div>
                    <div className={`mt-1 text-xs leading-relaxed p-2.5 rounded-xl break-words ${
                      isOwnMessage 
                        ? 'bg-[#242424] border border-[#363636] text-white' 
                        : 'bg-[#1a1a1a] border border-[#262626] text-neutral-200'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs">
            <p>No messages yet</p>
            <p className="text-neutral-600 mt-1">Be the first to start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area without Emoji Picker */}
      {hasPermission ? (
        <div className="p-3 bg-[#141414] border-t border-[#262626]">
          <div className="flex items-end gap-2 bg-[#1b1b1b] border border-[#2c2c2c] focus-within:border-neutral-500 rounded-xl p-2 transition-colors">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent resize-none text-xs text-white placeholder-neutral-500 focus:outline-none max-h-24 py-1 px-1"
              placeholder="Type message... (Enter to send)"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()} 
              className={`p-2 rounded-lg transition-all shrink-0 ${
                newMessage.trim() 
                  ? 'bg-white text-black hover:bg-neutral-200 shadow-xs' 
                  : 'text-neutral-600 cursor-not-allowed'
              }`}
              title="Send"
            >
              <AiOutlineSend size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#141414] border-t border-[#262626] text-center">
          <p className="text-xs text-neutral-500">
            Only clip team members can send messages
          </p>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  );
};

export default MessagesPopup;
