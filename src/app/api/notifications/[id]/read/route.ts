import { NextResponse } from 'next/server';
import { authRoute, ANY_ROLE } from '@/lib/route';
import Notification from '@/models/notificationModel';

export const PUT = authRoute<{ id: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id } = await params;
  const notification = await Notification.findById(id);

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  if (notification.recipientId.toString() !== authUser.id) {
    return NextResponse.json(
      { error: 'Not authorized to update this notification' },
      { status: 403 }
    );
  }

  notification.read = true;
  await notification.save();

  return NextResponse.json({ success: true, notification });
});
