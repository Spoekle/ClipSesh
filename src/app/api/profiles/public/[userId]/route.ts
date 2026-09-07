import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import Clip from '@/models/clipModel';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectToDatabase();
    const { userId } = await params;

    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isPublic = user.profile?.isPublic !== false;
    if (!isPublic) {
      return NextResponse.json({ error: 'Profile is private' }, { status: 404 });
    }

    let clipsSubmitted = 0;
    if (user.discordId) {
      clipsSubmitted = await Clip.countDocuments({
        discordSubmitterId: user.discordId,
        archived: { $ne: true },
      });
    }

    const userWithStats = {
      ...user,
      stats: {
        clipsSubmitted,
        joinDate: user.createdAt,
      },
    };

    return NextResponse.json(userWithStats);
  } catch (error: any) {
    console.error('Error fetching public profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
