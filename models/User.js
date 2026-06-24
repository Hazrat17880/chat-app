import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Personal Information
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
      lowercase: true,
      index: true,
    },
    
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
      index: true,
    },
    
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function(v) {
          const cleaned = v.replace(/[\s\-\(\)\.]/g, "");
          return cleaned.length >= 10 && /^\d+$/.test(cleaned);
        },
        message: "Please enter a valid phone number (at least 10 digits)",
      },
    },
    
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't return password by default
    },

    // Account Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isBlocked: {
      type: Boolean,
      default: false,
    },
    
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },

    // Profile Information
    avatar: {
      type: String,
      default: function() {
        return this.username ? this.username.charAt(0).toUpperCase() : "U";
      },
    },
    
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    
    location: {
      type: String,
      default: "",
    },
    
    website: {
      type: String,
      default: "",
    },

    // OTP Related
    otp: {
      type: String,
      select: false,
    },
    
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    
    otpAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    
    otpRequestedAt: {
      type: Date,
      select: false,
    },

    // Online Status
    online: {
      type: Boolean,
      default: false,
    },
    
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    
    deviceInfo: {
      type: Object,
      default: {},
    },

    // Preferences
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      language: {
        type: String,
        default: "en",
      },
    },

    // Security
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    lockUntil: {
      type: Date,
      default: null,
    },
    
    refreshTokens: [{
      token: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      expiresAt: Date,
      deviceInfo: Object,
    }],

    // Social Media Links
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      github: String,
    },

    // Stats
    stats: {
      totalMessages: {
        type: Number,
        default: 0,
      },
      totalFriends: {
        type: Number,
        default: 0,
      },
      totalGroups: {
        type: Number,
        default: 0,
      },
      lastActive: Date,
    },

    // Reset Password
    resetPasswordToken: {
      type: String,
      select: false,
    },
    
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // Metadata
    metadata: {
      registeredAt: {
        type: Date,
        default: Date.now,
      },
      lastLogin: Date,
      loginCount: {
        type: Number,
        default: 0,
      },
      ipAddresses: [String],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// Indexes for Better Performance
// ============================================
userSchema.index({ email: 1, username: 1 });
userSchema.index({ isVerified: 1, isActive: 1 });
userSchema.index({ online: 1, lastSeen: -1 });
userSchema.index({ "preferences.language": 1 });

// ============================================
// Virtual Fields
// ============================================
userSchema.virtual("fullName").get(function() {
  return this.username;
});

userSchema.virtual("isLocked").get(function() {
  return this.lockUntil && this.lockUntil > Date.now();
});

userSchema.virtual("profileComplete").get(function() {
  let score = 0;
  if (this.bio) score++;
  if (this.location) score++;
  if (this.website) score++;
  if (this.avatar !== this.username.charAt(0).toUpperCase()) score++;
  return Math.round((score / 4) * 100);
});

// ============================================
// Instance Methods
// ============================================

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    // Reset if lock has expired
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
  } else {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    }
  }
  await this.save();
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

// Update last login
userSchema.methods.updateLastLogin = async function(ipAddress) {
  this.metadata.lastLogin = new Date();
  this.metadata.loginCount += 1;
  if (ipAddress && !this.metadata.ipAddresses.includes(ipAddress)) {
    this.metadata.ipAddresses.push(ipAddress);
    if (this.metadata.ipAddresses.length > 10) {
      this.metadata.ipAddresses.shift();
    }
  }
  await this.save();
};

// Add refresh token
userSchema.methods.addRefreshToken = function(token, expiresAt, deviceInfo) {
  this.refreshTokens.push({
    token,
    expiresAt,
    deviceInfo,
    createdAt: new Date(),
  });
  
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  return this.save();
};

// Clear all refresh tokens
userSchema.methods.clearRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

// Check if OTP is valid
userSchema.methods.isOTPValid = function(otp) {
  if (!this.otp || !this.otpExpiresAt) return false;
  if (this.otp !== otp) return false;
  if (this.otpExpiresAt < new Date()) return false;
  if (this.otpAttempts >= 5) return false;
  return true;
};

// Increment OTP attempts
userSchema.methods.incrementOTPAttempts = async function() {
  this.otpAttempts += 1;
  if (this.otpAttempts >= 5) {
    // Clear OTP after 5 failed attempts
    this.otp = null;
    this.otpExpiresAt = null;
  }
  await this.save();
};

// Reset OTP attempts
userSchema.methods.resetOTPAttempts = async function() {
  this.otpAttempts = 0;
  await this.save();
};

// ============================================
// Static Methods
// ============================================

// Find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
    ],
  });
};

// Find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({
    isActive: true,
    isBlocked: false,
  });
};

// Find online users
userSchema.statics.findOnlineUsers = function() {
  return this.find({
    online: true,
    isActive: true,
    isBlocked: false,
  });
};

// Get user statistics
userSchema.statics.getStats = async function() {
  const [totalUsers, verifiedUsers, onlineUsers, blockedUsers] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ isVerified: true }),
    this.countDocuments({ online: true }),
    this.countDocuments({ isBlocked: true }),
  ]);
  
  return {
    totalUsers,
    verifiedUsers,
    onlineUsers,
    blockedUsers,
    activeUsers: totalUsers - blockedUsers,
    verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
  };
};

// ============================================
// Middleware / Hooks
// ============================================

// Pre-save middleware
userSchema.pre("save", function(next) {
  // Update lastSeen if online status changes
  if (this.isModified("online") && this.online) {
    this.lastSeen = new Date();
  }
  
  // Update lastPasswordChange
  if (this.isModified("password")) {
    this.lastPasswordChange = new Date();
  }
  
  // Auto-update avatar if username changes
  if (this.isModified("username") && !this.isModified("avatar")) {
    this.avatar = this.username.charAt(0).toUpperCase();
  }
  
});

// Post-save middleware
userSchema.post("save", function(doc) {
  // You can add logging here
  console.log(`User saved: ${doc.email}`);
});

// Pre-find middleware
userSchema.pre(/^find/, function() {
  // Exclude blocked users from some queries
  // this._conditions.isBlocked = { $ne: true };
});

// ============================================
// Create Model
// ============================================

// Check if model exists before creating
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;