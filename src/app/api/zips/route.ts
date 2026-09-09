import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Zip from '@/models/zipModel';
import { requireAuth } from '@/lib/auth';
import { compareSeasonYear } from '@/lib/seasonHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['clipteam', 'editor', 'uploader', 'admin']);
    if (errorResponse) return errorResponse;

    const zips = await Zip.find().lean();
    zips.sort(compareSeasonYear);
    return NextResponse.json(zips);
  } catch (error: any) {
    console.error('Error fetching zips:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
