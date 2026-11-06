import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema';

export const PUT = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const updated = await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.recipientId, authUser.id), eq(notifications.read, false)))
    .returning({ _id: notifications._id });

  return NextResponse.json({
    success: true,
    message: `Marked ${updated.length} notifications as read`,
  });
});
