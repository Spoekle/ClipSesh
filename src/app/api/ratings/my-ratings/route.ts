import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { getRatingActivities } from '@/db/queries';

export const GET = authRoute(['clipteam', 'admin'], async (req, { user: authUser }) => {
  const season = req.nextUrl.searchParams.get('season');
  const year = req.nextUrl.searchParams.get('year');
  const startDate = req.nextUrl.searchParams.get('startDate');
  const endDate = req.nextUrl.searchParams.get('endDate');

  const start = startDate ? new Date(startDate) : null;
  start?.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : null;
  end?.setHours(23, 59, 59, 999);

  const activities = await getRatingActivities({ season, year, userId: authUser.id });
  const userRatings = activities
    .filter(({ timestamp }) => (!start || timestamp >= start) && (!end || timestamp <= end))
    .map(({ clipId, rating, timestamp, clipMetadata }) => ({
      clipId,
      rating,
      timestamp,
      clipMetadata,
    }));

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
});
