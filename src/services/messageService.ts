import { apiClient } from '@/lib/apiClient';

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
    const list = await apiClient.get<Message[]>(`/api/messages`, {
      params: { clipId },
    });
    const items = Array.isArray(list) ? list : [];
    return items.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
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
    return await apiClient.post<Message>(`/api/messages`, messageData);
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
    await apiClient.delete(`/api/messages/${messageId}`, {
      body: { userId, roles },
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message');
  }
};
