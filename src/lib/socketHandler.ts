import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAuthToken, DecodedUser } from './auth';
import { createTeamMessage, deleteTeamMessage } from '@/db/queries';

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);

    // Handle authentication
    socket.on('authenticate', (token: string) => {
      try {
        if (!token) {
          socket.emit('auth_error', { message: 'No token provided' });
          return;
        }

        const user = verifyAuthToken(token);
        if (user) {
          socket.data.user = user;
          socket.join('authenticated');
          socket.join(`user:${user.id}`);

          if (user.roles?.some((r: string) => ['admin', 'clipteam'].includes(r))) {
            socket.join('clipteam');
          }

          console.log(`[Socket.IO] Client authenticated: ${user.username} (${socket.id})`);
          socket.emit('authenticated', {
            user: {
              id: user.id,
              username: user.username,
              roles: user.roles,
            },
          });
        } else {
          console.warn('[Socket.IO] Authentication failed: invalid token for socket', socket.id);
          socket.emit('auth_error', { message: 'Invalid or expired token' });
        }
      } catch (err) {
        console.error('[Socket.IO] Error during authentication:', err);
        socket.emit('auth_error', { message: 'Authentication error' });
      }
    });

    // Handle joining a clip room
    const handleJoinClip = (clipId: string) => {
      if (!clipId || typeof clipId !== 'string') return;
      socket.join(`clip:${clipId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined clip:${clipId}`);
    };

    socket.on('join_clip', handleJoinClip);
    socket.on('join:clip', handleJoinClip);

    // Handle leaving a clip room
    const handleLeaveClip = (clipId: string) => {
      if (!clipId || typeof clipId !== 'string') return;
      socket.leave(`clip:${clipId}`);
      console.log(`[Socket.IO] Socket ${socket.id} left clip:${clipId}`);
    };

    socket.on('leave_clip', handleLeaveClip);
    socket.on('leave:clip', handleLeaveClip);

    // Handle sending a message via WebSocket
    socket.on(
      'send_message',
      async (
        data: {
          clipId: string;
          message: string;
          profilePicture?: string;
          token?: string;
        },
        callback?: (res: { success?: boolean; data?: any; error?: string }) => void
      ) => {
        try {
          // If socket not yet authenticated, try with token in data if provided
          let authUser: DecodedUser | null = socket.data.user || null;
          if (!authUser && data.token) {
            authUser = verifyAuthToken(data.token);
            if (authUser) {
              socket.data.user = authUser;
              socket.join('authenticated');
            }
          }

          if (!authUser) {
            callback?.({ error: 'Unauthorized: You must be logged in to send messages' });
            return;
          }

          const hasPermission = authUser.roles?.some((role: string) =>
            ['admin', 'clipteam', 'editor', 'uploader'].includes(role)
          );

          if (!hasPermission) {
            callback?.({ error: 'Forbidden: Insufficient permissions to post in team chat' });
            return;
          }

          const { clipId, message, profilePicture } = data;
          if (!clipId || !message?.trim()) {
            callback?.({ error: 'Clip ID and message content are required' });
            return;
          }

          const messageObj = await createTeamMessage({
            clipId: String(clipId),
            message,
            profilePicture: profilePicture || '',
            author: authUser,
          });

          // Broadcast to everyone in the clip room
          io.to(`clip:${clipId}`).emit('message:new', messageObj);
          io.to(`clip:${clipId}`).emit(`message:new:${clipId}`, messageObj);

          callback?.({ success: true, data: messageObj });
        } catch (error: any) {
          console.error('[Socket.IO] Error handling send_message:', error);
          callback?.({ error: error.message || 'Failed to send message' });
        }
      }
    );

    // Handle deleting a message via WebSocket
    socket.on(
      'delete_message',
      async (
        data: { messageId: string; clipId?: string; token?: string },
        callback?: (res: { success?: boolean; messageId?: string; error?: string }) => void
      ) => {
        try {
          let authUser: DecodedUser | null = socket.data.user || null;
          if (!authUser && data.token) {
            authUser = verifyAuthToken(data.token);
            if (authUser) {
              socket.data.user = authUser;
              socket.join('authenticated');
            }
          }

          if (!authUser) {
            callback?.({ error: 'Unauthorized: You must be logged in' });
            return;
          }

          const hasPermission = authUser.roles?.some((role: string) =>
            ['admin', 'clipteam'].includes(role)
          );

          if (!hasPermission) {
            callback?.({ error: 'Forbidden: Insufficient permissions' });
            return;
          }

          const { messageId } = data;
          if (!messageId) {
            callback?.({ error: 'Message ID is required' });
            return;
          }

          const result = await deleteTeamMessage(messageId, authUser);
          if (result === 'not_found') {
            callback?.({ error: 'Message not found' });
            return;
          }
          if (result === 'forbidden') {
            callback?.({ error: 'Forbidden: You can only delete your own messages' });
            return;
          }

          const clipId = data.clipId || result.clipId;

          // Broadcast deletion to everyone in the clip room
          io.to(`clip:${clipId}`).emit('message:deleted', { messageId, clipId });
          io.to(`clip:${clipId}`).emit(`message:deleted:${clipId}`, { messageId, clipId });

          callback?.({ success: true, messageId });
        } catch (error: any) {
          console.error('[Socket.IO] Error handling delete_message:', error);
          callback?.({ error: error.message || 'Failed to delete message' });
        }
      }
    );

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });
}
