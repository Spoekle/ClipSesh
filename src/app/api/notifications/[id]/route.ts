import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema';

export const DELETE = authRoute<{ id: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id } = await params;
  const [notification] = await db
    .select({ recipientId: notifications.recipientId })
    .from(notifications)
    .where(eq(notifications._id, id));

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  if (notification.recipientId !== authUser.id) {
    return NextResponse.json(
      { error: 'Not authorized to delete this notification' },
      { status: 403 }
    );
  }

  await db.delete(notifications).where(eq(notifications._id, id));
  return NextResponse.json({ success: true, message: 'Notification deleted' });
});
