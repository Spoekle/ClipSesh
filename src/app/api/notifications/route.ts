import { NextResponse } from 'next/server';
import { and, count, desc, eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema';

export const GET = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const [rows, [{ unreadCount }]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, authUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(100),
    db
      .select({ unreadCount: count() })
      .from(notifications)
      .where(and(eq(notifications.recipientId, authUser.id), eq(notifications.read, false))),
  ]);

  return NextResponse.json({ notifications: rows, unreadCount });
});

export const DELETE = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const deleteAll = req.nextUrl.searchParams.get('all') === 'true';

  const deleted = await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.recipientId, authUser.id),
        // Default: delete only read notifications
        deleteAll ? undefined : eq(notifications.read, true)
      )
    )
    .returning({ _id: notifications._id });

  return NextResponse.json({
    success: true,
    deletedCount: deleted.length,
    message: `Cleared ${deleted.length} notifications`,
  });
});
