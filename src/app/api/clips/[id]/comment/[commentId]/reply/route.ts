import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { clipComments, clipCommentReplies, notifications } from '@/db/schema';
import { getClipWithComments } from '@/db/queries';

export const POST = authRoute<{ id: string; commentId: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id, commentId } = await params;
  const { replyText } = await req.json();

  if (!replyText || typeof replyText !== 'string' || !replyText.trim()) {
    return NextResponse.json({ error: 'Reply text is required' }, { status: 400 });
  }

  const [comment] = await db
    .select()
    .from(clipComments)
    .where(and(eq(clipComments._id, commentId), eq(clipComments.clipId, id)));
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const [newReply] = await db
    .insert(clipCommentReplies)
    .values({
      commentId,
      userId: authUser.id,
      username: authUser.username,
      replyText: replyText.trim(),
    })
    .returning({ _id: clipCommentReplies._id });

  if (comment.userId !== authUser.id) {
    try {
      await db.insert(notifications).values({
        recipientId: comment.userId,
        senderId: authUser.id,
        senderUsername: authUser.username,
        type: 'comment_reply',
        entityId: commentId,
        replyId: newReply._id,
        clipId: id,
        message: `${authUser.username} replied to your comment: "${replyText.substring(0, 50)}${
          replyText.length > 50 ? '...' : ''
        }"`,
      });
    } catch (notifErr) {
      console.warn('Failed to create notification for reply:', notifErr);
    }
  }

  return NextResponse.json(await getClipWithComments(id));
});
