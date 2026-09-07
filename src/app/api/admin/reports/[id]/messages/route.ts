import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Report from '@/models/reportModel';
import ReportMessage from '@/models/reportMessageModel';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: reportId } = await params;
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

    const messages = await ReportMessage.find(query).sort({ createdAt: 1 });
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching report messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
      'admin',
    ]);
    if (errorResponse) return errorResponse;

    const { id: reportId } = await params;
    const { message, isInternal } = await req.json();

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
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

    const newMessage = new ReportMessage({
      reportId,
      senderId: authUser!.id,
      senderUsername: authUser!.username,
      senderRole: isAdmin ? 'admin' : 'reporter',
      message: message.trim(),
      isInternal: isAdmin ? Boolean(isInternal) : false,
      readBy: [
        {
          userId: authUser!.id,
          username: authUser!.username,
          readAt: new Date(),
        },
      ],
    });

    await newMessage.save();
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error('Error sending report message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
