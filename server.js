// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store online users globally
global.onlineUsers = new Map();
global.activeCalls = new Map();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-application';

let Message;

app.prepare().then(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected in server');
    
    const messageModule = require('./models/Message');
    Message = messageModule.default || messageModule;
    console.log('✅ Message model loaded');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ============ HELPER FUNCTION TO LOG ONLINE USERS ============
  const logOnlineUsers = () => {
    const users = Array.from(global.onlineUsers.keys());
    console.log(`📋 Online users (${users.length}):`, users);
    return users;
  };

  // ============ BROADCAST ONLINE USERS ============
  const broadcastOnlineUsers = () => {
    const users = Array.from(global.onlineUsers.keys());
    console.log(`📢 Broadcasting online users:`, users);
    io.emit('online_users', users);
    return users;
  };

  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);
    console.log('🔍 Total connections:', io.engine.clientsCount);

    // ===== USER CONNECTED =====
    socket.on('user_connected', (userId) => {
      console.log(`📥 user_connected event received for userId: ${userId} from socket: ${socket.id}`);
      
      if (!userId) {
        console.error('❌ No userId provided in user_connected event');
        return;
      }

      const userIdStr = String(userId);
      
      const existingSocketId = global.onlineUsers.get(userIdStr);
      if (existingSocketId && existingSocketId !== socket.id) {
        console.log(`⚠️ User ${userIdStr} already connected with socket ${existingSocketId}, replacing with ${socket.id}`);
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (oldSocket) {
          oldSocket.emit('user_offline', { reason: 'Logged in elsewhere' });
          oldSocket.disconnect(true);
        }
      }

      global.onlineUsers.set(userIdStr, socket.id);
      socket.data.userId = userIdStr;
      
      console.log(`✅ User ${userIdStr} is now online. Total: ${global.onlineUsers.size}`);
      logOnlineUsers();
      
      broadcastOnlineUsers();
      
      socket.emit('online_users', Array.from(global.onlineUsers.keys()));
      
      socket.emit('user_connected_confirmation', { 
        userId: userIdStr, 
        onlineUsers: Array.from(global.onlineUsers.keys()) 
      });
    });

    // ===== GET ONLINE USERS =====
    socket.on('get_online_users', () => {
      const users = Array.from(global.onlineUsers.keys());
      console.log(`📋 Sending online users to ${socket.id}:`, users);
      socket.emit('online_users', users);
    });

    // ===== GET MY ONLINE STATUS =====
    socket.on('check_online_status', (userId) => {
      const userIdStr = String(userId);
      const isOnline = global.onlineUsers.has(userIdStr);
      console.log(`🔍 User ${userIdStr} online status: ${isOnline}`);
      socket.emit('online_status', { userId: userIdStr, isOnline });
    });

    // ===== USER JOINED FOR CALL =====
    socket.on('user_ready_for_calls', (userId) => {
      const userIdStr = String(userId);
      console.log(`📞 User ${userIdStr} is ready for calls`);
      
      if (!global.onlineUsers.has(userIdStr)) {
        global.onlineUsers.set(userIdStr, socket.id);
        socket.data.userId = userIdStr;
        broadcastOnlineUsers();
        console.log(`✅ User ${userIdStr} registered via user_ready_for_calls`);
      }
      
      socket.emit('call_ready', { userId: userIdStr, ready: true });
    });

    // ============ AUDIO/VIDEO CALL SIGNALING ============

    // ===== CALL INITIATE - UPDATED WITH VIDEO FLAG =====
    socket.on('call:initiate', ({ receiverId, callerName, callerAvatar, isVideo }) => {
      console.log(`📞 call:initiate received:`, {
        callerId: socket.data.userId,
        receiverId,
        callerName,
        isVideo: isVideo || false, // ← ADD THIS
        socketId: socket.id
      });

      logOnlineUsers();

      const callerId = String(socket.data.userId);
      const receiverIdStr = String(receiverId);

      if (!callerId) {
        console.error('❌ Caller ID is missing');
        socket.emit('call:error', { error: 'Your user ID is not registered' });
        return;
      }

      const receiverSocketId = global.onlineUsers.get(receiverIdStr);
      
      console.log(`🔍 Looking for receiver ${receiverIdStr}:`, {
        receiverSocketId,
        onlineUsers: Array.from(global.onlineUsers.keys())
      });

      if (!receiverSocketId) {
        console.log(`❌ Receiver ${receiverIdStr} is NOT online. Available users:`, Array.from(global.onlineUsers.keys()));
        socket.emit('call:error', { error: 'User is offline' });
        return;
      }

      if (!global.onlineUsers.has(callerId)) {
        console.log(`⚠️ Caller ${callerId} is not in onlineUsers map. Re-adding...`);
        global.onlineUsers.set(callerId, socket.id);
        broadcastOnlineUsers();
      }

      if (global.activeCalls.has(receiverIdStr) || global.activeCalls.has(callerId)) {
        console.log(`❌ User is already in a call:`, {
          receiverInCall: global.activeCalls.has(receiverIdStr),
          callerInCall: global.activeCalls.has(callerId)
        });
        socket.emit('call:error', { error: 'User is already in a call' });
        return;
      }

      const callType = isVideo ? '📹 Video' : '📞 Audio';
      console.log(`${callType} call initiated from ${callerId} to ${receiverIdStr}`);
      
      global.activeCalls.set(callerId, {
        callerId: callerId,
        receiverId: receiverIdStr,
        callerName: callerName,
        callerAvatar: callerAvatar,
        isVideo: isVideo || false, // ← ADD THIS
        startedAt: Date.now()
      });

      console.log(`📤 Sending call:incoming to ${receiverIdStr} (socket: ${receiverSocketId})`);
      io.to(receiverSocketId).emit('call:incoming', {
        from: callerId,
        callerName: callerName || 'Unknown',
        callerAvatar: callerAvatar || null,
        isVideo: isVideo || false // ← ADD THIS - Send video flag to receiver
      });

      socket.emit('call:initiated', { 
        receiverId: receiverIdStr,
        status: 'ringing',
        isVideo: isVideo || false
      });
    });

    // ===== USER ACCEPTING A CALL =====
    socket.on('call:accept', ({ callerId }) => {
      const callerIdStr = String(callerId);
      const callerSocketId = global.onlineUsers.get(callerIdStr);
      
      console.log(`📞 call:accept:`, {
        receiverId: socket.data.userId,
        callerId: callerIdStr,
        callerSocketId
      });

      if (!callerSocketId) {
        console.error(`❌ Caller ${callerIdStr} is no longer online`);
        socket.emit('call:error', { error: 'Caller is no longer online' });
        return;
      }

      console.log(`📞 Call accepted by ${socket.data.userId} from ${callerIdStr}`);
      
      const receiverIdStr = String(socket.data.userId);
      const existingCall = global.activeCalls.get(receiverIdStr) || {};
      global.activeCalls.set(receiverIdStr, {
        ...existingCall,
        status: 'connected',
        connectedAt: Date.now()
      });

      io.to(callerSocketId).emit('call:accepted', {
        receiverId: receiverIdStr,
        receiverName: socket.data.username || 'User'
      });
    });

    // ===== USER REJECTING A CALL =====
    socket.on('call:reject', ({ callerId }) => {
      const callerIdStr = String(callerId);
      const callerSocketId = global.onlineUsers.get(callerIdStr);
      
      if (callerSocketId) {
        console.log(`📞 Call rejected by ${socket.data.userId} from ${callerIdStr}`);
        io.to(callerSocketId).emit('call:rejected', {
          receiverId: socket.data.userId
        });
      }

      global.activeCalls.delete(socket.data.userId);
      global.activeCalls.delete(callerIdStr);
    });

    // ===== SEND WEBRTC OFFER =====
    socket.on('call:offer', ({ receiverId, offer }) => {
      const receiverSocketId = global.onlineUsers.get(receiverId);
      
      if (receiverSocketId) {
        console.log(`📤 Sending offer from ${socket.data.userId} to ${receiverId}`);
        io.to(receiverSocketId).emit('call:offer', {
          from: socket.data.userId,
          offer: offer
        });
      }
    });

    // ===== SEND WEBRTC ANSWER =====
    socket.on('call:answer', ({ callerId, answer }) => {
      const callerSocketId = global.onlineUsers.get(callerId);
      
      if (callerSocketId) {
        console.log(`📤 Sending answer from ${socket.data.userId} to ${callerId}`);
        io.to(callerSocketId).emit('call:answer', {
          from: socket.data.userId,
          answer: answer
        });
      }
    });

    // ===== SEND ICE CANDIDATE =====
    socket.on('call:ice-candidate', ({ receiverId, candidate }) => {
      const receiverSocketId = global.onlineUsers.get(receiverId);
      
      if (receiverSocketId) {
        console.log(`🧊 Sending ICE candidate from ${socket.data.userId} to ${receiverId}`);
        io.to(receiverSocketId).emit('call:ice-candidate', {
          from: socket.data.userId,
          candidate: candidate
        });
      }
    });

    // ===== END CALL =====
    socket.on('call:end', ({ receiverId }) => {
      const callerId = socket.data.userId;
      console.log(`📞 Call ended by ${callerId} with ${receiverId}`);
      
      const receiverSocketId = global.onlineUsers.get(receiverId);
      const callerSocketId = global.onlineUsers.get(callerId);
      
      if (receiverSocketId) {
        console.log(`📤 Sending call:ended to receiver ${receiverId} (socket: ${receiverSocketId})`);
        io.to(receiverSocketId).emit('call:ended', {
          from: callerId,
          reason: 'caller_ended'
        });
      }
      
      if (callerSocketId && callerSocketId !== receiverSocketId) {
        console.log(`📤 Sending call:ended to caller ${callerId} (socket: ${callerSocketId})`);
        io.to(callerSocketId).emit('call:ended', {
          from: receiverId,
          reason: 'caller_ended'
        });
      }

      global.activeCalls.delete(callerId);
      global.activeCalls.delete(receiverId);
      
      console.log(`📞 Call data cleaned up for ${callerId} and ${receiverId}`);
    });

    // ===== USER BUSY =====
    socket.on('call:busy', ({ callerId }) => {
      const callerSocketId = global.onlineUsers.get(callerId);
      
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:busy', {
          receiverId: socket.data.userId
        });
      }
    });

    // ============ END CALL SIGNALING ============

    // ===== SEND MESSAGE =====
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, content, type = 'text', tempId } = data;
        
        console.log(`📤 Sending message from ${senderId} to ${receiverId}:`, content);

        const messageData = {
          senderId: new mongoose.Types.ObjectId(senderId),
          receiverId: new mongoose.Types.ObjectId(receiverId),
          content,
          type,
          status: 'sent',
        };

        let savedMessage = null;

        if (Message) {
          try {
            console.log('📝 Creating new message in database...');
            const newMessage = new Message(messageData);
            savedMessage = await newMessage.save();
            console.log('✅ Message saved to database with ID:', savedMessage._id);
            
            savedMessage = await Message.findById(savedMessage._id)
              .populate('senderId', 'username email avatar online fullName')
              .populate('receiverId', 'username email avatar online fullName');
            
            console.log('✅ Message populated:', savedMessage._id);
          } catch (dbError) {
            console.error('❌ Error saving message to database:', dbError.message);
          }
        } else {
          console.warn('⚠️ Message model not available');
        }

        const messageToSend = savedMessage || {
          _id: tempId || Date.now().toString(),
          senderId,
          receiverId,
          content,
          type,
          status: 'sent',
          createdAt: new Date().toISOString(),
        };

        const receiverSocketId = global.onlineUsers.get(receiverId);
        
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', {
            ...messageToSend,
            status: 'delivered'
          });
          
          if (savedMessage) {
            try {
              await savedMessage.markAsDelivered(receiverId);
              console.log('✅ Message marked as delivered');
            } catch (error) {
              console.error('Error marking as delivered:', error);
            }
          }
          
          socket.emit('message_delivered', {
            messageId: messageToSend._id,
            status: 'delivered'
          });
        } else {
          console.log(`ℹ️ Receiver ${receiverId} is offline`);
        }

        socket.emit('message_sent', messageToSend);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    // ===== TYPING INDICATOR =====
    socket.on('typing', ({ receiverId, isTyping }) => {
      const receiverSocketId = global.onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          userId: socket.data.userId,
          isTyping
        });
      }
    });

    // ===== MESSAGE READ =====
    socket.on('message_read', async ({ messageId, senderId }) => {
      try {
        if (Message && messageId) {
          const message = await Message.findById(messageId);
          if (message) {
            await message.markAsRead(senderId);
            console.log('✅ Message marked as read:', messageId);
          }
        }

        const senderSocketId = global.onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_read', { 
            messageId,
            userId: socket.data.userId 
          });
        }
      } catch (error) {
        console.error('❌ Error marking message as read:', error);
      }
    });

    // ===== FETCH HISTORY =====
    socket.on('fetch_history', async ({ userId, otherUserId, limit = 50 }) => {
      try {
        console.log(`📚 Fetching history for ${userId} and ${otherUserId}`);
        
        if (Message) {
          const messages = await Message.find({
            $or: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
            isDeletedForEveryone: false,
          })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('senderId', 'username email avatar online fullName')
            .populate('receiverId', 'username email avatar online fullName');
          
          console.log(`📚 Found ${messages.length} messages`);
          socket.emit('chat_history', messages);
        } else {
          console.warn('⚠️ Message model not available');
          socket.emit('chat_history', []);
        }
      } catch (error) {
        console.error('❌ Error fetching history:', error);
        socket.emit('chat_history', []);
      }
    });

    // ===== DISCONNECT =====
    socket.on('disconnect', (reason) => {
      const userId = socket.data.userId;
      console.log(`🔴 Client disconnected: ${socket.id}, reason: ${reason}, userId: ${userId}`);
      
      if (userId) {
        // Check if this user was in an active call
        if (global.activeCalls.has(userId)) {
          const callData = global.activeCalls.get(userId);
          const otherUserId = callData.callerId === userId ? callData.receiverId : callData.callerId;
          
          const otherSocketId = global.onlineUsers.get(otherUserId);
          if (otherSocketId) {
            console.log(`📤 Notifying ${otherUserId} that ${userId} disconnected during call`);
            io.to(otherSocketId).emit('call:ended', {
              from: userId,
              reason: 'disconnected'
            });
          }
          
          global.activeCalls.delete(userId);
          global.activeCalls.delete(otherUserId);
          console.log(`📞 Call cleaned up due to disconnect: ${userId}`);
        }

        const registeredSocketId = global.onlineUsers.get(userId);
        if (registeredSocketId === socket.id) {
          global.onlineUsers.delete(userId);
          console.log(`🔴 User ${userId} offline. Total: ${global.onlineUsers.size}`);
          broadcastOnlineUsers();
        } else {
          console.log(`⚠️ User ${userId} has a different socket registered: ${registeredSocketId}, ignoring disconnect`);
        }
      }
      
      console.log(`🔍 Total connections after disconnect: ${io.engine.clientsCount}`);
    });
  });

  global.io = io;

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`🚀 Server ready on http://localhost:${PORT}`);
    console.log('✅ Socket.io server initialized');
  });
});