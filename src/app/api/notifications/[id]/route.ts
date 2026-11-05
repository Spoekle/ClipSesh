import { NextResponse } from 'next/server';
import { authRoute, ANY_ROLE } from '@/lib/route';
import Notification from '@/models/notificationModel';

export const DELETE = authRoute<{ id: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id } = await params;
  const notification = await Notification.findById(id);

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  if (notification.recipientId.toString() !== authUser.id) {
    return NextResponse.json(
      { error: 'Not authorized to delete this notification' },
      { status: 403 }
    );
  }

  await notification.deleteOne();
  return NextResponse.json({ success: true, message: 'Notification deleted' });
});
