import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { clipComments, clips } from '@/db/schema';
import { getClipWithComments } from '@/db/queries';

export const DELETE = authRoute<{ id: string; commentId: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id, commentId } = await params;
  const [clip] = await db.select({ _id: clips._id }).from(clips).where(eq(clips._id, id));
  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }

  const [comment] = await db
    .select()
    .from(clipComments)
    .where(and(eq(clipComments._id, commentId), eq(clipComments.clipId, id)));
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const isAuthor = comment.username === authUser.username || comment.userId === authUser.id;
  const isAdmin = authUser.roles.includes('admin');

  if (!isAuthor && !isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have the required permissions' },
      { status: 403 }
    );
  }

  await db.delete(clipComments).where(eq(clipComments._id, commentId));

  return NextResponse.json(await getClipWithComments(id));
});
