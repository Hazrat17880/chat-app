import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";
import { generateOTP } from "../../../lib/generateOtp"
import User from "@/models/User";
import { connectDB } from "../../../lib/mongdb";

export async function POST(req) {
  try {
    // Connect to database
    await connectDB();

    // Get email from request
    const { email } = await req.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is blocked. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "User is already verified",
        },
        { status: 400 }
      );
    }

    // Check resend cooldown (30 seconds)
    if (user.otpRequestedAt) {
      const timeSinceLastRequest = (Date.now() - user.otpRequestedAt.getTime()) / 1000;
      if (timeSinceLastRequest < 30) {
        const remainingSeconds = Math.ceil(30 - timeSinceLastRequest);
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
            cooldownSeconds: remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    user.otpAttempts = 0;
    user.otpRequestedAt = new Date();
    await user.save();

    // Send OTP via email
    await sendEmail(email, otp);

    // Log OTP in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      data: {
        email: user.email,
        expiresIn: 10, // minutes
      },
      // Remove otp in production
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send OTP. Please try again.",
      },
      { status: 500 }
    );
  }
}