import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import Vote from '@/models/voteModel';
import { getOrCreateVoterToken, attachVoterCookie } from '@/lib/voterToken';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { voterToken, isNew } = getOrCreateVoterToken(req);
    const { id } = await params;

    const clip = await Clip.findById(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    // If this is a newly generated voter token, the user has not voted yet
    if (isNew) {
      const response = NextResponse.json({ hasVoted: false });
      return attachVoterCookie(response, voterToken);
    }

    const existingVote = await Vote.findOne({ clipId: id, voterToken }).lean();

    const response = NextResponse.json(
      existingVote
        ? { hasVoted: true, voteType: existingVote.vote }
        : { hasVoted: false }
    );

    return attachVoterCookie(response, voterToken);
  } catch (error: any) {
    console.error('Error checking vote status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
