// services/WebRTCService.js

export class WebRTCService {
  constructor(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isMuted = false;
    this.isVideoOff = false;
    this.isVideoCall = false;
    this.callListeners = [];
    this.receiverId = null;
    this.callerId = null;
    this.pendingCandidates = [];
    this.isAnswering = false; // ← Add flag to prevent multiple answer attempts
    this.answerResolve = null; // ← Add promise resolver
  }

  // ===== CREATE PEER CONNECTION =====
  createPeerConnection(isVideo = false) {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10,
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.ontrack = (event) => {
      console.log('📹 Remote track received:', event.track.kind);
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      
      this.remoteStream.addTrack(event.track);
      this.notifyListeners('remoteStream', this.remoteStream);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 New ICE candidate:', event.candidate);
        
        const targetId = this.receiverId || this.callerId;
        if (targetId) {
          this.socket.emit('call:ice-candidate', {
            receiverId: targetId,
            candidate: event.candidate
          });
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('🔗 Connection state changed:', state);
      
      this.notifyListeners('connectionState', state);
      
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        console.log('⚠️ Connection lost, cleaning up...');
        this.cleanup();
        this.notifyListeners('callEnded', { reason: state });
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      console.log('🧊 ICE connection state:', state);
      
      if (state === 'failed' || state === 'disconnected') {
        console.log('⚠️ ICE connection failed, cleaning up...');
        this.cleanup();
        this.notifyListeners('callEnded', { reason: state });
      }
    };
  }

  // ===== START CALL =====
  async startCall(targetUserId, isVideo = false) {
    try {
      console.log(`📹 Starting ${isVideo ? 'video' : 'audio'} call to:`, targetUserId);
      
      this.receiverId = targetUserId;
      this.isVideoCall = isVideo;

      const constraints = {
        audio: true,
        video: isVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.notifyListeners('localStream', this.localStream);

      this.createPeerConnection(isVideo);

      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo
      });
      
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('call:offer', {
        receiverId: targetUserId,
        offer: offer
      });

      console.log(`✅ ${isVideo ? 'Video' : 'Audio'} call started successfully`);
      return true;

    } catch (error) {
      console.error('❌ Error starting call:', error);
      this.cleanup();
      throw error;
    }
  }

  // ===== ANSWER CALL - FIXED =====
  async answerCall(callerId, isVideo = false) {
    if (this.isAnswering) {
      console.log('⏳ Already answering, waiting...');
      // Wait for the current answer to complete
      return new Promise((resolve, reject) => {
        this.answerResolve = resolve;
        this.answerReject = reject;
      });
    }

    try {
      this.isAnswering = true;
      console.log(`📹 Answering ${isVideo ? 'video' : 'audio'} call from:`, callerId);
      
      this.callerId = callerId;
      this.isVideoCall = isVideo;

      const constraints = {
        audio: true,
        video: isVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.notifyListeners('localStream', this.localStream);

      this.createPeerConnection(isVideo);

      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // ===== FIX: Wait for remote description to be set =====
      // If we already have a remote description, create answer immediately
      if (this.peerConnection.remoteDescription) {
        console.log('📤 Creating answer immediately...');
        await this.createAndSendAnswer(callerId);
        return true;
      } else {
        console.log('⏳ Waiting for remote description (offer)...');
        // Wait for the offer to arrive
        // The offer will be set via setRemoteDescription
        // We'll create the answer there
        return true;
      }

    } catch (error) {
      console.error('❌ Error answering call:', error);
      this.isAnswering = false;
      this.cleanup();
      throw error;
    }
  }

  // ===== CREATE AND SEND ANSWER =====
  async createAndSendAnswer(callerId) {
    try {
      console.log('📤 Creating answer...');
      console.log('📊 Current signaling state:', this.peerConnection.signalingState);

      // Check if we're in the right state
      if (this.peerConnection.signalingState === 'have-remote-offer') {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.socket.emit('call:answer', {
          callerId: callerId,
          answer: answer
        });

        console.log(`✅ ${this.isVideoCall ? 'Video' : 'Audio'} call answered successfully`);
        
        // Resolve any waiting promises
        if (this.answerResolve) {
          this.answerResolve(true);
          this.answerResolve = null;
        }
        
        this.isAnswering = false;
        return true;
      } else {
        console.warn('⚠️ Cannot create answer - signaling state:', this.peerConnection.signalingState);
        this.isAnswering = false;
        return false;
      }
    } catch (error) {
      console.error('❌ Error creating answer:', error);
      this.isAnswering = false;
      throw error;
    }
  }

  // ===== SET REMOTE DESCRIPTION - FIXED =====
  async setRemoteDescription(type, description) {
    if (!this.peerConnection) {
      console.error('❌ No peer connection available');
      return;
    }

    try {
      console.log(`📤 Setting remote ${type} description...`);
      
      // Set remote description
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(description)
      );
      
      console.log('✅ Remote description set successfully');
      console.log('📊 Current signaling state:', this.peerConnection.signalingState);

      // Process any pending ICE candidates
      if (this.pendingCandidates.length > 0) {
        console.log(`🧊 Processing ${this.pendingCandidates.length} pending ICE candidates...`);
        for (const candidate of this.pendingCandidates) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn('⚠️ Failed to add candidate:', err);
          }
        }
        this.pendingCandidates = [];
      }

      // ===== FIX: If we're answering and have an offer, create answer =====
      if (type === 'offer' && this.isAnswering) {
        console.log('📤 Creating answer after receiving offer...');
        await this.createAndSendAnswer(this.callerId);
      } else if (type === 'offer') {
        console.log('📤 Received offer but not in answering state, creating answer anyway...');
        // If we're not in answering state but received an offer, create answer
        // This handles the case where the offer arrives before the answer function is called
        const callerId = this.callerId || description.sdp.match(/a=ice-options:(.*)/)?.[1];
        if (callerId) {
          await this.createAndSendAnswer(callerId);
        }
      } else if (type === 'answer') {
        console.log('✅ Answer set successfully');
      }

      return true;

    } catch (error) {
      console.error('❌ Error setting remote description:', error);
      throw error;
    }
  }

  // ===== ADD ICE CANDIDATE =====
  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      console.warn('⚠️ No peer connection available, storing ICE candidate for later');
      this.pendingCandidates.push(candidate);
      return;
    }
    
    try {
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log('🧊 ICE candidate added successfully');
      } else {
        console.warn('⚠️ No remote description yet, storing ICE candidate');
        this.pendingCandidates.push(candidate);
      }
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }

  // ===== TOGGLE MUTE =====
  toggleMute() {
    if (!this.localStream) {
      console.warn('⚠️ No local stream available');
      return false;
    }
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      this.isMuted = !audioTrack.enabled;
      audioTrack.enabled = !this.isMuted;
      console.log(`🔇 Microphone ${this.isMuted ? 'MUTED' : 'UNMUTED'}`);
      return this.isMuted;
    }
    return false;
  }

  // ===== TOGGLE VIDEO =====
  toggleVideo() {
    if (!this.localStream) {
      console.warn('⚠️ No local stream available');
      return false;
    }
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      this.isVideoOff = !videoTrack.enabled;
      videoTrack.enabled = !this.isVideoOff;
      console.log(`📹 Video ${this.isVideoOff ? 'OFF' : 'ON'}`);
      this.notifyListeners('videoToggle', { isVideoOff: this.isVideoOff });
      return this.isVideoOff;
    }
    return false;
  }

  // ===== END CALL =====
  endCall(receiverId) {
    console.log('📞 Ending call...');
    
    if (receiverId) {
      this.socket.emit('call:end', { receiverId });
    }
    
    this.cleanup();
    this.notifyListeners('callEnded', { reason: 'user_ended' });
  }

  // ===== CLEANUP =====
  cleanup() {
    console.log('🧹 Cleaning up WebRTC resources...');

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    this.remoteStream = null;
    this.isMuted = false;
    this.isVideoOff = false;
    this.isVideoCall = false;
    this.receiverId = null;
    this.callerId = null;
    this.pendingCandidates = [];
    this.isAnswering = false;
    this.answerResolve = null;
    this.answerReject = null;

    console.log('✅ WebRTC resources cleaned up');
  }

  // ===== EVENT LISTENERS =====
  on(event, callback) {
    this.callListeners.push({ event, callback });
  }

  off(event, callback) {
    this.callListeners = this.callListeners.filter(
      listener => !(listener.event === event && listener.callback === callback)
    );
  }

  notifyListeners(event, data) {
    this.callListeners.forEach(listener => {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`❌ Error in listener for ${event}:`, error);
        }
      }
    });
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  getConnectionState() {
    return this.peerConnection ? this.peerConnection.connectionState : 'closed';
  }

  getIceConnectionState() {
    return this.peerConnection ? this.peerConnection.iceConnectionState : 'closed';
  }
}

export default WebRTCService;