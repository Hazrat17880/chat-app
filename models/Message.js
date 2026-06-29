import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // Sender of the message
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
      index: true,
    },

    // Receiver of the message
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver ID is required"],
      index: true,
    },

    // Message content
    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
      // Not required for audio messages
    },

    // Message type
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "location", "contact"],
      default: "text",
    },

    // Message status
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
      index: true,
    },

    // ===== AUDIO MESSAGE FIELDS =====
    audioUrl: {
      type: String,
      default: null,
    },
    audioDuration: {
      type: Number,
      default: null,
    },
    audioSize: {
      type: Number,
      default: null,
    },
    audioMimeType: {
      type: String,
      default: 'audio/webm',
    },

    // For file messages
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    fileMimeType: {
      type: String,
      default: null,
    },

    // For location messages
    location: {
      latitude: Number,
      longitude: Number,
      placeName: String,
    },

    // Reply to message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // For forwarded messages
    isForwarded: {
      type: Boolean,
      default: false,
    },

    // Original sender (for forwarded messages)
    originalSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Read by recipients
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Delivered to recipients
    deliveredTo: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        deliveredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Reactions to message
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reaction: {
          type: String,
          enum: ["❤️", "👍", "😂", "😮", "😢", "🙏", "🎉", "🔥"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Deleted by users
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Delete for everyone (message recall)
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },

    // Edited message
    isEdited: {
      type: Boolean,
      default: false,
    },

    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Starred messages
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Mute notifications for this message
    isMuted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// Indexes for Better Performance
// ============================================

// For fetching chat history between two users
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// For fetching messages by status
messageSchema.index({ receiverId: 1, status: 1 });

// For fetching unread messages
messageSchema.index({ receiverId: 1, status: 1, readBy: 1 });

// For deleted messages
messageSchema.index({ deletedBy: 1 });

// For text search
messageSchema.index({ content: "text" });

// For time-based queries
messageSchema.index({ createdAt: -1 });

// For starred messages
messageSchema.index({ starredBy: 1 });

// For reactions
messageSchema.index({ "reactions.userId": 1 });

// For message type filtering
messageSchema.index({ type: 1 });

// ===== AUDIO MESSAGE INDEXES =====
messageSchema.index({ audioUrl: 1 });
messageSchema.index({ audioDuration: 1 });

// ============================================
// Virtual Fields
// ============================================

// Check if message is read by a specific user
messageSchema.virtual("isReadBy").get(function() {
  return function(userId) {
    return this.readBy.some((r) => r.userId.toString() === userId.toString());
  };
});

// Get unread count for a user
messageSchema.virtual("unreadCount").get(function() {
  return function(userId) {
    const isRead = this.readBy.some((r) => r.userId.toString() === userId.toString());
    return isRead ? 0 : 1;
  };
});

// ===== AUDIO MESSAGE VIRTUAL =====
messageSchema.virtual("isAudio").get(function() {
  return this.type === "audio";
});

messageSchema.virtual("audioDisplayDuration").get(function() {
  if (!this.audioDuration) return "0:00";
  const mins = Math.floor(this.audioDuration / 60);
  const secs = Math.floor(this.audioDuration % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

// ============================================
// Instance Methods
// ============================================

// Mark message as read for a user
messageSchema.methods.markAsRead = async function(userId) {
  const alreadyRead = this.readBy.some(
    (r) => r.userId.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      userId: userId,
      readAt: new Date(),
    });
    
    if (this.status === "delivered") {
      this.status = "read";
    }
    
    await this.save();
  }
  
  return this;
};

// Mark message as delivered for a user
messageSchema.methods.markAsDelivered = async function(userId) {
  const alreadyDelivered = this.deliveredTo.some(
    (d) => d.userId.toString() === userId.toString()
  );
  
  if (!alreadyDelivered) {
    this.deliveredTo.push({
      userId: userId,
      deliveredAt: new Date(),
    });
    
    if (this.status === "sent") {
      this.status = "delivered";
    }
    
    await this.save();
  }
  
  return this;
};

// Add reaction to message
messageSchema.methods.addReaction = async function(userId, reaction) {
  this.reactions = this.reactions.filter(
    (r) => r.userId.toString() !== userId.toString()
  );
  
  this.reactions.push({
    userId,
    reaction,
    createdAt: new Date(),
  });
  
  await this.save();
  return this;
};

// Remove reaction
messageSchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(
    (r) => r.userId.toString() !== userId.toString()
  );
  await this.save();
  return this;
};

// Edit message
messageSchema.methods.editMessage = async function(newContent) {
  this.editHistory.push({
    content: this.content,
    editedAt: new Date(),
  });
  
  this.content = newContent;
  this.isEdited = true;
  
  await this.save();
  return this;
};

// Delete message for user
messageSchema.methods.deleteForUser = async function(userId) {
  if (!this.deletedBy.includes(userId)) {
    this.deletedBy.push(userId);
    await this.save();
  }
  return this;
};

// Delete message for everyone (recall)
messageSchema.methods.deleteForEveryone = async function() {
  this.isDeletedForEveryone = true;
  this.content = "This message was deleted";
  await this.save();
  return this;
};

// ============================================
// Static Methods
// ============================================

// Get chat history between two users
messageSchema.statics.getChatHistory = async function(
  userId,
  otherUserId,
  limit = 50,
  skip = 0
) {
  return await this.find({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
    isDeletedForEveryone: false,
    deletedBy: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("senderId", "username email avatar online")
    .populate("receiverId", "username email avatar online");
};

// Get unread message count for a user
messageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    receiverId: userId,
    status: { $in: ["sent", "delivered"] },
    readBy: { $ne: userId },
    isDeletedForEveryone: false,
    deletedBy: { $ne: userId },
  });
};

// Get latest message between two users
messageSchema.statics.getLatestMessage = async function(userId, otherUserId) {
  return await this.findOne({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
    isDeletedForEveryone: false,
    deletedBy: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .populate("senderId", "username email avatar online")
    .populate("receiverId", "username email avatar online");
};

// Get message statistics
messageSchema.statics.getStats = async function(userId) {
  const [total, sent, delivered, read, audio] = await Promise.all([
    this.countDocuments({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }),
    this.countDocuments({ senderId: userId, status: "sent" }),
    this.countDocuments({ senderId: userId, status: "delivered" }),
    this.countDocuments({ senderId: userId, status: "read" }),
    this.countDocuments({ 
      senderId: userId, 
      type: "audio" 
    }),
  ]);
  
  return {
    total,
    sent,
    delivered,
    read,
    audio,
    unread: total - (sent + delivered + read),
  };
};

// Search messages
messageSchema.statics.searchMessages = async function(userId, searchTerm) {
  return await this.find({
    $and: [
      {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
      {
        $text: { $search: searchTerm },
      },
      {
        isDeletedForEveryone: false,
        deletedBy: { $ne: userId },
      },
    ],
  })
    .sort({ createdAt: -1 })
    .populate("senderId", "username email avatar")
    .populate("receiverId", "username email avatar");
};

// ===== AUDIO MESSAGE STATIC METHODS =====
// Get audio messages for a user
messageSchema.statics.getAudioMessages = async function(userId, otherUserId, limit = 20) {
  return await this.find({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
    type: "audio",
    isDeletedForEveryone: false,
    deletedBy: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("senderId", "username email avatar online")
    .populate("receiverId", "username email avatar online");
};

// Get audio messages count
messageSchema.statics.getAudioCount = async function(userId) {
  return await this.countDocuments({
    $or: [{ senderId: userId }, { receiverId: userId }],
    type: "audio",
    isDeletedForEveryone: false,
  });
};

// Get total audio duration for a user
messageSchema.statics.getTotalAudioDuration = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
        type: "audio",
        isDeletedForEveryone: false,
        deletedBy: { $ne: userId },
      },
    },
    {
      $group: {
        _id: null,
        totalDuration: { $sum: "$audioDuration" },
        count: { $sum: 1 },
      },
    },
  ]);
  
  return result[0] || { totalDuration: 0, count: 0 };
};

// ============================================
// Pre-save Middleware
// ============================================

// Validate audio message fields
messageSchema.pre("save", function(next) {
  if (this.type === "audio") {
    // Content is optional for audio messages
    // Set default content if not provided
    if (!this.content) {
      this.content = "🎤 Voice message";
    }
    
    // Validate audio fields
    if (!this.audioUrl) {
      next(new Error("Audio URL is required for audio messages"));
    }
    
    if (!this.audioDuration) {
      next(new Error("Audio duration is required for audio messages"));
    }
  }
  
  next();
});

// Post-save middleware
messageSchema.post("save", function(doc) {
  console.log(`Message saved: ${doc._id} type: ${doc.type} from ${doc.senderId}`);
});

// ============================================
// Create Model
// ============================================

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;