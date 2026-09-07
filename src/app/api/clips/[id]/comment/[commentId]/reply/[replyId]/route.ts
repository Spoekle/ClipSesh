import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import { requireAuth } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, [
      'user',
      'clipteam',
      'editor',
      'uploader',
      'admin',
    ]);
    if (errorResponse) return errorResponse;

    const { id, commentId, replyId } = await params;
    const clip = await Clip.findById(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const comment = (clip.comments as any).id(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const reply = (comment.replies as any).id(replyId);
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    const isAuthor = reply.userId.toString() === authUser!.id;
    const isAdmin = authUser!.roles.includes('admin');

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this reply' },
        { status: 403 }
      );
    }

    (comment.replies as any).pull({ _id: replyId });
    await clip.save();

    return NextResponse.json(clip);
  } catch (error) {
    console.error('Error deleting reply:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
