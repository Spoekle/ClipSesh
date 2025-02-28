import React, { useState, useEffect, useRef } from 'react';
import apiUrl from '../../../config/config';
import { AiOutlineSend, AiOutlineDelete, AiOutlineClose } from 'react-icons/ai';
import { BiSmile } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'timeago.js';
import axios from 'axios';

const MessageComponent = ({ clipId, setPopout, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const messagesContainerRef = useRef(null);

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
          setLoading(false);
        }
      }
    };

    fetchMessages();

    const intervalId = setInterval(fetchMessages, 10000);
    
    return () => clearInterval(intervalId);
  }, [clipId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
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
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default to avoid new line
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiObj) => {
    setNewMessage((prev) => prev + emojiObj.emoji);
    setShowEmojiPicker(false);
  };

  const handleDeleteMessage = async (id) => {
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
              
              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`mb-6 w-full flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
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
              rows="2"
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
      `}</style>
    </motion.div>
  );
};

export default MessageComponent;
