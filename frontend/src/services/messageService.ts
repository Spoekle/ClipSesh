import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.spoekle.com';

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Message {
  _id: string;
  userId: string;
  user: string;
  message: string;
  profilePicture?: string;
  timestamp: string;
}

export interface SendMessageData {
  clipId: string;
  userId: string;
  user: string;
  message: string;
  profilePicture?: string;
}

/**
 * Fetch messages for a clip
 */
export const getMessagesForClip = async (clipId: string): Promise<Message[]> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${backendUrl}/api/messages?clipId=${clipId}`, { headers });
    return response.data.reverse(); // Reverse to show newest first
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }
};

/**
 * Send a message for a clip
 */
export const sendMessage = async (messageData: SendMessageData): Promise<Message> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.post(`${backendUrl}/api/messages`, messageData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string, userId: string, roles: string | string[]): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    await axios.delete(`${backendUrl}/api/messages/${messageId}`, {
      headers,
      data: { userId, roles }
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message');
  }
};
