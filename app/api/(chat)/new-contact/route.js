import { NextResponse } from "next/server";
import Contact from "@/models/Contact";
import User from "@/models/User";
import { connectDB } from "@/lib/mongdb"; // Adjust path as needed

// ✅ POST: Add a new contact
export async function POST(req) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { userId, phoneNumber, customName } = body;
    
    // Log the parsed body data
    console.log("📝 Received data:", body);
    console.log("👤 User ID:", userId);
    console.log("📱 Phone Number:", phoneNumber);
    console.log("🏷️ Custom Name:", customName);
    
    // 1️⃣ Validate input
    if (!userId || !phoneNumber) {
      return NextResponse.json(
        { success: false, message: "User ID and phone number are required" },
        { status: 400 }
      );
    }
    
    // 2️⃣ Check if the logged-in user exists
    const currentUser = await User.findById(userId);
    console.log("✅ Current user found:", currentUser ? "Yes" : "No");
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    // 3️⃣ Check if the contact exists in the system
    const contactUser = await User.findOne({ phone: phoneNumber });
    console.log("✅ Contact user found:", contactUser ? "Yes" : "No");
    if (!contactUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: "User not registered in the app" 
        },
        { status: 404 }
      );
    }
    
    // 4️⃣ Prevent adding yourself
    if (userId === contactUser._id.toString()) {
      return NextResponse.json(
        { 
          success: false, 
          message: "You cannot add yourself as a contact" 
        },
        { status: 400 }
      );
    }
    
    // 5️⃣ Check if contact already exists
    const existingContact = await Contact.findOne({
      userId: userId,
      contactId: contactUser._id,
    });
    console.log("🔄 Contact already exists:", existingContact ? "Yes" : "No");
    
    if (existingContact) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Contact already exists in your list" 
        },
        { status: 409 }
      );
    }
    
    // 6️⃣ Add the contact
    const newContact = new Contact({
      userId: userId,
      contactId: contactUser._id,
      customName: customName || contactUser.username,
    });
    
    await newContact.save();
    console.log("✅ New contact saved:", newContact);
    
    // 7️⃣ Update user's totalFriends count
    await User.findByIdAndUpdate(userId, {
      $inc: { "stats.totalFriends": 1 }
    });
    
    // 8️⃣ Return success response with contact details
    return NextResponse.json({
      success: true,
      message: "Contact added successfully",
      data: {
        contact: {
          _id: newContact._id,
          customName: newContact.customName,
          addedAt: newContact.addedAt,
          user: {
            _id: contactUser._id,
            username: contactUser.username,
            email: contactUser.email,
            phone: contactUser.phone,
            avatar: contactUser.avatar,
            online: contactUser.online,
            lastSeen: contactUser.lastSeen,
          }
        }
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("❌ Error adding contact:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to add contact" 
      },
      { status: 500 }
    );
  }
}

// ✅ GET: Fetch all contacts for a user
export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    console.log("📥 GET request - User ID:", userId);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }
    
    const contacts = await Contact.find({ userId })
      .sort({ addedAt: -1 });
    
    console.log("📊 Contacts found:", contacts.length);
    
    return NextResponse.json({
      success: true,
      data: contacts,
    });
    
  } catch (error) {
    console.error("❌ Error fetching contacts:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch contacts" 
      },
      { status: 500 }
    );
  }
}