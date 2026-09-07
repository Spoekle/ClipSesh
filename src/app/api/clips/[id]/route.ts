import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import { PublicConfig } from '@/models/configModel';
import { requireAuth } from '@/lib/auth';

import Rating from '@/models/ratingModel';
import IpVote from '@/models/ipVoteModel';
import Message from '@/models/messageModel';
import Report from '@/models/reportModel';

async function updateClipCount(): Promise<number> {
  try {
    const count = await Clip.countDocuments({ archived: { $ne: true } });
    await PublicConfig.findOneAndUpdate(
      {},
      { clipAmount: count },
      { upsert: true, new: true }
    );
    return count;
  } catch {
    return 0;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const clip = await Clip.findById(id).lean();
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }
    return NextResponse.json(clip);
  } catch (error) {
    console.error('Error fetching clip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['uploader', 'admin']);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const clip = await Clip.findById(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const body = await req.json();
    const { streamer, submitter, title, discordSubmitterId, link, archived, season, year } = body;

    if (streamer !== undefined) clip.streamer = streamer;
    if (submitter !== undefined) clip.submitter = submitter;
    if (title !== undefined) clip.title = title;
    if (discordSubmitterId !== undefined) clip.discordSubmitterId = discordSubmitterId;
    if (link !== undefined) clip.link = link;
    if (season !== undefined) clip.season = season;
    if (year !== undefined) clip.year = year;

    if (archived !== undefined) {
      clip.archived = archived;
      if (archived && !clip.archivedAt) {
        clip.archivedAt = new Date();
      } else if (!archived) {
        clip.archivedAt = undefined;
      }
    }

    await clip.save();
    await updateClipCount();

    return NextResponse.json({ message: 'Clip updated successfully', clip });
  } catch (error) {
    console.error('Error updating clip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const clip = await Clip.findById(id);
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

    await Promise.all([
      clip.deleteOne(),
      Rating.deleteMany({ clipId: id }),
      IpVote.deleteMany({ clipId: id }),
      Message.deleteMany({ clipId: id }),
      Report.deleteMany({ clipId: id }),
    ]);
    await updateClipCount();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting clip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
