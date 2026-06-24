import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from "../../../lib/mongdb";


export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Get request body
    const body = await request.json();
    const { email, otp } = body;

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and OTP are required' 
        },
        { status: 400 }
      );
    }

    // Find user and include OTP fields
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+otp +otpExpiresAt +otpAttempts');

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User not found' 
        },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User is already verified' 
        },
        { status: 400 }
      );
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpiresAt) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No OTP found. Please request a new one.' 
        },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpiresAt) {
      // Clear expired OTP
      user.otp = null;
      user.otpExpiresAt = null;
      await user.save();
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'OTP has expired. Please request a new one.' 
        },
        { status: 400 }
      );
    }

    // Check OTP attempts (max 5)
    if (user.otpAttempts >= 5) {
      // Clear OTP after too many attempts
      user.otp = null;
      user.otpExpiresAt = null;
      await user.save();
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many failed attempts. Please request a new OTP.' 
        },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otp !== otp) {
      // Increment failed attempts
      user.otpAttempts += 1;
      await user.save();
      
      const attemptsLeft = 5 - user.otpAttempts;
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid OTP. ${attemptsLeft} attempts remaining.`,
          attemptsLeft
        },
        { status: 400 }
      );
    }

    // OTP is valid - Verify the user
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    user.otpRequestedAt = null;
    user.metadata.registeredAt = new Date();
    
    await user.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role
      }
    }, { status: 200 });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}