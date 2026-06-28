// app/api/messages/search/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const searchTerm = searchParams.get('searchTerm');

    if (!userId || !searchTerm) {
      return NextResponse.json(
        { error: 'User ID and search term are required' },
        { status: 400 }
      );
    }

    const messages = await Message.searchMessages(userId, searchTerm);

    return NextResponse.json({
      success: true,
      messages
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error searching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search messages' },
      { status: 500 }
    );
  }
}