import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Zip from '@/models/zipModel';
import { requireAuth } from '@/lib/auth';
import { parseSeason } from '@/lib/seasonHelpers';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['clipteam', 'editor', 'admin']);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const season = req.nextUrl.searchParams.get('season');
    const year = req.nextUrl.searchParams.get('year');

    const seasonName = season ? parseSeason(season) : undefined;
    if (!seasonName || !year) {
      return NextResponse.json(
        { error: 'valid season and year parameters required' },
        { status: 400 }
      );
    }

    const zip = await Zip.findOne({
      season: seasonName,
      year: parseInt(year, 10),
    }).sort({ createdAt: -1 });

    if (!zip) {
      return NextResponse.json({ error: 'Zip not found for season/year' }, { status: 404 });
    }

    return NextResponse.json(zip);
  } catch (error: any) {
    console.error('Error fetching season zip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
