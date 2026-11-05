import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import Zip from '@/models/zipModel';
import { compareSeasonYear } from '@/lib/seasonHelpers';

export const GET = authRoute(['clipteam', 'editor', 'admin'], async (req) => {
  const zips = await Zip.find().lean();
  zips.sort(compareSeasonYear);
  return NextResponse.json(zips);
});
