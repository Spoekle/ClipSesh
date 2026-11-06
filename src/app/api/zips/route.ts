import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { zips } from '@/db/schema';
import { compareSeasonYear } from '@/lib/seasonHelpers';

export const GET = authRoute(['clipteam', 'editor', 'admin'], async () => {
  const rows = await db.select().from(zips);
  rows.sort(compareSeasonYear);
  return NextResponse.json(rows);
});
