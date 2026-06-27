import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import { connectDB } from "@/lib/mongdb";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid User ID",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId).select(
      "-password -refreshToken -__v"
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User fetched successfully",
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}