import { safeLocalStorage } from '@/utils/storage';
import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

let sharedSocket: Socket | null = null;

export const getSharedSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null;

  if (!sharedSocket) {
    sharedSocket = io({
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    sharedSocket.on('connect', () => {
      console.log('[Socket.IO] Connected:', sharedSocket?.id);
      const token = safeLocalStorage.getItem('token');
      if (token) {
        sharedSocket?.emit('authenticate', token);
      }
    });

    sharedSocket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err);
    });

    sharedSocket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });

    window.addEventListener('clipsesh_auth_token_changed', (e: any) => {
      const token = e.detail || safeLocalStorage.getItem('token');
      if (token && sharedSocket?.connected) {
        sharedSocket.emit('authenticate', token);
      }
    });
  }

  return sharedSocket;
};

export const authenticateSocket = (token?: string) => {
  const s = getSharedSocket();
  if (!s) return;
  const authToken = token || safeLocalStorage.getItem('token');
  if (authToken) {
    s.emit('authenticate', authToken);
  }
};

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return sharedSocket ? sharedSocket.connected : false;
  });

  useEffect(() => {
    const socket = getSharedSocket();
    if (!socket) return;

    setIsConnected(socket.connected);

    const onConnect = () => {
      setIsConnected(true);
      const token = safeLocalStorage.getItem('token');
      if (token) {
        socket.emit('authenticate', token);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // If already connected, ensure authentication
    if (socket.connected) {
      const token = safeLocalStorage.getItem('token');
      if (token) {
        socket.emit('authenticate', token);
      }
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const subscribeToEvent = useCallback((event: string, callback: (...args: any[]) => void) => {
    const socket = getSharedSocket();
    if (!socket) return () => {};

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, data?: any, callback?: (...args: any[]) => void) => {
    const socket = getSharedSocket();
    if (!socket) return;
    if (typeof callback === 'function') {
      socket.emit(event, data, callback);
    } else if (data !== undefined) {
      socket.emit(event, data);
    } else {
      socket.emit(event);
    }
  }, []);

  const joinClip = useCallback((clipId: string) => {
    const socket = getSharedSocket();
    if (!socket || !clipId) return;
    socket.emit('join_clip', clipId);
  }, []);

  const leaveClip = useCallback((clipId: string) => {
    const socket = getSharedSocket();
    if (!socket || !clipId) return;
    socket.emit('leave_clip', clipId);
  }, []);

  return {
    isConnected,
    socket: sharedSocket,
    subscribeToEvent,
    emit,
    joinClip,
    leaveClip,
  };
};

export default useSocket;
