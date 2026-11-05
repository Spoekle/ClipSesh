import { NextResponse } from 'next/server';
import { authRoute, ANY_ROLE } from '@/lib/route';
import Clip from '@/models/clipModel';

export const DELETE = authRoute<{ id: string; commentId: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id, commentId } = await params;
  const clip = await Clip.findById(id);
  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }

  const comment = (clip.comments as any).id(commentId);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const isAuthor =
    comment.username === authUser.username ||
    (comment.userId && comment.userId.toString() === authUser.id);
  const isAdmin = authUser.roles.includes('admin');

  if (!isAuthor && !isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have the required permissions' },
      { status: 403 }
    );
  }

  (clip.comments as any).pull({ _id: commentId });
  await clip.save();

  return NextResponse.json(clip);
});
