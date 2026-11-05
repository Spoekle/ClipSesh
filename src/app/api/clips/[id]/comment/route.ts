import { NextResponse } from 'next/server';
import { authRoute, ANY_ROLE } from '@/lib/route';
import Clip from '@/models/clipModel';

export const POST = authRoute<{ id: string }>(ANY_ROLE, async (req, { params, user: authUser }) => {
  const { id } = await params;
  const { comment } = await req.json();

  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
  }

  const clip = await Clip.findById(id);
  if (!clip) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  clip.comments.push({
    userId: authUser.id as any,
    username: authUser.username,
    comment: comment.trim(),
  } as any);

  await clip.save();

  return NextResponse.json(clip);
});
