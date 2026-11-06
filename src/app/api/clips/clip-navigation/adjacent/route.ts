import { NextResponse } from 'next/server';
import { and, asc, desc, eq, gt, lt, notInArray, type SQL } from 'drizzle-orm';
import { apiRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { clipRatings, clips, type ClipRow } from '@/db/schema';
import { ilikeContains } from '@/db/queries';
import { isValidId } from '@/lib/ids';

type SortKey = 'newest' | 'oldest' | 'highestUpvotes' | 'highestDownvotes';

const SORT_KEYS: readonly SortKey[] = ['newest', 'oldest', 'highestUpvotes', 'highestDownvotes'];

/**
 * Conditions and orderings that find the clip shown just before / after `current` in a list
 * sorted by `sort`.
 */
function neighbourQueries(sort: SortKey, current: ClipRow) {
  const descending = sort !== 'oldest';
  const [before, after, column] =
    sort === 'highestUpvotes'
      ? [gt(clips.upvotes, current.upvotes), lt(clips.upvotes, current.upvotes), clips.upvotes]
      : sort === 'highestDownvotes'
        ? [gt(clips.downvotes, current.downvotes), lt(clips.downvotes, current.downvotes), clips.downvotes]
        : descending
          ? [gt(clips.createdAt, current.createdAt), lt(clips.createdAt, current.createdAt), clips.createdAt]
          : [lt(clips.createdAt, current.createdAt), gt(clips.createdAt, current.createdAt), clips.createdAt];
  return {
    before,
    after,
    // The nearest neighbour on each side: walk away from the current value.
    beforeOrder: descending ? asc(column) : desc(column),
    afterOrder: descending ? desc(column) : asc(column),
  };
}

export const GET = apiRoute(async (req) => {
  const currentClipId = req.nextUrl.searchParams.get('currentClipId');
  const sort = req.nextUrl.searchParams.get('sort') || 'newest';
  const streamer = req.nextUrl.searchParams.get('streamer');
  const getAdjacent = req.nextUrl.searchParams.get('getAdjacent');
  const excludeRatedByUser = req.nextUrl.searchParams.get('excludeRatedByUser');

  if (!currentClipId || getAdjacent !== 'true') {
    return NextResponse.json({ error: 'Required parameters missing' }, { status: 400 });
  }

  const [currentClip] = await db.select().from(clips).where(eq(clips._id, currentClipId));
  if (!currentClip) {
    return NextResponse.json({ error: 'Current clip not found' }, { status: 404 });
  }

  const baseConditions: SQL[] = [eq(clips.archived, false)];
  if (streamer) {
    baseConditions.push(ilikeContains(clips.streamer, streamer));
  }
  if (excludeRatedByUser && isValidId(excludeRatedByUser)) {
    baseConditions.push(
      notInArray(
        clips._id,
        db
          .select({ clipId: clipRatings.clipId })
          .from(clipRatings)
          .where(eq(clipRatings.userId, excludeRatedByUser))
      )
    );
  }

  const sortKey = SORT_KEYS.find((k) => k === sort) ?? 'newest';
  const { before, after, beforeOrder, afterOrder } = neighbourQueries(sortKey, currentClip);

  const [[prevClip], [nextClip]] = await Promise.all([
    db
      .select()
      .from(clips)
      .where(and(...baseConditions, before))
      .orderBy(beforeOrder)
      .limit(1),
    db
      .select()
      .from(clips)
      .where(and(...baseConditions, after))
      .orderBy(afterOrder)
      .limit(1),
  ]);

  return NextResponse.json({
    previous: prevClip ?? null,
    next: nextClip ?? null,
  });
});
