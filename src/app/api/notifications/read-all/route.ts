import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Notification from '@/models/notificationModel';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: NextRequest) {
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

    const result = await Notification.updateMany(
      { recipientId: authUser!.id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
