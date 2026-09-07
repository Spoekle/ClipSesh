import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Message from '@/models/messageModel';
import Clip from '@/models/clipModel';
import User from '@/models/userModel';
import Notification from '@/models/notificationModel';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['clipteam', 'editor', 'uploader', 'admin']);
    if (errorResponse) return errorResponse;

    const clipId = req.nextUrl.searchParams.get('clipId');
    if (!clipId) {
      return NextResponse.json({ error: 'clipId parameter required' }, { status: 400 });
    }

    const messages = await Message.find({ clipId }).sort({ timestamp: 1 }).lean();
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, [
      'admin',
      'clipteam',
      'editor',
      'uploader',
    ]);
    if (errorResponse) return errorResponse;

    const { clipId, message, profilePicture } = await req.json();
    const userId = authUser!.id;
    const username = authUser!.username;

    const newMessage = new Message({
      clipId,
      userId,
      user: username,
      message,
      profilePicture: profilePicture || '',
      timestamp: new Date(),
    });
    await newMessage.save();

    // Create notifications for all clipteam members
    const clipTeamMembers = await User.find({
      roles: { $in: ['clipteam', 'admin'] },
      _id: { $ne: userId },
    }).select('_id').lean();

    const clipInfo = await Clip.findById(clipId).select('title streamer').lean();
    const clipTitle = clipInfo ? clipInfo.title : 'a clip';
    const clipStreamer = clipInfo ? clipInfo.streamer : '';
    const notificationMessage = `${username} posted a team message on ${clipStreamer}'s clip: "${clipTitle}"`;

    const notifications = clipTeamMembers.map((member) => ({
      recipientId: member._id,
      senderId: userId,
      senderUsername: username,
      type: 'team_message',
      entityId: newMessage._id.toString(),
      clipId,
      message: notificationMessage,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
