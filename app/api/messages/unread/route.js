// app/api/messages/unread/route.js
import { NextResponse } from 'next/server';
import { connectDB } from "../../../../lib/mongdb"
import Message from '@/models/Message';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const unreadCount = await Message.getUnreadCount(userId);

    return NextResponse.json({
      success: true,
      unreadCount
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get unread count' },
      { status: 500 }
    );
  }
}