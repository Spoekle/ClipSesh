import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { clips, reports } from '@/db/schema';
import { createNotifications, getUserIdsWithRoles } from '@/db/queries';

export const POST = authRoute<{ id: string }>(['clipteam', 'editor', 'admin'], async (req, { params, user: authUser }) => {
  const { id } = await params;
  const { reason } = await req.json();

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return NextResponse.json({ error: 'Report reason is required' }, { status: 400 });
  }

  const [clip] = await db.select().from(clips).where(eq(clips._id, id));
  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }

  const [existingReport] = await db
    .select({ _id: reports._id })
    .from(reports)
    .where(and(eq(reports.clipId, id), eq(reports.reporterId, authUser.id)));

  if (existingReport) {
    return NextResponse.json({ error: 'You have already reported this clip' }, { status: 400 });
  }

  const [report] = await db
    .insert(reports)
    .values({
      clipId: id,
      clipTitle: clip.title,
      clipStreamer: clip.streamer,
      clipSubmitter: clip.submitter,
      reporterId: authUser.id,
      reporterUsername: authUser.username,
      reason: reason.trim(),
    })
    .returning();

  const adminIds = await getUserIdsWithRoles(['admin']);
  await createNotifications(
    adminIds.map((recipientId) => ({
      recipientId,
      senderId: authUser.id,
      senderUsername: authUser.username,
      type: 'report' as const,
      clipId: id,
      message: `${authUser.username} reported a clip: "${clip.title}" by ${clip.streamer}`,
      entityId: report._id,
    }))
  );

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
});
