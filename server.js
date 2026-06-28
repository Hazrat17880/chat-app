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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-application';

// Import Message model
let Message;

app.prepare().then(async () => {
  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected in server');
    
    // Import models after connection - FIXED IMPORT
    const messageModule = require('./models/Message');
    Message = messageModule.default || messageModule;
    console.log('✅ Message model loaded');
    console.log('✅ Message model name:', Message.modelName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
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
  });

  // Socket events
  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    // User connected
    socket.on('user_connected', (userId) => {
      global.onlineUsers.set(userId, socket.id);
      socket.data.userId = userId;
      io.emit('online_users', Array.from(global.onlineUsers.keys()));
      console.log(`✅ User ${userId} online. Total: ${global.onlineUsers.size}`);
    });

    // Send message - FIXED to save to database
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, content, type = 'text', tempId } = data;
        
        console.log(`📤 Sending message from ${senderId} to ${receiverId}:`, content);
        console.log('📤 Message model available:', !!Message);

        // Create message object with ObjectId
        const messageData = {
          senderId: new mongoose.Types.ObjectId(senderId),
          receiverId: new mongoose.Types.ObjectId(receiverId),
          content,
          type,
          status: 'sent',
        };

        let savedMessage = null;

        // Save to database if Message model is available
        if (Message) {
          try {
            console.log('📝 Creating new message in database...');
            const newMessage = new Message(messageData);
            savedMessage = await newMessage.save();
            console.log('✅ Message saved to database with ID:', savedMessage._id);
            
            // Populate sender details
            savedMessage = await Message.findById(savedMessage._id)
              .populate('senderId', 'username email avatar online fullName')
              .populate('receiverId', 'username email avatar online fullName');
            
            console.log('✅ Message populated:', savedMessage._id);
          } catch (dbError) {
            console.error('❌ Error saving message to database:', dbError.message);
            console.error('Error details:', dbError);
          }
        } else {
          console.warn('⚠️ Message model not available');
        }

        // Use saved message if available, otherwise use the temporary one
        const messageToSend = savedMessage || {
          _id: tempId || Date.now().toString(),
          senderId,
          receiverId,
          content,
          type,
          status: 'sent',
          createdAt: new Date().toISOString(),
        };

        // Check if receiver is online
        const receiverSocketId = global.onlineUsers.get(receiverId);
        
        if (receiverSocketId) {
          // Send to receiver
          io.to(receiverSocketId).emit('receive_message', {
            ...messageToSend,
            status: 'delivered'
          });
          
          // Update message status if saved in DB
          if (savedMessage) {
            try {
              await savedMessage.markAsDelivered(receiverId);
              console.log('✅ Message marked as delivered');
            } catch (error) {
              console.error('Error marking as delivered:', error);
            }
          }
          
          // Notify sender about delivery
          socket.emit('message_delivered', {
            messageId: messageToSend._id,
            status: 'delivered'
          });
        } else {
          console.log(`ℹ️ Receiver ${receiverId} is offline`);
        }

        // Send confirmation back to sender with the message
        socket.emit('message_sent', messageToSend);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    // Typing indicator
    socket.on('typing', ({ receiverId, isTyping }) => {
      const receiverSocketId = global.onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          userId: socket.data.userId,
          isTyping
        });
      }
    });

    // Message read
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

    // Fetch history - FIXED
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

    // Disconnect
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        global.onlineUsers.delete(userId);
        io.emit('online_users', Array.from(global.onlineUsers.keys()));
        console.log(`🔴 User ${userId} offline. Total: ${global.onlineUsers.size}`);
      }
    });
  });

  // Store io globally for other modules
  global.io = io;

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`🚀 Server ready on http://localhost:${PORT}`);
    console.log('✅ Socket.io server initialized');
  });
});