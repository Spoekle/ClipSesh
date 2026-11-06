import { NextResponse } from 'next/server';
import { count, countDistinct, eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { clipRatings, clips, users } from '@/db/schema';

export const GET = authRoute(['admin'], async () => {
  const [[{ userCount }], [{ activeUserCount }], [{ clipCount }], [{ ratedClipsCount }]] =
    await Promise.all([
      db.select({ userCount: count() }).from(users),
      db.select({ activeUserCount: count() }).from(users).where(eq(users.status, 'active')),
      db.select({ clipCount: count() }).from(clips).where(eq(clips.archived, false)),
      db.select({ ratedClipsCount: countDistinct(clipRatings.clipId) }).from(clipRatings),
    ]);

  return NextResponse.json({
    userCount,
    activeUserCount,
    clipCount,
    ratedClipsCount,
    deniedClipsCount: 0,
  });
});
