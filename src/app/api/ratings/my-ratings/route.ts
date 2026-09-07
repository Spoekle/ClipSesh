import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Rating from '@/models/ratingModel';
import Clip from '@/models/clipModel';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, ['clipteam', 'admin']);
    if (errorResponse) return errorResponse;

    const userId = authUser!.id;
    const season = req.nextUrl.searchParams.get('season');
    const year = req.nextUrl.searchParams.get('year');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    const userObjId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjId) {
      return NextResponse.json({
        statistics: {
          totalRatings: 0,
          ratingBreakdown: { '1': 0, '2': 0, '3': 0, '4': 0, deny: 0 },
        },
        ratings: [],
      });
    }

    const ratings = await Rating.find({
      $or: [
        { 'ratings.1.userId': userObjId },
        { 'ratings.2.userId': userObjId },
        { 'ratings.3.userId': userObjId },
        { 'ratings.4.userId': userObjId },
        { 'ratings.deny.userId': userObjId },
      ],
    }).lean();

    const ratedClipIds = ratings.map((r) => r.clipId);
    const clips = await Clip.find(
      { _id: { $in: ratedClipIds } },
      { _id: 1, createdAt: 1, season: 1, year: 1 }
    ).lean();

    const clipsMap: Record<string, any> = {};
    clips.forEach((clip) => {
      clipsMap[clip._id.toString()] = clip;
    });

    const userRatings: any[] = [];

    ratings.forEach((rating) => {
      const clipId = rating.clipId.toString();
      const clip = clipsMap[clipId];

      const ratingCreatedDate = new Date(rating.createdAt);
      const clipDate = clip && clip.createdAt ? new Date(clip.createdAt) : ratingCreatedDate;

      const clipYear = clipDate.getFullYear().toString();
      const clipMonth = clipDate.getMonth();
      const clipDay = clipDate.getDate();

      let clipSeason: string;
      if (
        (clipMonth === 2 && clipDay >= 21) ||
        (clipMonth > 2 && clipMonth < 5) ||
        (clipMonth === 5 && clipDay < 21)
      ) {
        clipSeason = 'spring';
      } else if (
        (clipMonth === 5 && clipDay >= 21) ||
        (clipMonth > 5 && clipMonth < 8) ||
        (clipMonth === 8 && clipDay < 21)
      ) {
        clipSeason = 'summer';
      } else if (
        (clipMonth === 8 && clipDay >= 21) ||
        (clipMonth > 8 && clipMonth < 11) ||
        (clipMonth === 11 && clipDay < 21)
      ) {
        clipSeason = 'fall';
      } else {
        clipSeason = 'winter';
      }

      const ratingsObj = rating.ratings as any;
      Object.keys(ratingsObj || {}).forEach((ratingKey) => {
        const userRating = ratingsObj[ratingKey]?.find(
          (r: any) => r.userId?.toString() === userId.toString()
        );

        if (userRating) {
          if ((season && clipSeason !== season) || (year && clipYear !== year)) {
            return;
          }

          const timestamp = userRating.timestamp || ratingCreatedDate;

          if (startDate || endDate) {
            const ratingDate = new Date(timestamp);
            if (startDate) {
              const start = new Date(startDate);
              start.setHours(0, 0, 0, 0);
              if (ratingDate < start) return;
            }
            if (endDate) {
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              if (ratingDate > end) return;
            }
          }

          userRatings.push({
            clipId: rating.clipId,
            rating: ratingKey === 'deny' ? 'deny' : parseInt(ratingKey, 10),
            timestamp,
            clipMetadata: {
              season: clipSeason,
              year: clipYear,
            },
          });
        }
      });
    });

    const statistics = {
      totalRatings: userRatings.length,
      ratingBreakdown: {
        '1': userRatings.filter((r) => r.rating === 1).length,
        '2': userRatings.filter((r) => r.rating === 2).length,
        '3': userRatings.filter((r) => r.rating === 3).length,
        '4': userRatings.filter((r) => r.rating === 4).length,
        deny: userRatings.filter((r) => r.rating === 'deny').length,
      },
    };

    return NextResponse.json({
      statistics,
      ratings: userRatings,
    });
  } catch (error: any) {
    console.error('Error fetching my-ratings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
