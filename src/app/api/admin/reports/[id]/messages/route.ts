import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { reports } from '@/db/schema';
import { createReportMessage, getReportMessages } from '@/db/queries';

export const GET = authRoute<{ id: string }>(['user', 'clipteam', 'editor', 'admin'], async (req, { params, user: authUser }) => {
  const { id: reportId } = await params;
  const [report] = await db.select().from(reports).where(eq(reports._id, reportId));

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const isAdmin = authUser.roles.includes('admin');
  const isReporter = report.reporterId === authUser.id;

  if (!isAdmin && !isReporter) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json(await getReportMessages(reportId, isAdmin));
});

export const POST = authRoute<{ id: string }>(['user', 'clipteam', 'editor', 'admin'], async (req, { params, user: authUser }) => {
  const { id: reportId } = await params;
  const { message, isInternal } = await req.json();

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
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

  const newMessage = await createReportMessage({
    reportId,
    senderId: authUser.id,
    senderUsername: authUser.username,
    senderRole: isAdmin ? 'admin' : 'reporter',
    message: message.trim(),
    isInternal: isAdmin ? Boolean(isInternal) : false,
  });
  return NextResponse.json(newMessage, { status: 201 });
});
