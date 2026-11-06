import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { getRatingActivities, groupRatingActivitiesByUser } from '@/db/queries';

export const GET = authRoute(['admin'], async (req) => {
  const season = req.nextUrl.searchParams.get('season');
  const year = req.nextUrl.searchParams.get('year');

  const activities = await getRatingActivities({ season, year });
  return NextResponse.json(groupRatingActivitiesByUser(activities));
});
