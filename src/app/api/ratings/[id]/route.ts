import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { clipRatings, RATING_VALUES, type RatingValue } from '@/db/schema';
import { emptyRatingBuckets, getRatingDocs, isRatingValue } from '@/db/queries';

export const GET = authRoute<{ id: string }>(['clipteam', 'admin'], async (req, { params }) => {
  const { id: clipId } = await params;

  const doc = (await getRatingDocs([clipId])).get(clipId);
  const buckets = doc?.ratings ?? emptyRatingBuckets();

  const ratingCounts = RATING_VALUES.map((ratingKey) => ({
    rating: ratingKey,
    count: buckets[ratingKey].length,
    users: buckets[ratingKey],
  }));

  const totalRatings = ratingCounts.reduce((acc, curr) => acc + curr.count, 0);

  return NextResponse.json({
    clipId,
    totalRatings,
    ratingCounts,
  });
});

export const POST = authRoute<{ id: string }>(['clipteam', 'admin'], async (req, { params, user: authUser }) => {
  const { id: clipId } = await params;
  const { rating, deny } = await req.json();

  let target: RatingValue | undefined;
  if (rating !== undefined && rating !== null) {
    const key = String(rating);
    if (!isRatingValue(key)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    target = key;
  } else if (deny !== undefined) {
    if (typeof deny !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    if (deny) target = 'deny';
  }

  if (!target) {
    return new NextResponse('Rating updated successfully');
  }

  const removedSameRating = await db.transaction(async (tx) => {
    const ownRating = and(eq(clipRatings.clipId, clipId), eq(clipRatings.userId, authUser.id));
    const [previous] = await tx.delete(clipRatings).where(ownRating).returning();
    // Clicking the rating you already gave removes it (toggle off).
    if (previous?.rating === target) return true;
    await tx.insert(clipRatings).values({
      clipId,
      userId: authUser.id,
      username: authUser.username,
      rating: target,
    });
    return false;
  });

  const message = !removedSameRating
    ? 'Rating updated successfully'
    : target === 'deny'
      ? 'Deny removed successfully'
      : 'Rating removed successfully';
  return new NextResponse(message);
});
