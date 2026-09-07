import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import Notification from '@/models/notificationModel';
import { requireAuth } from '@/lib/auth';

export async function POST(
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
    const { replyText } = await req.json();

    if (!replyText || typeof replyText !== 'string' || !replyText.trim()) {
      return NextResponse.json({ error: 'Reply text is required' }, { status: 400 });
    }

    const clip = await Clip.findById(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const comment = (clip.comments as any).id(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const reply = {
      userId: authUser!.id,
      username: authUser!.username,
      replyText: replyText.trim(),
      createdAt: new Date(),
    };

    comment.replies.push(reply);
    await clip.save();

    const newReply = comment.replies[comment.replies.length - 1];

    if (comment.userId && comment.userId.toString() !== authUser!.id) {
      try {
        const notif = new Notification({
          recipientId: comment.userId,
          senderId: authUser!.id,
          senderUsername: authUser!.username,
          type: 'comment_reply',
          entityId: commentId,
          replyId: newReply._id,
          clipId: id,
          message: `${authUser!.username} replied to your comment: "${replyText.substring(0, 50)}${
            replyText.length > 50 ? '...' : ''
          }"`,
        });
        await notif.save();
      } catch (notifErr) {
        console.warn('Failed to create notification for reply:', notifErr);
      }
    }

    return NextResponse.json(clip);
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
