import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Report from '@/models/reportModel';
import ReportMessage from '@/models/reportMessageModel';
import Notification from '@/models/notificationModel';
import User from '@/models/userModel';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, [
      'user',
      'clipteam',
      'editor',
      'admin',
    ]);
    if (errorResponse) return errorResponse;

    const { reportId } = await params;
    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const isAdmin = authUser!.roles.includes('admin');
    const isReporter = report.reporterId.toString() === authUser!.id;

    if (!isAdmin && !isReporter) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const query: Record<string, any> = { reportId };
    if (!isAdmin) {
      query.isInternal = false;
    }

    const messages = await ReportMessage.find(query).sort({ createdAt: 1 }).lean();

    // Mark unread messages as read
    const unreadMessages = messages.filter(
      (msg: any) => !msg.readBy.some((read: any) => read.userId.toString() === authUser!.id)
    );

    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map((msg: any) =>
          ReportMessage.findByIdAndUpdate(msg._id, {
            $push: {
              readBy: {
                userId: authUser!.id,
                username: authUser!.username,
                readAt: new Date(),
              },
            },
          })
        )
      );
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching report messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, [
      'user',
      'clipteam',
      'editor',
      'admin',
    ]);
    if (errorResponse) return errorResponse;

    const { reportId } = await params;
    const { message, isInternal = false } = await req.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const isAdmin = authUser!.roles.includes('admin');
    const isReporter = report.reporterId.toString() === authUser!.id;

    if (!isAdmin && !isReporter) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const senderRole = isAdmin ? 'admin' : 'reporter';
    const finalIsInternal = isAdmin ? Boolean(isInternal) : false;

    const reportMessage = new ReportMessage({
      reportId,
      senderId: authUser!.id,
      senderUsername: authUser!.username,
      senderRole,
      message: message.trim(),
      isInternal: finalIsInternal,
      readBy: [
        {
          userId: authUser!.id,
          username: authUser!.username,
          readAt: new Date(),
        },
      ],
    });

    await reportMessage.save();

    // Send notifications if not internal
    if (!finalIsInternal) {
      if (isAdmin && report.reporterId.toString() !== authUser!.id) {
        // Notify the reporter
        const notif = new Notification({
          recipientId: report.reporterId,
          senderId: authUser!.id,
          senderUsername: authUser!.username,
          type: 'report_update',
          clipId: report.clipId,
          entityId: report._id,
          message: `Admin ${authUser!.username} sent a message regarding your report for "${report.clipTitle}"`,
        });
        await notif.save();
      } else if (!isAdmin) {
        // Notify admins
        const adminUsers = await User.find({ roles: 'admin' });
        const notifications = adminUsers.map(
          (admin) =>
            new Notification({
              recipientId: admin._id,
              senderId: authUser!.id,
              senderUsername: authUser!.username,
              type: 'report_update',
              clipId: report.clipId,
              entityId: report._id,
              message: `${authUser!.username} replied to report for "${report.clipTitle}"`,
            })
        );
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    }

    return NextResponse.json(reportMessage, { status: 201 });
  } catch (error) {
    console.error('Error posting report message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
