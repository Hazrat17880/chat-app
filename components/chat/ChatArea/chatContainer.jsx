'use client';

import MessageService from "../../../services/messageService"

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from "../Sidebar/Sidebar"
import ChatHeader from "./ChatHeader"
import Messages from "./Messages"
import ChatInput from "./ChatInput"
import EmptyState from "../EmptyState/EmptyState"
import { useSocket } from '@/hooks/useSocket';

export default function ChatContainer() {
  const auth = useSelector((state) => state.auth);
  const userId = auth?.user?.id || auth?.user?._id;
  
  // State
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [receiverTyping, setReceiverTyping] = useState(false);

  // Socket hook - with proper userId
  const {
    isConnected,
    onlineUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    fetchHistory,
    socket,
    connect,
  } = useSocket({ userId: userId || 'test-user-id' });

  // Manually connect if not connected
  useEffect(() => {
    if (userId && !isConnected) {
      connect();
    }
  }, [userId, isConnected, connect]);








  // Load chat history when user is selected
  useEffect(() => {
    if (selectedUser && isConnected) {
      const otherUserId = selectedUser._id || selectedUser.userId;
      fetchHistory(otherUserId);
    }
  }, [selectedUser, isConnected, fetchHistory]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    console.log('📡 Setting up socket listeners');

    // Receive new message
    const handleReceiveMessage = (message) => {
      console.log('📩 Received message:', message);
      setMessages(prev => [...prev, message]);
      
      // Auto mark as read if selected
      const senderId = message.senderId?._id || message.senderId;
      if (selectedUser && (senderId === selectedUser._id || senderId === selectedUser.id)) {
        markAsRead(message._id, senderId);
      }
    };

    // Message sent confirmation
    const handleMessageSent = (message) => {
      console.log('✅ Message sent:', message);
      setMessages(prev => prev.map(msg => 
        msg._id === message._id ? message : msg
      ));
    };

    // Message delivered
    const handleMessageDelivered = ({ messageId, status }) => {
      console.log('✅ Message delivered:', messageId, status);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, status } : msg
      ));
    };

    // Message read
    const handleMessageRead = ({ messageId }) => {
      console.log('👀 Message read:', messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, status: 'read' } : msg
      ));
    };

    // User typing
    const handleUserTyping = ({ userId: typingUserId, isTyping }) => {
      if (selectedUser && (typingUserId === selectedUser._id || typingUserId === selectedUser.id)) {
        setReceiverTyping(isTyping);
      }
    };

    // Chat history
    const handleChatHistory = (history) => {
      console.log('📚 Chat history loaded:', history.length);
      setMessages(history);
    };

    // Error handler
    const handleError = ({ error }) => {
      console.error('❌ Socket error:', error);
    };

    // Register listeners
    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('chat_history', handleChatHistory);
    socket.on('error', handleError);

    // Cleanup
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('chat_history', handleChatHistory);
      socket.off('error', handleError);
    };
  }, [socket, selectedUser, markAsRead]);

  // Send message handler
 // components/chat/chatContainer.jsx - Replace the handleSendMessage function

// Send message handler - Saves to database AND sends via socket
const handleSendMessage = async (content) => {
  if (!selectedUser || !content.trim()) return;

  if (!isConnected) {
    console.warn("⚠️ Not connected");
    return;
  }

  console.log("your selected user are :",selectedUser);

  const receiverId = selectedUser._id || selectedUser.userId;

  // Generate unique temp ID
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create temporary message with "sending" status
  const tempMessage = {
    _id: tempId,
    senderId: userId,
    receiverId,
    content: content.trim(),
    type: 'text',
    status: 'sending',
    createdAt: new Date().toISOString(),
    sender: 'me',
  };

  // Show immediately (optimistic update)
  setMessages((prev) => [...prev, tempMessage]);

  try {
    // 1. Send via Socket.io for real-time
    sendMessage({
      receiverId,
      content: content.trim(),
      tempId: tempId,
    });

    // 2. Save to database via API
    const response = await MessageService.sendMessage({
      senderId: userId,
      receiverId,
      content: content.trim(),
    });

    if (response.success) {
      // Replace temp message with real message from database
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId 
            ? { 
                ...response.message, 
                status: 'sent',
                sender: 'me'
              } 
            : msg
        )
      );
      console.log('✅ Message saved to database:', response.message._id);
    }
  } catch (error) {
    console.error('❌ Error sending message:', error);
    // Update status to 'failed'
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === tempId 
          ? { ...msg, status: 'failed' } 
          : msg
      )
    );
  }
};

  // Typing handler
  const handleTyping = (isTyping) => {
    if (!selectedUser) return;
    const receiverId = selectedUser._id || selectedUser.id;
    sendTyping(receiverId, isTyping);
  };

  // Select user handler
  const handleUserSelect = (user) => {
    console.log("your selected user in the chat container :",user);
    setSelectedUser(user);
    setIsMobileMenuOpen(false);
  };

  // Prepare user object for ChatHeader
  const getUserForHeader = () => {
    if (!selectedUser) return null;
    return {
      _id: selectedUser._id || selectedUser.id,
      name: selectedUser.username || selectedUser.name || 'User',
      avatar: selectedUser.avatar || selectedUser.username?.charAt(0).toUpperCase() || 'U',
      online: onlineUsers.includes(selectedUser._id || selectedUser.id),
    };
  };

  const userForHeader = getUserForHeader();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        selectedUser={selectedUser}
        onUserSelect={handleUserSelect}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Header */}
            <ChatHeader
              user={userForHeader}
              isTyping={receiverTyping}
              onBack={() => setIsMobileMenuOpen(true)}
              onUserDetails={() => {}}
            />

            {/* Messages */}
            <Messages 
              messages={messages} 
              isTyping={receiverTyping} 
            />

            {/* Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isTyping={handleTyping}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}