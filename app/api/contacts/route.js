// app/api/contacts/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../lib/mongdb";
import Contact from "../../../models/Contact";
import User from "../../../models/User";

export async function POST(req) {
  try {
    await connectDB();

    const { userId } = await req.json();

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid User ID.",
        },
        { status: 400 }
      );
    }

    // Get all contacts of logged-in user with user data populated
    const contacts = await Contact.find({
      userId,
      status: "active",
    })
    .populate('contactId', 'username email phone avatar online lastSeen bio isVerified role avatarUrl')
    .sort({ lastInteraction: -1 })
    .lean();

    // Format contacts for the sidebar
    const formattedContacts = contacts.map(contact => {
      const user = contact.contactId;
      return {
        id: contact._id,
        userId: user?._id || contact.contactId,
        name: contact.name || user?.username || 'Unknown',
        username: user?.username || '',
        email: user?.email || '',
        avatar: contact.avatar || user?.avatar || '',
        avatarUrl: user?.avatarUrl || null,
        online: user?.online || false,
        lastSeen: user?.lastSeen,
        lastMessage: contact.lastMessage?.text || '',
        lastMessageTime: contact.lastMessage?.timestamp || contact.lastInteraction,
        unread: contact.unread || 0,
        favorite: contact.favorite || false,
        isGroup: contact.isGroup || false,
        isVerified: user?.isVerified || false,
        role: user?.role || 'user',
        bio: user?.bio || '',
        phone: contact.phone || user?.phone || '',
        lastInteraction: contact.lastInteraction,
      };
    });

    // Get total unread count
    const totalUnread = contacts.reduce((sum, contact) => sum + (contact.unread || 0), 0);

    return NextResponse.json(
      {
        success: true,
        message: "Contacts fetched successfully.",
        count: formattedContacts.length,
        data: formattedContacts,
        totalUnread,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Contacts Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error.",
      },
      { status: 500 }
    );
  }
}