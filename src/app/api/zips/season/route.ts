import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { zips } from '@/db/schema';
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

  const [zip] = await db
    .select()
    .from(zips)
    .where(and(eq(zips.season, seasonName), eq(zips.year, parseInt(year, 10))))
    .orderBy(desc(zips.createdAt))
    .limit(1);

  if (!zip) {
    return NextResponse.json({ error: 'Zip not found for season/year' }, { status: 404 });
  }

  return NextResponse.json(zip);
});
