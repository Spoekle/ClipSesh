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

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientId: authUser!.id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Notification.countDocuments({
        recipientId: authUser!.id,
        read: false,
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const deleteAll = searchParams.get('all') === 'true';

    const filter: Record<string, any> = { recipientId: authUser!.id };
    if (!deleteAll) {
      // Default: delete only read notifications
      filter.read = true;
    }

    const result = await Notification.deleteMany(filter);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleared ${result.deletedCount} notifications`,
    });
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
