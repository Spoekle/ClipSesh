import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { clipComments, clipCommentReplies } from '@/db/schema';
import { getClipWithComments } from '@/db/queries';

export const DELETE = authRoute<{ id: string; commentId: string; replyId: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id, commentId, replyId } = await params;

  const [reply] = await db
    .select({ userId: clipCommentReplies.userId })
    .from(clipCommentReplies)
    .innerJoin(clipComments, eq(clipComments._id, clipCommentReplies.commentId))
    .where(
      and(
        eq(clipCommentReplies._id, replyId),
        eq(clipCommentReplies.commentId, commentId),
        eq(clipComments.clipId, id)
      )
    );
  if (!reply) {
    return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
  }

  const isAuthor = reply.userId === authUser.id;
  const isAdmin = authUser.roles.includes('admin');

  if (!isAuthor && !isAdmin) {
    return NextResponse.json(
      { error: 'You are not authorized to delete this reply' },
      { status: 403 }
    );
  }

  await db.delete(clipCommentReplies).where(eq(clipCommentReplies._id, replyId));

  return NextResponse.json(await getClipWithComments(id));
});
