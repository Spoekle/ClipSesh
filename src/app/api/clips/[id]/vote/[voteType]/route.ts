import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import IpVote from '@/models/ipVoteModel';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; voteType: string }> }
) {
  try {
    await connectToDatabase();
    const clientIp = getClientIp(req);
    const { id, voteType } = await params;

    if (voteType !== 'upvote' && voteType !== 'downvote') {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    const clip = await Clip.findById(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const existingVotes = await IpVote.find({ clipId: id });

    for (const vote of existingVotes) {
      if (await bcrypt.compare(clientIp, vote.ip)) {
        if (vote.vote === voteType) {
          // Same vote => remove vote
          if (voteType === 'upvote') {
            clip.upvotes = Math.max(0, clip.upvotes - 1);
          } else {
            clip.downvotes = Math.max(0, clip.downvotes - 1);
          }
          await vote.deleteOne();
          await clip.save();
          return NextResponse.json(clip);
        } else {
          // Switching vote
          if (voteType === 'upvote') {
            clip.upvotes += 1;
            clip.downvotes = Math.max(0, clip.downvotes - 1);
          } else {
            clip.downvotes += 1;
            clip.upvotes = Math.max(0, clip.upvotes - 1);
          }
          vote.vote = voteType;
          await vote.save();
          await clip.save();
          return NextResponse.json(clip);
        }
      }
    }

    // New vote
    const hashedIp = await bcrypt.hash(clientIp, 10);
    if (voteType === 'upvote') {
      clip.upvotes += 1;
    } else {
      clip.downvotes += 1;
    }
    const newVote = new IpVote({ clipId: id, ip: hashedIp, vote: voteType });
    await newVote.save();
    await clip.save();

    return NextResponse.json(clip);
  } catch (error: any) {
    console.error('Error voting on clip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
