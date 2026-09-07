import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import Report from '@/models/reportModel';
import Notification from '@/models/notificationModel';
import User from '@/models/userModel';
import { requireAuth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, ['clipteam', 'editor', 'admin']);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const { reason } = await req.json();

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'Report reason is required' }, { status: 400 });
    }

    const clip = await Clip.findById(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const existingReport = await Report.findOne({
      clipId: id,
      reporterId: authUser!.id,
    });

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this clip' }, { status: 400 });
    }

    const report = new Report({
      clipId: id,
      clipTitle: clip.title,
      clipStreamer: clip.streamer,
      clipSubmitter: clip.submitter,
      reporterId: authUser!.id,
      reporterUsername: authUser!.username,
      reason: reason.trim(),
    });

    await report.save();

    const adminUsers = await User.find({ roles: 'admin' });
    const notifications = adminUsers.map(
      (admin) =>
        new Notification({
          recipientId: admin._id,
          senderId: authUser!.id,
          senderUsername: authUser!.username,
          type: 'report',
          clipId: id,
          message: `${authUser!.username} reported a clip: "${clip.title}" by ${clip.streamer}`,
          entityId: report._id,
        })
    );

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json(
      {
        message: 'Clip reported successfully',
        report: {
          _id: report._id,
          clipId: report.clipId,
          reason: report.reason,
          status: report.status,
          createdAt: report.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error reporting clip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
