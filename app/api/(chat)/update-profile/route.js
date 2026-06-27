import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "../../../../lib/mongdb";
import upload from "../../../../lib/multer";
import cloudinary from "../../../../lib/cloudinary";
import { runMiddleware } from "../../../../lib/middleware";

// Helper to run multer middleware
export const config = {
  api: {
    bodyParser: false,
  },
};

// This function handles file upload middleware
async function runMulterMiddleware(req) {
  return new Promise((resolve, reject) => {
    upload.single('avatar')(req, null, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function PUT(req) {
  try {
    await connectDB();
    
    // Parse form data with multer
    const formData = await req.formData();
    const userId = formData.get('userId');
    const data = JSON.parse(formData.get('data') || '{}');
    const avatarFile = formData.get('avatar');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    // Handle avatar upload if file is provided
    let avatarUrl = null;
    if (avatarFile && avatarFile.size > 0) {
      try {
        // Convert file to buffer
        const buffer = Buffer.from(await avatarFile.arrayBuffer());
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'user_avatars',
              transformation: [
                { width: 200, height: 200, crop: 'fill' },
                { quality: 'auto' }
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        avatarUrl = result.secure_url;
        
        // Delete old avatar from Cloudinary if it exists and is custom
        if (user.avatarUrl && user.avatarIsCustom) {
          const publicId = user.avatarUrl.split('/').pop().split('.')[0];
          try {
            await cloudinary.uploader.destroy(`user_avatars/${publicId}`);
          } catch (deleteError) {
            console.log('Error deleting old avatar:', deleteError);
          }
        }
        
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return NextResponse.json(
          { success: false, message: "Failed to upload avatar" },
          { status: 500 }
        );
      }
    }
    
    // Fields that can be updated
    const allowedFields = [
      'username', 'email', 'phone', 'bio', 'location', 
      'website', 'socialLinks'
    ];
    
    // Update only allowed fields
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        user[field] = data[field];
      }
    }
    
    // Update avatar if uploaded
    if (avatarUrl) {
      user.avatarUrl = avatarUrl;
      user.avatarIsCustom = true;
      // Set avatar to the emoji or first letter if no avatar uploaded
      user.avatar = avatarUrl; // Or keep this as fallback
    }
    
    await user.save();
    
    // Return updated user without sensitive data
    const updatedUser = await User.findById(userId)
      .select("-password -otp -otpExpiresAt -refreshTokens -resetPasswordToken -resetPasswordExpires")
      .lean();
    
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
    
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to update profile" 
      },
      { status: 500 }
    );
  }
}