import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import { requireAuth } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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
      comment.username === authUser!.username ||
      (comment.userId && comment.userId.toString() === authUser!.id);
    const isAdmin = authUser!.roles.includes('admin');

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have the required permissions' },
        { status: 403 }
      );
    }

    (clip.comments as any).pull({ _id: commentId });
    await clip.save();

    return NextResponse.json(clip);
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
