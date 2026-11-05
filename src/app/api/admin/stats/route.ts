import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import User from '@/models/userModel';
import Clip from '@/models/clipModel';
import Rating from '@/models/ratingModel';

export const GET = authRoute(['admin'], async (req) => {
  const [userCount, activeUserCount, clipCount, ratedClipsCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    Clip.countDocuments({ archived: { $ne: true } }),
    Rating.countDocuments(),
  ]);

  return NextResponse.json({
    userCount,
    activeUserCount,
    clipCount,
    ratedClipsCount,
    deniedClipsCount: 0,
  });
});
