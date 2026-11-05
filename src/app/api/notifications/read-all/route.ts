import { NextResponse } from 'next/server';
import { authRoute, ANY_ROLE } from '@/lib/route';
import Notification from '@/models/notificationModel';

export const PUT = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const result = await Notification.updateMany(
    { recipientId: authUser.id, read: false },
    { $set: { read: true } }
  );

  return NextResponse.json({
    success: true,
    message: `Marked ${result.modifiedCount} notifications as read`,
  });
});
