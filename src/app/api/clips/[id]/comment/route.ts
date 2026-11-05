import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { clipComments, clips } from '@/db/schema';
import { getClipWithComments } from '@/db/queries';

export const POST = authRoute<{ id: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id } = await params;
  const { comment } = await req.json();

  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
  }

  const [clip] = await db.select({ _id: clips._id }).from(clips).where(eq(clips._id, id));
  if (!clip) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  await db.insert(clipComments).values({
    clipId: id,
    userId: authUser.id,
    username: authUser.username,
    comment: comment.trim(),
  });

  return NextResponse.json(await getClipWithComments(id));
});
