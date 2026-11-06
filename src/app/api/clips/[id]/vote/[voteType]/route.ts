import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { clips, votes } from '@/db/schema';
import { getClipWithComments } from '@/db/queries';
import { getOrCreateVoterToken, attachVoterCookie } from '@/lib/voterToken';

type Tally = 'upvotes' | 'downvotes';

const plusOne = (tally: Tally): SQL => sql`${clips[tally]} + 1`;
const minusOne = (tally: Tally): SQL => sql`greatest(${clips[tally]} - 1, 0)`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; voteType: string }> }
) {
  try {
    const { voterToken } = getOrCreateVoterToken(req);
    const { id, voteType } = await params;

    if (voteType !== 'upvote' && voteType !== 'downvote') {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    const found = await db.transaction(async (tx) => {
      // Lock the clip row so concurrent votes from the same token can't double-count.
      const [clip] = await tx
        .select({ _id: clips._id })
        .from(clips)
        .where(eq(clips._id, id))
        .for('update');
      if (!clip) return false;

      const voteFilter = and(eq(votes.clipId, id), eq(votes.voterToken, voterToken));
      const [existingVote] = await tx.select().from(votes).where(voteFilter);
      const same: Tally = voteType === 'upvote' ? 'upvotes' : 'downvotes';
      const other: Tally = voteType === 'upvote' ? 'downvotes' : 'upvotes';

      if (existingVote?.vote === voteType) {
        // Same vote clicked again => remove vote (toggle off)
        await tx.delete(votes).where(voteFilter);
        await tx.update(clips).set({ [same]: minusOne(same) }).where(eq(clips._id, id));
      } else if (existingVote) {
        // Switching vote (upvote -> downvote or downvote -> upvote)
        await tx.update(votes).set({ vote: voteType }).where(voteFilter);
        await tx
          .update(clips)
          .set({ [same]: plusOne(same), [other]: minusOne(other) })
          .where(eq(clips._id, id));
      } else {
        await tx.insert(votes).values({ clipId: id, voterToken, vote: voteType });
        await tx.update(clips).set({ [same]: plusOne(same) }).where(eq(clips._id, id));
      }
      return true;
    });

    if (!found) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const response = NextResponse.json(await getClipWithComments(id));
    return attachVoterCookie(response, voterToken);
  } catch (error) {
    console.error('Error voting on clip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
