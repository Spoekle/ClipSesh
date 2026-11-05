import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import Zip from '@/models/zipModel';
import { parseSeason } from '@/lib/seasonHelpers';

export const GET = authRoute(['clipteam', 'editor', 'admin'], async (req) => {
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
});
