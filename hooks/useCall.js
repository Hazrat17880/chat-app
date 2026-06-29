// hooks/useCall.js

import { useState, useEffect, useRef } from 'react';

export function useCall({ userId, selectedUser, socket, auth }) {
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const webRTCService = useRef(null);
  const timerRef = useRef(null);

  // Helper to get user ID
  const getUserId = (user) => {
    if (!user) return null;
    return user._id || user.id || user.userId || null;
  };

  // Helper to get caller name from auth
  const getCallerName = () => {
    return auth?.user?.username || 
           auth?.user?.fullName || 
           auth?.user?.name || 
           'User';
  };

  const getCallerAvatar = () => {
    return auth?.user?.avatar || null;
  };

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) {
      console.warn('⚠️ Socket not available in useCall');
      return;
    }

    console.log('📞 useCall: Setting up socket listeners with ID:', socket.id);

    // ===== INCOMING CALL - WITH VIDEO FLAG =====
    socket.on('call:incoming', ({ from, callerName, callerAvatar, isVideo }) => {
      console.log('📞 Incoming call from:', from, callerName, 'Video:', isVideo);
      setIncomingCall({
        from,
        callerName,
        callerAvatar,
        isVideo: isVideo || false,
        timestamp: Date.now()
      });
      setCallStatus('ringing');
      setIsVideoCall(isVideo || false);
    });

    socket.on('call:accepted', ({ receiverId, receiverName }) => {
      console.log('📞 Call accepted by:', receiverId);
      setCallStatus('connected');
      startTimer();
    });

    socket.on('call:rejected', ({ receiverId }) => {
      console.log('📞 Call rejected by:', receiverId);
      setCallStatus('idle');
      cleanup();
    });

    socket.on('call:ended', ({ from }) => {
      console.log('📞 Call ended by:', from);
      setCallStatus('idle');
      stopTimer();
      cleanup();
    });

    socket.on('call:error', ({ error }) => {
      console.error('❌ Call error:', error);
      setCallStatus('idle');
      cleanup();
    });

    socket.on('call:busy', ({ receiverId }) => {
      console.log('📞 User busy:', receiverId);
      setCallStatus('idle');
      cleanup();
    });

    // ===== FIXED: Handle offer properly =====
    socket.on('call:offer', async ({ from, offer }) => {
      console.log('📤 Received offer from:', from);
      
      if (webRTCService.current) {
        try {
          console.log('📤 Setting remote description (offer)...');
          await webRTCService.current.setRemoteDescription('offer', offer);
          console.log('✅ Offer set as remote description successfully');
        } catch (error) {
          console.error('❌ Error setting remote description:', error);
        }
      } else {
        console.warn('⚠️ No WebRTC service available to handle offer');
      }
    });

    // ===== FIXED: Handle answer properly =====
    socket.on('call:answer', async ({ from, answer }) => {
      console.log('📤 Received answer from:', from);
      
      if (webRTCService.current) {
        try {
          console.log('📤 Setting remote description (answer)...');
          await webRTCService.current.setRemoteDescription('answer', answer);
          console.log('✅ Answer set as remote description successfully');
        } catch (error) {
          console.error('❌ Error setting remote description:', error);
        }
      } else {
        console.warn('⚠️ No WebRTC service available to handle answer');
      }
    });

    socket.on('call:ice-candidate', ({ from, candidate }) => {
      console.log('🧊 Received ICE candidate from:', from);
      if (webRTCService.current) {
        webRTCService.current.addIceCandidate(candidate);
      }
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('call:error');
      socket.off('call:busy');
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      cleanup();
    };
  }, [socket]);

  // ===== START AUDIO CALL =====
  const startAudioCall = async (userToCall = selectedUser) => {
    return startCall(userToCall, false);
  };

  // ===== START VIDEO CALL =====
  const startVideoCall = async (userToCall = selectedUser) => {
    return startCall(userToCall, true);
  };

  // ===== START CALL - WITH VIDEO SUPPORT =====
  const startCall = async (userToCall = selectedUser, isVideo = false, callerInfo = {}) => {
    const targetUser = userToCall || selectedUser;
    
    if (!targetUser) {
      console.error('❌ No user to call');
      return;
    }

    const receiverId = getUserId(targetUser);
    
    console.log(`📞 Starting ${isVideo ? 'video' : 'audio'} call with:`, {
      targetUser,
      receiverId,
      userId
    });

    if (!receiverId) {
      console.error('❌ Could not extract receiver ID from:', targetUser);
      return;
    }

    if (!socket) {
      console.error('❌ Socket not available');
      return;
    }

    if (!userId) {
      console.error('❌ Caller ID not available');
      return;
    }

    try {
      console.log(`📞 Starting ${isVideo ? 'video' : 'audio'} call to: ${receiverId}`);
      setCallStatus('calling');
      setIsVideoCall(isVideo);
      
      // Initialize WebRTC
      const { WebRTCService } = await import('../services/WebRTCService');
      webRTCService.current = new WebRTCService(socket, userId);
      
      // Set up listeners
      webRTCService.current.on('remoteStream', (stream) => {
        console.log('📹 Remote stream received');
        setRemoteStream(stream);
      });

      webRTCService.current.on('localStream', (stream) => {
        console.log('📹 Local stream received');
        setLocalStream(stream);
      });

      webRTCService.current.on('connectionState', (state) => {
        console.log('🔗 Connection state:', state);
        if (state === 'failed' || state === 'disconnected') {
          setCallStatus('idle');
          cleanup();
        }
      });

      webRTCService.current.on('callEnded', (data) => {
        console.log('📞 Call ended:', data);
        setCallStatus('idle');
        stopTimer();
        cleanup();
      });

      webRTCService.current.on('videoToggle', ({ isVideoOff }) => {
        console.log('📹 Video toggled:', isVideoOff);
        setIsVideoOff(isVideoOff);
      });

      // Start call with video flag
      await webRTCService.current.startCall(receiverId, isVideo);

      // Get caller's name
      const callerName = callerInfo.callerName || getCallerName();
      const callerAvatar = callerInfo.callerAvatar || getCallerAvatar();

      console.log(`📞 Caller name being sent to receiver:`, callerName);

      // Notify server with video flag
      const callData = {
        receiverId: receiverId,
        callerName: callerName,
        callerAvatar: callerAvatar,
        isVideo: isVideo
      };
      
      console.log('📤 Sending call:initiate with data:', callData);
      socket.emit('call:initiate', callData);

      console.log(`📞 ${isVideo ? 'Video' : 'Audio'} call initiated successfully to:`, receiverId);

    } catch (error) {
      console.error('❌ Error starting call:', error);
      setCallStatus('idle');
      cleanup();
    }
  };

  // ===== ANSWER CALL - FIXED =====
  const answerCall = async () => {
    if (!incomingCall) {
      console.error('❌ No incoming call');
      return;
    }

    try {
      const isVideo = incomingCall.isVideo || false;
      console.log(`📞 Answering ${isVideo ? 'video' : 'audio'} call from:`, incomingCall.from);
      
      // Import WebRTC service
      const { WebRTCService } = await import('../services/WebRTCService');
      webRTCService.current = new WebRTCService(socket, userId);
      
      // Set up listeners FIRST
      webRTCService.current.on('remoteStream', (stream) => {
        console.log('📹 Remote stream received');
        setRemoteStream(stream);
      });

      webRTCService.current.on('localStream', (stream) => {
        console.log('📹 Local stream received');
        setLocalStream(stream);
      });

      webRTCService.current.on('connectionState', (state) => {
        console.log('🔗 Connection state:', state);
        if (state === 'failed' || state === 'disconnected') {
          setCallStatus('idle');
          cleanup();
        }
      });

      webRTCService.current.on('callEnded', (data) => {
        console.log('📞 Call ended:', data);
        setCallStatus('idle');
        stopTimer();
        cleanup();
      });

      webRTCService.current.on('videoToggle', ({ isVideoOff }) => {
        console.log('📹 Video toggled:', isVideoOff);
        setIsVideoOff(isVideoOff);
      });

      // ===== FIX: Don't send call:accept here =====
      // Let the WebRTCService handle it after the offer is processed
      
      // Answer the call - this will wait for the offer if needed
      await webRTCService.current.answerCall(incomingCall.from, isVideo);
      
      // Update state
      setCallStatus('connected');
      setIsVideoCall(isVideo);
      setIncomingCall(null);
      startTimer();

    } catch (error) {
      console.error('❌ Error answering call:', error);
      cleanup();
      setCallStatus('idle');
    }
  };

  // ===== REJECT CALL =====
  const rejectCall = () => {
    if (incomingCall) {
      console.log('📞 Rejecting call from:', incomingCall.from);
      socket.emit('call:reject', { callerId: incomingCall.from });
      setIncomingCall(null);
      setCallStatus('idle');
    }
  };

  // ===== END CALL =====
  const endCall = () => {
    console.log('📞 Ending call');
    const receiverId = getUserId(selectedUser);
    if (receiverId) {
      console.log('📤 Sending call:end to:', receiverId);
      socket.emit('call:end', { receiverId });
      webRTCService.current?.endCall(receiverId);
    }
    setCallStatus('idle');
    stopTimer();
    cleanup();
  };

  // ===== TOGGLE MUTE =====
  const toggleMute = () => {
    const muted = webRTCService.current?.toggleMute();
    if (muted !== undefined) {
      setIsMuted(muted);
    }
    return isMuted;
  };

  // ===== TOGGLE VIDEO =====
  const toggleVideo = () => {
    const videoOff = webRTCService.current?.toggleVideo();
    if (videoOff !== undefined) {
      setIsVideoOff(videoOff);
    }
    return isVideoOff;
  };

  // Timer functions
  const startTimer = () => {
    setCallDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);
  };

  const cleanup = () => {
    if (webRTCService.current) {
      webRTCService.current.cleanup();
      webRTCService.current = null;
    }
    setRemoteStream(null);
    setLocalStream(null);
    stopTimer();
    setIsVideoCall(false);
    setIsVideoOff(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    callStatus,
    isMuted,
    isVideoOff,
    callDuration: formatDuration(callDuration),
    remoteStream,
    localStream,
    incomingCall,
    isVideoCall,
    startAudioCall,
    startVideoCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}