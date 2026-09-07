import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import { requireAuth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      userId: authUser!.id as any,
      username: authUser!.username,
      comment: comment.trim(),
    } as any);

    await clip.save();

    return NextResponse.json(clip);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
