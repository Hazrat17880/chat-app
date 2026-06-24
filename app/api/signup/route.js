import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../lib/mongdb";
import User from "@/models/User";
import { sendEmail, generateOTP } from "../../../lib/sendEmail";

export async function POST(request) {
  try {
    // ============================================
    // 0. CONNECT TO DATABASE
    // ============================================
    await connectDB();

    const body = await request.json();
    const {
      username,
      email,
      phone,
      password,
      confirmPassword,
    } = body;

    // ============================================
    // 1. VALIDATION
    // ============================================
    
    // Check required fields
    if (!username || !email || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be between 3 and 20 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate phone (at least 10 digits)
    const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, "");
    if (cleanedPhone.length < 10 || !/^\d+$/.test(cleanedPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number (at least 10 digits)" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if password has uppercase, number, special character
    const passwordChecks = {
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    };

    if (!passwordChecks.uppercase || !passwordChecks.number || !passwordChecks.special) {
      return NextResponse.json(
        { 
          error: "Password must include at least one uppercase letter, one number, and one special character (!@#$%^&*)" 
        },
        { status: 400 }
      );
    }

    // Check password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // ============================================
    // 2. CHECK EXISTING USER (Case-insensitive)
    // ============================================
    
    // Check if email or username already exists using MongoDB
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 400 }
        );
      }
      if (existingUser.username === username.toLowerCase()) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }

    // ============================================
    // 3. GENERATE OTP
    // ============================================
    
    const otp = generateOTP();

    // ============================================
    // 4. HASH PASSWORD (CRITICAL SECURITY FIX)
    // ============================================
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // ============================================
    // 5. CREATE USER IN MONGODB
    // ============================================
    
    const newUser = new User({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      isVerified: false,
      otp: otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      otpAttempts: 0,
      online: false,
      lastSeen: new Date(),
      avatar: username.charAt(0).toUpperCase(),
      metadata: {
        registeredAt: new Date(),
      },
    });

    // Save user to database
    await newUser.save();

    console.log(`✅ User created: ${newUser.email} (ID: ${newUser._id})`);

    // ============================================
    // 6. SEND EMAIL WITH OTP (FIXED)
    // ============================================
    
    // ✅ FIX: Use sendEmail with proper object format
    const emailResult = await sendEmail({
      to: newUser.email,
      subject: "Verify Your Account - OTP Code",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              
              <!-- Header -->
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                <h1 style="color: #1f2937; margin: 0; font-size: 24px;">🔐 Chat App</h1>
              </div>

              <!-- Body -->
              <div style="padding: 30px 0;">
                <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">
                  Verify Your Email Address
                </h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                  Hello ${newUser.username || "User"},
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                  Thank you for registering! Please use the following OTP to verify your email address:
                </p>

                <!-- OTP Box -->
                <div style="text-align: center; padding: 20px; margin: 25px 0; background: #eff6ff; border-radius: 8px; border: 1px solid #dbeafe;">
                  <div style="font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #2563eb; font-family: monospace;">
                    ${otp}
                  </div>
                </div>

                <p style="color: #4b5563; font-size: 14px; margin: 15px 0;">
                  ⏱️ This code will expire in <strong>10 minutes</strong>
                </p>

                <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
                  If you didn't request this, please ignore this email or contact support.
                </p>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  This is an automated message, please do not reply to this email.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
                  © ${new Date().getFullYear()} Chat App. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    if (!emailResult.success) {
      console.warn(`⚠️ Email failed to send for ${email}: ${emailResult.error}`);
      // In production, you might want to queue the email for retry
    } else {
      console.log(`✅ OTP email sent to ${email}`);
    }

    // ============================================
    // 7. RETURN RESPONSE (Exclude sensitive data)
    // ============================================
    
    return NextResponse.json(
      {
        success: true,
        message: emailResult.success 
          ? "OTP sent successfully to your email" 
          : "Account created but OTP email failed. Please request a new OTP.",
        email: newUser.email,
        userId: newUser._id.toString(),
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          phone: newUser.phone,
          isVerified: newUser.isVerified,
          createdAt: newUser.createdAt,
          avatar: newUser.avatar,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Registration error:", error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      return NextResponse.json(
        { error: `${fieldName} already exists` },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(". ") },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Something went wrong. Please try again later.",
        ...(process.env.NODE_ENV === "development" && { 
          details: error.message 
        }),
      },
      { status: 500 }
    );
  }
}