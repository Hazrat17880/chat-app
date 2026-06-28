// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export const useSocket = ({ userId, autoConnect = true }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔄 Socket already connected');
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log('🔄 Connecting to socket...');

    // Use the same path as the server
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    
    socketRef.current = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
      if (userId) {
        socketRef.current.emit('user_connected', userId);
        console.log(`📤 User ${userId} registered`);
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log(`🔴 Socket disconnected: ${reason}`);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      if (userId) {
        socketRef.current.emit('user_connected', userId);
      }
    });

    socketRef.current.on('online_users', (users) => {
      console.log('📊 Online users updated:', users);
      setOnlineUsers(users);
    });

    socketRef.current.on('receive_message', (message) => {
      console.log('📩 New message received:', message);
    });

    socketRef.current.on('user_typing', ({ userId, isTyping }) => {
      console.log(`✍️ User ${userId} ${isTyping ? 'is typing...' : 'stopped typing'}`);
    });

  }, [userId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      console.log('🔌 Socket manually disconnected');
    }
  }, []);

  const sendMessage = useCallback((data) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ Socket not connected, message not sent');
      return;
    }
    socketRef.current.emit('send_message', { senderId: userId, ...data });
    console.log('📤 Message sent:', data);
  }, [userId]);

  const sendTyping = useCallback((receiverId, isTyping) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing', { receiverId, isTyping });
  }, []);

  const markAsRead = useCallback((messageId, senderId) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('message_read', { messageId, senderId });
  }, []);

  const fetchHistory = useCallback((otherUserId, limit = 50) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ Socket not connected, cannot fetch history');
      return;
    }
    socketRef.current.emit('fetch_history', { userId, otherUserId, limit });
  }, [userId]);

  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, userId]);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    fetchHistory,
    connect,
    disconnect,
  };
};