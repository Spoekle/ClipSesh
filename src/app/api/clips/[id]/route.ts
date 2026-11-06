import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { eq } from 'drizzle-orm';
import { apiRoute, authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { clipRatings, clips, messages, reports, type NewClipRow } from '@/db/schema';
import { getClipWithComments, refreshClipCount } from '@/db/queries';
import { parseSeason } from '@/lib/seasonHelpers';

export const GET = apiRoute<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const clip = await getClipWithComments(id);
  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }
  return NextResponse.json(clip);
});

export const PUT = authRoute<{ id: string }>(['uploader', 'admin'], async (req, { params }) => {
  const { id } = await params;
  const [clip] = await db.select().from(clips).where(eq(clips._id, id));
  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }

  const body = await req.json();
  const { streamer, submitter, title, discordSubmitterId, link, archived, season, year } = body;

  const update: Partial<NewClipRow> = {};
  if (streamer !== undefined) update.streamer = streamer;
  if (submitter !== undefined) update.submitter = submitter;
  if (title !== undefined) update.title = title;
  if (discordSubmitterId !== undefined) update.discordSubmitterId = discordSubmitterId;
  if (link !== undefined) update.link = link;
  if (season !== undefined) update.season = season ? parseSeason(String(season)) ?? null : null;
  if (year !== undefined) update.year = year === null || year === '' ? null : Number(year);

  if (archived !== undefined) {
    update.archived = Boolean(archived);
    if (archived && !clip.archivedAt) {
      update.archivedAt = new Date();
    } else if (!archived) {
      update.archivedAt = null;
    }
  }

  const [updated] = await db.update(clips).set(update).where(eq(clips._id, id)).returning();
  await refreshClipCount();

  return NextResponse.json({ message: 'Clip updated successfully', clip: updated });
});

export const DELETE = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
  const { id } = await params;
  const [clip] = await db.select().from(clips).where(eq(clips._id, id));
  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }

  try {
    const uploadsBaseDir = path.join(process.cwd(), 'uploads');
    let filePath: string;

    if (clip.url.includes('uploads/')) {
      const urlPath = clip.url.split('uploads/')[1];
      filePath = path.join(uploadsBaseDir, urlPath);
    } else {
      filePath = path.join(uploadsBaseDir, path.basename(clip.url));
    }

    const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumbnail.png');

    await Promise.allSettled([
      fs.promises.unlink(filePath),
      fs.promises.unlink(thumbnailPath)
    ]);
  } catch (err) {
    console.warn('Error removing clip files:', err);
  }

  // Comments, replies, votes and views cascade with the clip row.
  await db.transaction(async (tx) => {
    await tx.delete(clipRatings).where(eq(clipRatings.clipId, id));
    await tx.delete(messages).where(eq(messages.clipId, id));
    await tx.delete(reports).where(eq(reports.clipId, id));
    await tx.delete(clips).where(eq(clips._id, id));
  });
  await refreshClipCount();

  return NextResponse.json({ success: true });
});
