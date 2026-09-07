import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import Clip from '@/models/clipModel';
import Rating from '@/models/ratingModel';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

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
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
