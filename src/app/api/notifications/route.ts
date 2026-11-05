import { NextResponse } from 'next/server';
import { authRoute, ANY_ROLE } from '@/lib/route';
import Notification from '@/models/notificationModel';

export const GET = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipientId: authUser.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Notification.countDocuments({
      recipientId: authUser.id,
      read: false,
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
});

export const DELETE = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const { searchParams } = new URL(req.url);
  const deleteAll = searchParams.get('all') === 'true';

  const filter: Record<string, any> = { recipientId: authUser.id };
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
});
