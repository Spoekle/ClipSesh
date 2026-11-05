import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import Report from '@/models/reportModel';
import ReportMessage from '@/models/reportMessageModel';

export const GET = authRoute<{ id: string }>(['user', 'clipteam', 'editor', 'admin'], async (req, { params, user: authUser }) => {
  const { id: reportId } = await params;
  const report = await Report.findById(reportId);

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const isAdmin = authUser.roles.includes('admin');
  const isReporter = report.reporterId.toString() === authUser.id;

  if (!isAdmin && !isReporter) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const query: Record<string, any> = { reportId };
  if (!isAdmin) {
    query.isInternal = false;
  }

  const messages = await ReportMessage.find(query).sort({ createdAt: 1 });
  return NextResponse.json(messages);
});

export const POST = authRoute<{ id: string }>(['user', 'clipteam', 'editor', 'admin'], async (req, { params, user: authUser }) => {
  const { id: reportId } = await params;
  const { message, isInternal } = await req.json();

  if (!message || message.trim() === '') {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }

  const report = await Report.findById(reportId);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const isAdmin = authUser.roles.includes('admin');
  const isReporter = report.reporterId.toString() === authUser.id;

  if (!isAdmin && !isReporter) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const newMessage = new ReportMessage({
    reportId,
    senderId: authUser.id,
    senderUsername: authUser.username,
    senderRole: isAdmin ? 'admin' : 'reporter',
    message: message.trim(),
    isInternal: isAdmin ? Boolean(isInternal) : false,
    readBy: [
      {
        userId: authUser.id,
        username: authUser.username,
        readAt: new Date(),
      },
    ],
  });

  await newMessage.save();
  return NextResponse.json(newMessage, { status: 201 });
});
