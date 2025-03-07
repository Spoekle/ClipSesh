import { useState, useEffect, useRef } from 'react';
import apiUrl from '../../../config/config';
import { AiOutlineSend, AiOutlineDelete, AiOutlineClose } from 'react-icons/ai';
import { BiSmile } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { format } from 'timeago.js';
import axios from 'axios';
import { useNotification } from '../../../context/NotificationContext';
import { User } from '../../../types/adminTypes';

interface Message {
  _id: string;
  userId: string;
  user: string;
  message: string;
  profilePicture?: string;
  timestamp: string;
}

interface MessageComponentProps {
  clipId: string;
  setPopout: (value: string) => void;
  user: User | null;
  highlightedMessageId?: string | null;
}

const MessageComponent: React.FC<MessageComponentProps> = ({ 
  clipId, 
  setPopout, 
  user, 
  highlightedMessageId = null 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [highlightedMessage, setHighlightedMessage] = useState<string | null>(highlightedMessageId);
  
  const { showError } = useNotification();

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setLoading(true);
          const response = await axios.get(
            `${apiUrl}/api/messages?clipId=${clipId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          setTimeout(() => {
            setMessages(response.data.reverse());
            setLoading(false);
          }, 300);
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
    // When highlighted message ID changes, scroll to that message
    if (highlightedMessage) {
      const messageElement = document.getElementById(`message-${highlightedMessage}`);
      if (messageElement) {
        setTimeout(() => {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a highlight animation class
          messageElement.classList.add('highlight-animation');
          // Remove it after animation completes
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
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${apiUrl}/api/messages`,
        {
          clipId,
          userId: user._id,
          user: user.username,
          message: newMessage,
          profilePicture: user.profilePicture,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setMessages((prevMessages) => [response.data, ...prevMessages]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message. Please try again.');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default to avoid new line
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleDeleteMessage = async (id: string) => {
    if (!user) return;
    
    const token = localStorage.getItem('token');
    try {
      await axios.delete(
        `${apiUrl}/api/messages/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { userId: user._id, roles: user.roles }
        }
      );

      setMessages((prevMessages) => 
        prevMessages.filter((msg) => msg._id !== id)
      );
    } catch (error) {
      console.error('Failed to delete message:', error);
      showError('Failed to delete message. Please try again.');
    }
  };

  // Check if user has permission to post messages
  const hasPermission = user && (
    (Array.isArray(user.roles) && (user.roles.includes('admin') || user.roles.includes('clipteam'))) ||
    (typeof user.roles === 'string' && (user.roles === 'admin' || user.roles === 'clipteam'))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-0 right-4 w-96 z-30 bg-neutral-900 text-white rounded-t-xl shadow-2xl"
    >
      <div className="flex justify-between items-center p-3 border-b border-neutral-700">
        <h3 className="text-xl font-bold">Team Chat</h3>
        <button
          className="text-neutral-400 hover:text-white transition-colors"
          onClick={() => setPopout('')}
        >
          <AiOutlineClose size={22} />
        </button>
      </div>
      
      <div 
        ref={messagesContainerRef}
        className="messages custom-scrollbar bg-neutral-800 p-4 overflow-y-auto h-96 w-full"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length > 0 ? (
          <AnimatePresence>
            {messages.map((msg) => {
              const isOwnMessage = user && msg.userId === user._id;
              const isHighlighted = msg._id === highlightedMessage;
              
              return (
                <motion.div
                  key={msg._id}
                  id={`message-${msg._id}`} // Add an ID for scrolling
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`mb-6 w-full flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                    isHighlighted ? 'highlight-message' : ''
                  }`}
                >
                  <div className={`max-w-[85%] flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0">
                      <img
                        src={msg.profilePicture || 'https://ui-avatars.com/api/?name=' + msg.user}
                        alt={msg.user}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </div>
                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-neutral-400">{msg.user}</span>
                        <span className="text-xs text-neutral-500">{format(new Date(msg.timestamp))}</span>
                      </div>
                      <div className={`relative p-3 rounded-2xl break-words ${
                        isOwnMessage 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-neutral-700 text-white rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                      </div>
                      {(user?.roles?.includes('admin') || user?._id === msg.userId) && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="text-neutral-500 hover:text-red-500 transition-colors mt-1"
                        >
                          <AiOutlineDelete size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <p className="text-center">No messages yet</p>
            <p className="text-center text-sm">Be the first to start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {hasPermission ? (
        <div className="p-3 bg-neutral-850 border-t border-neutral-700">
          <div className="relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 pr-20 bg-neutral-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              rows={2}
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-neutral-400 hover:text-yellow-400 transition-colors"
              >
                <BiSmile size={24} />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()} 
                className={`p-2 rounded-full ${
                  newMessage.trim() 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                } transition-colors`}
              >
                <AiOutlineSend size={20} />
              </button>
            </div>
            
            {showEmojiPicker && (
              <div className="absolute bottom-14 right-0">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Press Enter to send, Shift+Enter for a new line
          </p>
        </div>
      ) : (
        <div className="p-4 bg-neutral-850 border-t border-neutral-700 text-center">
          <p className="text-sm text-neutral-400">
            Only clip team members can send messages
          </p>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(107, 114, 128, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(107, 114, 128, 0.5) transparent;
        }
        
        .highlight-animation {
          animation: highlight 2s ease-out;
        }
        
        @keyframes highlight {
          0% { background-color: rgba(79, 70, 229, 0.4); }
          100% { background-color: transparent; }
        }
        
        .highlight-message {
          position: relative;
        }
        
        .highlight-message::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 0;
          height: 100%;
          width: 4px;
          background-color: #6366f1;
          border-radius: 2px;
        }
      `}</style>
    </motion.div>
  );
};

export default MessageComponent;
