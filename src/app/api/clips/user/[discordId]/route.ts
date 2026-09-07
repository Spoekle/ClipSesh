import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ discordId: string }> }
) {
  try {
    await connectToDatabase();
    const { discordId } = await params;
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const query = {
      discordSubmitterId: discordId,
      archived: { $ne: true },
    };

    const [clips, totalClips] = await Promise.all([
      Clip.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Clip.countDocuments(query),
    ]);

    return NextResponse.json({
      clips,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalClips / limit),
        totalClips,
        hasNextPage: page < Math.ceil(totalClips / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching clips for discord user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
