import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Rating from '@/models/ratingModel';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['clipteam', 'admin']);
    if (errorResponse) return errorResponse;

    const { id: clipId } = await params;

    let ratingDoc = await Rating.findOne({ clipId });
    if (!ratingDoc) {
      ratingDoc = new Rating({
        clipId,
        ratings: {
          '1': [],
          '2': [],
          '3': [],
          '4': [],
          'deny': [],
        },
      });
      await ratingDoc.save();
    }

    const ratingCounts = Object.keys(ratingDoc.ratings).map((ratingKey) => ({
      rating: ratingKey,
      count: (ratingDoc!.ratings as any)[ratingKey]?.length || 0,
      users: (ratingDoc!.ratings as any)[ratingKey] || [],
    }));

    const totalRatings = ratingCounts.reduce((acc, curr) => acc + curr.count, 0);

    return NextResponse.json({
      clipId,
      totalRatings,
      ratingCounts,
    });
  } catch (error: any) {
    console.error('Error fetching clip rating:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, ['clipteam', 'admin']);
    if (errorResponse) return errorResponse;

    const { id: clipId } = await params;
    const { rating, deny } = await req.json();
    const userId = authUser!.id;
    const username = authUser!.username;

    if (
      (rating && (rating < 1 || rating > 4)) ||
      (deny !== undefined && typeof deny !== 'boolean')
    ) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    let ratingDoc = await Rating.findOne({ clipId });
    if (!ratingDoc) {
      ratingDoc = new Rating({
        clipId,
        ratings: { '1': [], '2': [], '3': [], '4': [], deny: [] },
      });
    }

    let message = 'Rating updated successfully';
    const ratingsObj = ratingDoc.ratings as any;

    if (rating !== undefined) {
      const key = String(rating);
      const alreadyRated = ratingsObj[key]?.some((r: any) => r.userId?.toString() === userId);

      ['1', '2', '3', '4', 'deny'].forEach((k) => {
        ratingsObj[k] = ratingsObj[k].filter((r: any) => r.userId?.toString() !== userId);
      });

      if (alreadyRated) {
        message = 'Rating removed successfully';
      } else {
        ratingsObj[key].push({
          userId,
          username,
          timestamp: new Date(),
        });
      }
    } else if (deny) {
      const alreadyDenied = ratingsObj['deny']?.some((r: any) => r.userId?.toString() === userId);

      ['1', '2', '3', '4', 'deny'].forEach((k) => {
        ratingsObj[k] = ratingsObj[k].filter((r: any) => r.userId?.toString() !== userId);
      });

      if (alreadyDenied) {
        message = 'Deny removed successfully';
      } else {
        ratingsObj['deny'].push({
          userId,
          username,
          timestamp: new Date(),
        });
      }
    }

    await ratingDoc.save();
    return new NextResponse(message);
  } catch (error: any) {
    console.error('Error updating clip rating:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
