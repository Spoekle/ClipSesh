import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../../config/config';
import { AiOutlineSend, AiOutlineDelete } from 'react-icons/ai';
import axios from 'axios';

const MessageComponent = ({ clipId, setPopout }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(
            `${apiUrl}/api/messages?clipId=${clipId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await response.json();
          setMessages(data.reverse()); // Reverse the order to show newest first
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      }
    };

    fetchMessages();

    const intervalId = setInterval(fetchMessages, 10000);

    return () => clearInterval(intervalId);
  }, [clipId]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${apiUrl}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    };
    fetchUser();
  }, []);

  const handleSendMessage = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${apiUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clipId,
          userId: user._id,
          user: user.username,
          message: newMessage,
          profilePicture: user.profilePicture,
        }),
      });
      const newMsg = await response.json();
      setMessages((prevMessages) => [newMsg, ...prevMessages]); // Prepend new message
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleDeleteMessage = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${apiUrl}/api/messages/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id, roles: user.roles }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== id));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-0 right-4 w-64 z-30 bg-neutral-950 text-white p-4 drop-shadow-md rounded-t-xl justify-items-center">
      <button
        className="text-center font-bold text-2xl mb-2 bg-white/30 p-2 px-8 rounded-md w-full"
        onClick={() => setPopout('')}
      >
        Chat:
      </button>
      <div className="messages bg-gray-100/40 p-2 rounded-lg overflow-y-scroll h-80 w-full">
        {messages.map((msg) => {
          const date = new Date(msg.timestamp);
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          });
          const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const readableDate = `${formattedDate} at ${formattedTime}`;
          const isOwnMessage = user && msg.userId === user._id;

          return (
            <div
              key={msg._id}
              className={`mb-4 w-[90%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}
            >
              <div className="flex flex-col m-2">
                <div className="flex items-center m-2 rounded-xl w-full">
                  <div
                    className={`flex relative flex-col p-2 rounded-xl w-full drop-shadow-md ${isOwnMessage
                      ? 'bg-blue-500 rounded-br-none text-white'
                      : 'bg-white rounded-bl-none text-gray-800'
                      }`}
                  >
                    <img
                      src={msg.profilePicture}
                      alt={msg.user}
                      className={`absolute -bottom-4 h-8 w-8 rounded-full drop-shadow-md ${isOwnMessage ? '-right-4' : '-left-4'
                        }`}
                    ></img>
                    <p className="font-semibold text-sm">{msg.user}:</p>
                    <p className='text-xs'>{msg.message}</p>
                    <p
                      className={`flex text-gray-800 text-xs ${isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      {readableDate}
                    </p>
                  </div>
                  {user && (user.roles.includes('admin') || user._id === msg.userId) && (
                    <button
                      onClick={() => handleDeleteMessage(msg._id)}
                      className={`mx-1 text-red-500`}
                    >
                      <AiOutlineDelete size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {user && user.roles && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
        <div className="send-message text-neutral-900 mt-4 flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow p-2 rounded-l-lg border"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSendMessage}
            className="text-blue-500 bg-white p-2 rounded-r-lg flex items-center hover:text-blue-400 transition duration-200"
          >
            <AiOutlineSend size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageComponent;
