import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema';

export const PUT = authRoute<{ id: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id } = await params;
  const [notification] = await db.select().from(notifications).where(eq(notifications._id, id));

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  if (notification.recipientId !== authUser.id) {
    return NextResponse.json(
      { error: 'Not authorized to update this notification' },
      { status: 403 }
    );
  }

  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications._id, id))
    .returning();

  return NextResponse.json({ success: true, notification: updated });
});
