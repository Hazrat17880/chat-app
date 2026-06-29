// hooks/useCall.js

import { useState, useEffect, useRef } from 'react';

export function useCall({ userId, selectedUser, socket, auth }) { // ← ADD auth parameter
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
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

    socket.on('call:incoming', ({ from, callerName, callerAvatar }) => {
      console.log('📞 Incoming call from:', from, callerName);
      setIncomingCall({
        from,
        callerName, // ← This is the caller's actual name
        callerAvatar,
        timestamp: Date.now()
      });
      setCallStatus('ringing');
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

    socket.on('call:offer', ({ from, offer }) => {
      console.log('📤 Received offer from:', from);
      if (webRTCService.current && callStatus === 'ringing') {
        webRTCService.current.setRemoteDescription('offer', offer);
      }
    });

    socket.on('call:answer', ({ from, answer }) => {
      console.log('📤 Received answer from:', from);
      if (webRTCService.current) {
        webRTCService.current.setRemoteDescription('answer', answer);
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

  // ===== START CALL - FIXED WITH CALLER NAME =====
  const startCall = async (userToCall = selectedUser, callerInfo = {}) => {
    const targetUser = userToCall || selectedUser;
    
    if (!targetUser) {
      console.error('❌ No user to call');
      return;
    }

    // Get the receiver ID properly
    const receiverId = getUserId(targetUser);
    
    console.log('📞 Starting call with:', {
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
      console.log(`📞 Starting call to: ${receiverId}`);
      setCallStatus('calling');
      
      // Initialize WebRTC
      const { WebRTCService } = await import('../services/WebRTCService');
      webRTCService.current = new WebRTCService(socket, userId);
      
      webRTCService.current.on('remoteStream', (stream) => {
        console.log('📹 Remote stream received');
        setRemoteStream(stream);
      });

      // Initiate call
      await webRTCService.current.startCall(receiverId);

      // ===== GET CALLER'S ACTUAL NAME =====
      // First try from callerInfo, then from auth
      const callerName = callerInfo.callerName || getCallerName();
      const callerAvatar = callerInfo.callerAvatar || getCallerAvatar();

      console.log('📞 Caller name being sent to receiver:', callerName); // ← Should show actual name

      // Notify server with the correct receiver ID and caller name
      const callData = {
        receiverId: receiverId,
        callerName: callerName, // ← Now sends actual name, not 'You'
        callerAvatar: callerAvatar
      };
      
      console.log('📤 Sending call:initiate with data:', callData);
      socket.emit('call:initiate', callData);

      console.log('📞 Call initiated successfully to:', receiverId);

    } catch (error) {
      console.error('❌ Error starting call:', error);
      setCallStatus('idle');
      cleanup();
    }
  };

  // ===== ANSWER CALL =====
  const answerCall = async () => {
    if (!incomingCall) {
      console.error('❌ No incoming call');
      return;
    }

    try {
      console.log('📞 Answering call from:', incomingCall.from);
      
      const { WebRTCService } = await import('../services/WebRTCService');
      webRTCService.current = new WebRTCService(socket, userId);
      
      webRTCService.current.on('remoteStream', (stream) => {
        console.log('📹 Remote stream received');
        setRemoteStream(stream);
      });

      await webRTCService.current.answerCall(incomingCall.from);
      setCallStatus('connected');
      
      socket.emit('call:accept', { callerId: incomingCall.from });
      
      setIncomingCall(null);
      startTimer();

    } catch (error) {
      console.error('❌ Error answering call:', error);
      cleanup();
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
    stopTimer();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    callStatus,
    isMuted,
    callDuration: formatDuration(callDuration),
    remoteStream,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute
  };
}