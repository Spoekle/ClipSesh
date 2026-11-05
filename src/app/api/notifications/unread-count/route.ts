import { NextResponse } from 'next/server';
import { authRoute, ANY_ROLE } from '@/lib/route';
import Notification from '@/models/notificationModel';

export const GET = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const unreadCount = await Notification.countDocuments({
    recipientId: authUser.id,
    read: false,
  });

  return NextResponse.json({ unreadCount });
});
