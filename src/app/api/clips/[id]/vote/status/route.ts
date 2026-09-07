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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const clientIp = getClientIp(req);
    const { id } = await params;

    const clip = await Clip.findById(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const existingVotes = await IpVote.find({ clipId: id }).lean();

    for (const vote of existingVotes) {
      if (await bcrypt.compare(clientIp, vote.ip)) {
        return NextResponse.json({ hasVoted: true, voteType: vote.vote });
      }
    }

    return NextResponse.json({ hasVoted: false });
  } catch (error: any) {
    console.error('Error checking vote status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
