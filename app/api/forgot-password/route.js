import { NextResponse } from "next/server";
import crypto from "crypto";
import User from "@/models/User";
import { connectDB } from "../../../lib/mongdb";
import { sendEmail } from "../../../lib/sendEmail";

export async function POST(req) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // If user doesn't exist, return error message
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No account found with this email address. Please check and try again." 
        },
        { status: 404 }
      );
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { 
          success: false, 
          message: "This account has been blocked. Please contact support." 
        },
        { status: 403 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          message: "This account is not active. Please contact support." 
        },
        { status: 403 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // Send email using the updated sendEmail function
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🔐 Password Reset</h2>
          <p>Hello ${user.username || "User"},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </p>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          <hr style="margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Your App. All rights reserved.</p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error("Email send error:", emailResult.error);
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to send reset email. Please try again later." 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link sent to your email!",
      data: {
        email: user.email,
        expiresIn: "1 hour"
      }
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to process request. Please try again." 
      },
      { status: 500 }
    );
  }
}