// app/api/messages/route.js
import { NextResponse } from 'next/server';
import { connectDB } from "../../../lib/mongdb";
import Message from "../../../models/Message"
import User from '../../../models/User';

// POST - Send a new message
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { senderId, receiverId, content, type = 'text' } = body;

    console.log('📝 Creating message:', { senderId, receiverId, content });

    // Validate required fields
    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Sender ID and Receiver ID are required' },
        { status: 400 }
      );
    }

    if (!content && type === 'text') {
      return NextResponse.json(
        { error: 'Message content is required for text messages' },
        { status: 400 }
      );
    }

    // Check if users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender) {
      console.log('❌ Sender not found:', senderId);
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    if (!receiver) {
      console.log('❌ Receiver not found:', receiverId);
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Create message
    const messageData = {
      senderId,
      receiverId,
      content: content || '',
      type,
      status: 'sent',
    };

    const message = new Message(messageData);
    await message.save();

    // Populate sender and receiver details
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username email avatar online fullName')
      .populate('receiverId', 'username email avatar online fullName');

    console.log('✅ Message saved:', populatedMessage._id);

    // Emit via Socket.io if available
    if (global.io) {
      const receiverSocketId = global.onlineUsers?.get(receiverId);
      if (receiverSocketId) {
        global.io.to(receiverSocketId).emit('receive_message', {
          ...populatedMessage.toObject(),
          status: 'delivered'
        });
        
        // Update message status to delivered
        await message.markAsDelivered(receiverId);
      }

      // Send confirmation to sender
      const senderSocketId = global.onlineUsers?.get(senderId);
      if (senderSocketId) {
        global.io.to(senderSocketId).emit('message_sent', populatedMessage);
      }
    }

    return NextResponse.json({
      success: true,
      message: populatedMessage
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET - Get messages between two users
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const otherUserId = searchParams.get('otherUserId');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = parseInt(searchParams.get('skip')) || 0;

    if (!userId || !otherUserId) {
      return NextResponse.json(
        { error: 'User ID and Other User ID are required' },
        { status: 400 }
      );
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      isDeletedForEveryone: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username email avatar online fullName')
      .populate('receiverId', 'username email avatar online fullName');

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      status: { $in: ['sent', 'delivered'] },
      readBy: { $ne: userId },
      isDeletedForEveryone: false,
    });

    return NextResponse.json({
      success: true,
      messages,
      unreadCount,
      pagination: {
        limit,
        skip,
        total: messages.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// PUT - Update message status (read/delivered)
export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { messageId, userId, action } = body;

    if (!messageId || !userId) {
      return NextResponse.json(
        { error: 'Message ID and User ID are required' },
        { status: 400 }
      );
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    let updatedMessage;
    switch (action) {
      case 'read':
        updatedMessage = await message.markAsRead(userId);
        break;
      case 'delivered':
        updatedMessage = await message.markAsDelivered(userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "read" or "delivered"' },
          { status: 400 }
        );
    }

    // Emit via Socket.io
    if (global.io) {
      const senderId = message.senderId.toString();
      const senderSocketId = global.onlineUsers?.get(senderId);
      
      if (senderSocketId) {
        global.io.to(senderSocketId).emit('message_read', {
          messageId: message._id,
          userId,
          status: action === 'read' ? 'read' : 'delivered'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error updating message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE - Delete message
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');
    const deleteForEveryone = searchParams.get('deleteForEveryone') === 'true';

    if (!messageId || !userId) {
      return NextResponse.json(
        { error: 'Message ID and User ID are required' },
        { status: 400 }
      );
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    let result;
    if (deleteForEveryone) {
      if (message.senderId.toString() !== userId) {
        return NextResponse.json(
          { error: 'Only the sender can delete for everyone' },
          { status: 403 }
        );
      }
      result = await message.deleteForEveryone();
    } else {
      result = await message.deleteForUser(userId);
    }

    return NextResponse.json({
      success: true,
      message: result
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error deleting message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete message' },
      { status: 500 }
    );
  }
}