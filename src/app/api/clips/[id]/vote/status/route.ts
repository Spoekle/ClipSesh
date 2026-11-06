import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { clips, votes } from '@/db/schema';
import { getOrCreateVoterToken, attachVoterCookie } from '@/lib/voterToken';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { voterToken, isNew } = getOrCreateVoterToken(req);
    const { id } = await params;

    const [clip] = await db.select({ _id: clips._id }).from(clips).where(eq(clips._id, id));
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    // If this is a newly generated voter token, the user has not voted yet
    if (isNew) {
      const response = NextResponse.json({ hasVoted: false });
      return attachVoterCookie(response, voterToken);
    }

    const [existingVote] = await db
      .select({ vote: votes.vote })
      .from(votes)
      .where(and(eq(votes.clipId, id), eq(votes.voterToken, voterToken)));

    const response = NextResponse.json(
      existingVote
        ? { hasVoted: true, voteType: existingVote.vote }
        : { hasVoted: false }
    );

    return attachVoterCookie(response, voterToken);
  } catch (error) {
    console.error('Error checking vote status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
