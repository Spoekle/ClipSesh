import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { REPORT_STATUSES, reports } from '@/db/schema';
import { createNotifications } from '@/db/queries';

export const GET = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
  const { id } = await params;
  const [report] = await db.select().from(reports).where(eq(reports._id, id));
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  return NextResponse.json(report);
});

export const PATCH = authRoute<{ id: string }>(['admin'], async (req, { params, user: authUser }) => {
  const { id } = await params;
  const { status: rawStatus, adminNotes } = await req.json();
  const reviewerUsername = authUser.username;

  const [currentReport] = await db.select().from(reports).where(eq(reports._id, id));
  if (!currentReport) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const status = REPORT_STATUSES.find((s) => s === rawStatus);
  if (rawStatus && !status) {
    return NextResponse.json({ error: 'Invalid report status' }, { status: 400 });
  }

  const update: Partial<typeof reports.$inferInsert> = {};
  if (status) {
    update.status = status;
    if (status !== 'pending') {
      update.reviewedBy = reviewerUsername;
      update.reviewedAt = new Date();
    } else {
      update.reviewedBy = null;
      update.reviewedAt = null;
    }
  }

  if (adminNotes !== undefined) {
    update.adminNotes = String(adminNotes);
  }

  const [updatedReport] =
    Object.keys(update).length > 0
      ? await db.update(reports).set(update).where(eq(reports._id, id)).returning()
      : [currentReport];

  if (
    status &&
    status !== currentReport.status &&
    (status === 'resolved' || status === 'dismissed')
  ) {
    try {
      await createNotifications([
        {
          recipientId: updatedReport.reporterId,
          senderId: authUser.id,
          senderUsername: reviewerUsername,
          type: 'report',
          entityId: id,
          clipId: updatedReport.clipId,
          message: `Your report on "${updatedReport.clipTitle}" has been ${status}`,
        },
      ]);
    } catch (notifErr) {
      console.error('Error creating report notification:', notifErr);
    }
  }

  return NextResponse.json(updatedReport);
});

export const DELETE = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
  const { id } = await params;
  const deleted = await db.delete(reports).where(eq(reports._id, id)).returning({ _id: reports._id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Report deleted successfully' });
});
