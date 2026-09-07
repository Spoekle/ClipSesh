import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Notification from '@/models/notificationModel';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, [
      'user',
      'clipteam',
      'editor',
      'uploader',
      'admin',
    ]);
    if (errorResponse) return errorResponse;

    const unreadCount = await Notification.countDocuments({
      recipientId: authUser!.id,
      read: false,
    });

    return NextResponse.json({ unreadCount });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
