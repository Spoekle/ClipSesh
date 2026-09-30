import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import Vote from '@/models/voteModel';
import { getOrCreateVoterToken, attachVoterCookie } from '@/lib/voterToken';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; voteType: string }> }
) {
  try {
    await connectToDatabase();
    const { voterToken } = getOrCreateVoterToken(req);
    const { id, voteType } = await params;

    if (voteType !== 'upvote' && voteType !== 'downvote') {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    const clip = await Clip.findById(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const existingVote = await Vote.findOne({ clipId: id, voterToken });

    if (existingVote) {
      if (existingVote.vote === voteType) {
        // Same vote clicked again => remove vote (toggle off)
        if (voteType === 'upvote') {
          clip.upvotes = Math.max(0, (clip.upvotes || 0) - 1);
        } else {
          clip.downvotes = Math.max(0, (clip.downvotes || 0) - 1);
        }
        await existingVote.deleteOne();
        await clip.save();

        const response = NextResponse.json(clip);
        return attachVoterCookie(response, voterToken);
      } else {
        // Switching vote (upvote -> downvote or downvote -> upvote)
        if (voteType === 'upvote') {
          clip.upvotes = (clip.upvotes || 0) + 1;
          clip.downvotes = Math.max(0, (clip.downvotes || 0) - 1);
        } else {
          clip.downvotes = (clip.downvotes || 0) + 1;
          clip.upvotes = Math.max(0, (clip.upvotes || 0) - 1);
        }
        existingVote.vote = voteType;
        await existingVote.save();
        await clip.save();

        const response = NextResponse.json(clip);
        return attachVoterCookie(response, voterToken);
      }
    }

    // New vote
    if (voteType === 'upvote') {
      clip.upvotes = (clip.upvotes || 0) + 1;
    } else {
      clip.downvotes = (clip.downvotes || 0) + 1;
    }

    const newVote = new Vote({
      clipId: id,
      voterToken,
      vote: voteType,
    });
    await newVote.save();
    await clip.save();

    const response = NextResponse.json(clip);
    return attachVoterCookie(response, voterToken);
  } catch (error: any) {
    console.error('Error voting on clip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
