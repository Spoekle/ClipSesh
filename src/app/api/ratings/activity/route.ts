import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Rating from '@/models/ratingModel';
import Clip from '@/models/clipModel';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const season = req.nextUrl.searchParams.get('season');
    const year = req.nextUrl.searchParams.get('year');

    const clipFilter: Record<string, any> = {};
    if (season) clipFilter.season = { $regex: new RegExp(`^${season}$`, 'i') };
    if (year) clipFilter.year = parseInt(year, 10);

    let clips: any[] = [];
    let ratings: any[] = [];

    if (season || year) {
      clips = await Clip.find(clipFilter, { _id: 1, createdAt: 1, season: 1, year: 1 }).lean();
      const clipIds = clips.map((c) => c._id);
      ratings = await Rating.find({ clipId: { $in: clipIds } }).lean();
    } else {
      [ratings, clips] = await Promise.all([
        Rating.find().lean(),
        Clip.find({}, { _id: 1, createdAt: 1, season: 1, year: 1 }).lean(),
      ]);
    }

    const clipsMap: Record<string, any> = {};
    clips.forEach((clip) => {
      clipsMap[clip._id.toString()] = clip;
    });

    const allActivities: any[] = [];

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

      if ((season && clipSeason !== season) || (year && clipYear !== year)) {
        return;
      }

      const ratingsObj = rating.ratings as any;
      Object.keys(ratingsObj || {}).forEach((ratingKey) => {
        ratingsObj[ratingKey]?.forEach((userRating: any) => {
          const userId = userRating.userId?.toString();
          if (!userId) return;
          const username = userRating.username || 'Unknown';
          const timestamp = userRating.timestamp || ratingCreatedDate;

          allActivities.push({
            userId,
            username,
            clipId: rating.clipId,
            rating: ratingKey === 'deny' ? 'deny' : parseInt(ratingKey, 10),
            timestamp,
            clipMetadata: {
              season: clipSeason,
              year: clipYear,
            },
          });
        });
      });
    });

    const userActivities: Record<string, any> = {};
    allActivities.forEach((activity) => {
      if (!userActivities[activity.userId]) {
        userActivities[activity.userId] = {
          userId: activity.userId,
          username: activity.username,
          totalRatings: 0,
          ratings: [],
        };
      }
      userActivities[activity.userId].ratings.push({
        clipId: activity.clipId,
        rating: activity.rating,
        timestamp: activity.timestamp,
        clipMetadata: activity.clipMetadata,
      });
      userActivities[activity.userId].totalRatings++;
    });

    const sortedUserActivities = Object.values(userActivities).sort(
      (a: any, b: any) => b.totalRatings - a.totalRatings
    );

    return NextResponse.json(sortedUserActivities);
  } catch (error: any) {
    console.error('Error fetching activity data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
