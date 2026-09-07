import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import Rating from '@/models/ratingModel';

async function getUserRatedClipIds(userId: string) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return [];
  }
  try {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const ratings = await Rating.find(
      {
        $or: [
          { 'ratings.1.userId': userObjId },
          { 'ratings.2.userId': userObjId },
          { 'ratings.3.userId': userObjId },
          { 'ratings.4.userId': userObjId },
          { 'ratings.deny.userId': userObjId },
        ],
      },
      { clipId: 1 }
    ).lean();
    return ratings.map((r: any) => r.clipId);
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const currentClipId = req.nextUrl.searchParams.get('currentClipId');
    const sort = req.nextUrl.searchParams.get('sort') || 'newest';
    const streamer = req.nextUrl.searchParams.get('streamer');
    const getAdjacent = req.nextUrl.searchParams.get('getAdjacent');
    const excludeRatedByUser = req.nextUrl.searchParams.get('excludeRatedByUser');

    if (!currentClipId || getAdjacent !== 'true') {
      return NextResponse.json({ error: 'Required parameters missing' }, { status: 400 });
    }

    const currentClip = await Clip.findById(currentClipId).lean();
    if (!currentClip) {
      return NextResponse.json({ error: 'Current clip not found' }, { status: 404 });
    }

    const baseQuery: Record<string, any> = { archived: { $ne: true } };
    if (streamer) {
      baseQuery.streamer = { $regex: new RegExp(streamer, 'i') };
    }

    if (excludeRatedByUser) {
      const userRatedClipIds = await getUserRatedClipIds(excludeRatedByUser);
      if (userRatedClipIds.length > 0) {
        baseQuery._id = { $nin: userRatedClipIds };
      }
    }

    let sortField = 'createdAt';
    let sortDirection = -1;

    switch (sort) {
      case 'oldest':
        sortField = 'createdAt';
        sortDirection = 1;
        break;
      case 'highestUpvotes':
        sortField = 'upvotes';
        sortDirection = -1;
        break;
      case 'highestDownvotes':
        sortField = 'downvotes';
        sortDirection = -1;
        break;
      case 'newest':
      default:
        sortField = 'createdAt';
        sortDirection = -1;
        break;
    }

    const prevClipQuery = { ...baseQuery };
    if (sortDirection === -1) {
      prevClipQuery[sortField] = { $gt: (currentClip as any)[sortField] };
    } else {
      prevClipQuery[sortField] = { $lt: (currentClip as any)[sortField] };
    }

    const nextClipQuery = { ...baseQuery };
    if (sortDirection === -1) {
      nextClipQuery[sortField] = { $lt: (currentClip as any)[sortField] };
    } else {
      nextClipQuery[sortField] = { $gt: (currentClip as any)[sortField] };
    }

    const [prevClip, nextClip] = await Promise.all([
      Clip.findOne(prevClipQuery)
        .sort({ [sortField]: -sortDirection as any })
        .select('-comments')
        .lean(),
      Clip.findOne(nextClipQuery)
        .sort({ [sortField]: sortDirection as any })
        .select('-comments')
        .lean(),
    ]);

    return NextResponse.json({
      previous: prevClip,
      next: nextClip,
    });
  } catch (error) {
    console.error('Error fetching adjacent clips:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
