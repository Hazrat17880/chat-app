import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "../../../lib/mongdb";

export async function POST(req) {
  try {
    await connectDB();

    const { email, password } = await req.json();

console.log("========== LOGIN REQUEST ==========");
console.log("Email:", email);
console.log("Password:", password);

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Find user with password field
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+password');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been blocked. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not active. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your email before logging in.",
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();
      
      const attemptsLeft = 5 - user.failedLoginAttempts;
      
      return NextResponse.json(
        {
          success: false,
          message: `Invalid email or password. ${attemptsLeft} attempts remaining.`,
          attemptsLeft: attemptsLeft,
        },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "30d" }
    );

    // Prepare user data
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      online: user.online,
      lastSeen: user.lastSeen,
      preferences: user.preferences,
      stats: user.stats,
      profileComplete: user.profileComplete,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: userData,
        token: token,
        refreshToken: refreshToken,
        expiresIn: "7d",
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Login Error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Login failed. Please try again.",
      },
      { status: 500 }
    );
  }
}