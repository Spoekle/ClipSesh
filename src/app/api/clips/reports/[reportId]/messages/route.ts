import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { reportMessageReads, reports } from '@/db/schema';
import {
  createNotifications,
  createReportMessage,
  getReportMessages,
  getUserIdsWithRoles,
} from '@/db/queries';

export const GET = authRoute<{ reportId: string }>(['user', 'clipteam', 'editor', 'admin'], async (req, { params, user: authUser }) => {
  const { reportId } = await params;
  const [report] = await db.select().from(reports).where(eq(reports._id, reportId));
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const isAdmin = authUser.roles.includes('admin');
  const isReporter = report.reporterId === authUser.id;

  if (!isAdmin && !isReporter) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const messages = await getReportMessages(reportId, isAdmin);

  // Mark unread messages as read
  const unreadMessages = messages.filter(
    (msg) => !msg.readBy.some((read) => read.userId === authUser.id)
  );

  if (unreadMessages.length > 0) {
    await db
      .insert(reportMessageReads)
      .values(
        unreadMessages.map((msg) => ({
          messageId: msg._id,
          userId: authUser.id,
          username: authUser.username,
        }))
      )
      .onConflictDoNothing();
  }

  return NextResponse.json(messages);
});

export const POST = authRoute<{ reportId: string }>(['user', 'clipteam', 'editor', 'admin'], async (req, { params, user: authUser }) => {
  const { reportId } = await params;
  const { message, isInternal = false } = await req.json();

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const [report] = await db.select().from(reports).where(eq(reports._id, reportId));
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const isAdmin = authUser.roles.includes('admin');
  const isReporter = report.reporterId === authUser.id;

  if (!isAdmin && !isReporter) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const finalIsInternal = isAdmin ? Boolean(isInternal) : false;

  const reportMessage = await createReportMessage({
    reportId,
    senderId: authUser.id,
    senderUsername: authUser.username,
    senderRole: isAdmin ? 'admin' : 'reporter',
    message: message.trim(),
    isInternal: finalIsInternal,
  });

  // Send notifications if not internal
  if (!finalIsInternal) {
    if (isAdmin && report.reporterId !== authUser.id) {
      // Notify the reporter
      await createNotifications([
        {
          recipientId: report.reporterId,
          senderId: authUser.id,
          senderUsername: authUser.username,
          type: 'report_update',
          clipId: report.clipId,
          entityId: report._id,
          message: `Admin ${authUser.username} sent a message regarding your report for "${report.clipTitle}"`,
        },
      ]);
    } else if (!isAdmin) {
      // Notify admins
      const adminIds = await getUserIdsWithRoles(['admin']);
      await createNotifications(
        adminIds.map((recipientId) => ({
          recipientId,
          senderId: authUser.id,
          senderUsername: authUser.username,
          type: 'report_update' as const,
          clipId: report.clipId,
          entityId: report._id,
          message: `${authUser.username} replied to report for "${report.clipTitle}"`,
        }))
      );
    }
  }

  return NextResponse.json(reportMessage, { status: 201 });
});
