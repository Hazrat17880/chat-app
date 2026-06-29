// services/WebRTCService.js

export class WebRTCService {
  constructor(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callListeners = [];
  }

  // Initialize call
  async startCall(targetUserId, isVideo = false) {
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Listen for remote tracks
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        this.notifyListeners('remoteStream', this.remoteStream);
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('call:ice-candidate', {
            receiverId: targetUserId,
            candidate: event.candidate
          });
        }
      };

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('call:offer', {
        receiverId: targetUserId,
        offer: offer
      });

      return true;
    } catch (error) {
      console.error('Error starting call:', error);
      this.cleanup();
      throw error;
    }
  }

  // Answer incoming call
  async answerCall(callerId) {
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Listen for remote tracks
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        this.notifyListeners('remoteStream', this.remoteStream);
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('call:ice-candidate', {
            receiverId: callerId,
            candidate: event.candidate
          });
        }
      };

      // Accept the call
      this.socket.emit('call:accept', { callerId });

      return true;
    } catch (error) {
      console.error('Error answering call:', error);
      this.cleanup();
      throw error;
    }
  }

  // Set remote description (offer/answer)
  async setRemoteDescription(type, description) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(description)
      );

      if (type === 'offer') {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        // Send answer back
        const callerId = description.sdp.match(/a=ice-options:(.*)/)?.[1] || '';
        this.socket.emit('call:answer', {
          callerId: callerId,
          answer: answer
        });
      }
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  }

  // Add ICE candidate
  addIceCandidate(candidate) {
    if (!this.peerConnection) return;
    
    try {
      this.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  // Mute/unmute microphone
  toggleMute() {
    if (!this.localStream) return false;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  // End call
  endCall(receiverId) {
    this.socket.emit('call:end', { receiverId });
    this.cleanup();
  }

  // Cleanup resources
  cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
  }

  // Event listeners
  on(event, callback) {
    this.callListeners.push({ event, callback });
  }

  notifyListeners(event, data) {
    this.callListeners.forEach(listener => {
      if (listener.event === event) {
        listener.callback(data);
      }
    });
  }
}