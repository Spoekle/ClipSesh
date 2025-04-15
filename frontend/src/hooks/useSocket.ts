import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import apiUrl from '../config/config';

const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize the socket connection
  useEffect(() => {
    // Create socket connection
    const socket = io(apiUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set up connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Authenticate the socket connection
      const token = localStorage.getItem('token');
      if (token) {
        socket.emit('authenticate', token);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current = socket;

    // Clean up socket connection when the component unmounts
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Listen for socket events
  const subscribeToEvent = useCallback((event: string, callback: (data: any) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(event, callback);
    
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  // Emit socket events
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, data);
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    subscribeToEvent,
    emit
  };
};

export default useSocket;
