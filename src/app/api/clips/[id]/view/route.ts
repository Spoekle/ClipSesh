import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { apiRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { clips, clipViews } from '@/db/schema';

/** An IP's repeat views of a clip within this window count once. */
const VIEW_COOLDOWN = sql`interval '2 hours'`;

export const POST = apiRoute<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const [clip] = await db.select({ views: clips.views }).from(clips).where(eq(clips._id, id));
  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }

  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';

  // Inserts a fresh view, or refreshes one older than the cooldown; returns nothing when the
  // IP already viewed this clip within the cooldown, so the check-and-record is atomic.
  const counted = await db
    .insert(clipViews)
    .values({ clipId: id, ip })
    .onConflictDoUpdate({
      target: [clipViews.clipId, clipViews.ip],
      set: { createdAt: sql`now()` },
      setWhere: sql`${clipViews.createdAt} < now() - ${VIEW_COOLDOWN}`,
    })
    .returning({ clipId: clipViews.clipId });

  if (counted.length === 0) {
    return NextResponse.json({ success: true, views: clip.views, counted: false });
  }

  const [updated] = await db
    .update(clips)
    .set({ views: sql`${clips.views} + 1` })
    .where(eq(clips._id, id))
    .returning({ views: clips.views });

  return NextResponse.json({ success: true, views: updated?.views ?? 1, counted: true });
});
