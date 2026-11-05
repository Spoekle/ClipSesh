import { NextResponse } from 'next/server';
import { and, count, eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema';

export const GET = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const [{ unreadCount }] = await db
    .select({ unreadCount: count() })
    .from(notifications)
    .where(and(eq(notifications.recipientId, authUser.id), eq(notifications.read, false)));

  return NextResponse.json({ unreadCount });
});
