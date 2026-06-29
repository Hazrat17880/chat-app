// components/chat/ChatContainer.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from "../Sidebar/Sidebar";
import ChatHeader from "./ChatHeader";
import Messages from "./Messages";
import ChatInput from "./ChatInput";
import EmptyState from "../EmptyState/EmptyState";
import { useSocket } from '@/hooks/useSocket';
import { useCall } from "../../../hooks/useCall"
import CallInterface from "../../calls/callInterface";

export default function ChatContainer() {
  const auth = useSelector((state) => state.auth);
  const userId = auth?.user?.id || auth?.user?._id;
  
  // State
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [receiverTyping, setReceiverTyping] = useState(false);

  // Socket hook
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

  // ============ CALL HOOK - WITH VIDEO SUPPORT ============
  const {
    callStatus,
    isMuted,
    isVideoOff,
    callDuration,
    remoteStream,
    localStream,
    incomingCall,
    isVideoCall,
    startAudioCall,
    startVideoCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useCall({ 
    userId, 
    selectedUser, 
    socket,
    auth
  });
  // ========================================

  // Manually connect if not connected
  useEffect(() => {
    if (userId && !isConnected) {
      console.log('🔄 Connecting socket...');
      connect();
    }
  }, [userId, isConnected, connect]);

  // Load chat history when user is selected
  useEffect(() => {
    if (selectedUser && isConnected) {
      const otherUserId = getUserRealId(selectedUser);
      console.log('📚 Fetching history for user:', otherUserId);
      fetchHistory(otherUserId);
    }
  }, [selectedUser, isConnected, fetchHistory]);

  // ===== HELPER FUNCTION TO GET USER ID =====
  const getUserRealId = (user) => {
    if (!user) return null;
    const id = user.userId;
    console.log('🔍 Extracted user ID:', id, 'from user:', user);
    return id;
  };

  // ===== SELECT USER HANDLER =====
  const handleUserSelect = (user) => {
    console.log("👤 User selected:", user);
    const userId = getUserRealId(user);
    console.log("👤 User ID extracted:", userId);
    console.log("👤 Is user online?", onlineUsers.includes(userId));
    
    if (userId) {
      const userWithId = {
        ...user,
        _id: userId,
        id: userId,
      };
      setSelectedUser(userWithId);
    } else {
      console.error('❌ No valid ID found for user:', user);
      setSelectedUser(user);
    }
    setIsMobileMenuOpen(false);
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    console.log('📡 Setting up socket listeners in ChatContainer');

    const handleReceiveMessage = (message) => {
      console.log('📩 Received message:', message);
      setMessages(prev => {
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
      
      const senderId = message.senderId?._id || message.senderId;
      const selectedUserId = getUserRealId(selectedUser);
      if (selectedUser && (senderId === selectedUserId)) {
        markAsRead(message._id, senderId);
      }
    };

    const handleMessageSent = (message) => {
      console.log('✅ Message sent:', message);
      setMessages(prev => {
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) return prev;
        return prev.map(msg => 
          msg._id === message._id || msg._id === message.tempId ? { ...message, status: 'sent', sender: 'me' } : msg
        );
      });
    };

    const handleMessageDelivered = ({ messageId, status }) => {
      console.log('✅ Message delivered:', messageId, status);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, status } : msg
      ));
    };

    const handleMessageRead = ({ messageId }) => {
      console.log('👀 Message read:', messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, status: 'read' } : msg
      ));
    };

    const handleUserTyping = ({ userId: typingUserId, isTyping }) => {
      const selectedUserId = getUserRealId(selectedUser);
      if (selectedUser && (typingUserId === selectedUserId)) {
        setReceiverTyping(isTyping);
      }
    };

    const handleChatHistory = (history) => {
      console.log('📚 Chat history loaded:', history.length);
      setMessages(history);
    };

    const handleError = ({ error }) => {
      console.error('❌ Socket error:', error);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('chat_history', handleChatHistory);
    socket.on('error', handleError);

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

  // ===== SEND MESSAGE HANDLER - SUPPORTS TEXT AND VOICE =====
  const handleSendMessage = (content) => {
    // ===== VOICE MESSAGE =====
    if (typeof content === 'object' && content !== null && content.type === 'audio') {
      if (!selectedUser) {
        console.error('❌ No user selected');
        return;
      }

      if (!isConnected) {
        console.warn("⚠️ Not connected");
        return;
      }

      const receiverId = getUserRealId(selectedUser);
      if (!receiverId) {
        console.error('❌ No receiver ID found');
        return;
      }

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create temp message for voice
      const tempMessage = {
        _id: tempId,
        senderId: userId,
        receiverId,
        content: '🎤 Voice message',
        type: 'audio',
        audioUrl: content.audioUrl || content.audio,
        audioDuration: content.duration || content.audioDuration || 0,
        status: 'sending',
        createdAt: new Date().toISOString(),
        sender: 'me',
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Send voice message via socket
      sendMessage({
        receiverId,
        content: '🎤 Voice message',
        type: 'audio',
        audioUrl: content.audioUrl || content.audio,
        audioDuration: content.duration || content.audioDuration || 0,
        tempId: tempId,
      });
      return;
    }

    // ===== TEXT MESSAGE =====
    // If content is not a string, convert it
    const textContent = typeof content === 'string' ? content : '';
    
    if (!selectedUser || !textContent.trim()) return;

    if (!isConnected) {
      console.warn("⚠️ Not connected");
      return;
    }

    const receiverId = getUserRealId(selectedUser);
    if (!receiverId) {
      console.error('❌ No receiver ID found');
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const tempMessage = {
      _id: tempId,
      senderId: userId,
      receiverId,
      content: textContent.trim(),
      type: 'text',
      status: 'sending',
      createdAt: new Date().toISOString(),
      sender: 'me',
    };

    setMessages((prev) => [...prev, tempMessage]);

    sendMessage({
      receiverId,
      content: textContent.trim(),
      type: 'text',
      tempId: tempId,
    });
  };

  // Typing handler
  const handleTyping = (isTyping) => {
    if (!selectedUser) return;
    const receiverId = getUserRealId(selectedUser);
    if (receiverId) {
      sendTyping(receiverId, isTyping);
    }
  };

  // Prepare user object for ChatHeader
  const getUserForHeader = () => {
    if (!selectedUser) return null;
    const userId = getUserRealId(selectedUser);
    return {
      _id: userId,
      name: selectedUser.username || selectedUser.name || selectedUser.fullName || 'User',
      avatar: selectedUser.avatar || selectedUser.profileImage || selectedUser.username?.charAt(0).toUpperCase() || 'U',
      online: onlineUsers.includes(userId),
      email: selectedUser.email,
      bio: selectedUser.bio,
      location: selectedUser.location,
      phone: selectedUser.phone,
    };
  };

  const userForHeader = getUserForHeader();

  // Debug: Log when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      const id = getUserRealId(selectedUser);
      console.log('📌 Selected user changed:', {
        selectedUser,
        extractedId: id,
        onlineUsers
      });
    }
  }, [selectedUser, onlineUsers]);

  // ===== HANDLE CALL START =====
  const handleCallStart = (type = 'audio') => {
    console.log(`📞 ${type} call button clicked in ChatContainer`);
    console.log('📞 Selected user:', selectedUser);
    
    const receiverId = getUserRealId(selectedUser);
    console.log('📞 Receiver ID:', receiverId);
    
    if (!receiverId) {
      console.error('❌ No receiver ID found for call');
      return;
    }

    // Check if the user is online
    const isOnline = onlineUsers.includes(receiverId);
    if (!isOnline) {
      console.warn(`⚠️ User ${receiverId} is not online`);
      alert('User is not online');
      return;
    }

    // Get the caller's name from auth
    const callerName = auth?.user?.username || auth?.user?.fullName || auth?.user?.name || 'User';
    const callerAvatar = auth?.user?.avatar || null;

    console.log(`📞 Caller name: ${callerName}, Type: ${type}`);

    // Make sure selectedUser has the ID in the right place
    const userWithCorrectId = {
      ...selectedUser,
      _id: receiverId,
      id: receiverId,
    };
    
    // Start call based on type
    if (type === 'video') {
      startVideoCall(userWithCorrectId);
    } else {
      startAudioCall(userWithCorrectId);
    }
  };

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
            <ChatHeader
              user={userForHeader}
              isTyping={receiverTyping}
              onBack={() => setIsMobileMenuOpen(true)}
              onUserDetails={() => {}}
              onAudioCall={() => handleCallStart('audio')}
              onVideoCall={() => handleCallStart('video')}
            />

            <Messages 
              messages={messages} 
              isTyping={receiverTyping} 
              currentUserId={userId}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              isTyping={handleTyping}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Call Interface - With Video Support */}
      <CallInterface
        isOpen={callStatus !== 'idle' || !!incomingCall}
        onClose={endCall}
        callerName={
          incomingCall?.callerName || 
          userForHeader?.name || 
          'Unknown Caller'
        }
        callStatus={callStatus}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        duration={callDuration}
        remoteStream={remoteStream}
        localStream={localStream}
        isVideoCall={isVideoCall}
        onMuteToggle={toggleMute}
        onVideoToggle={toggleVideo}
        onEndCall={endCall}
        isIncoming={!!incomingCall}
        onAccept={answerCall}
        onReject={rejectCall}
      />
    </div>
  );
}