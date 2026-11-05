import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { clips } from '@/db/schema';

export async function GET() {
  try {
    const [streamerRows, submitterRows] = await Promise.all([
      db
        .selectDistinct({ value: clips.streamer })
        .from(clips)
        .where(eq(clips.archived, false)),
      db
        .selectDistinct({ value: clips.submitter })
        .from(clips)
        .where(eq(clips.archived, false)),
    ]);

    return NextResponse.json({
      streamers: streamerRows.map((r) => r.value).filter(Boolean).sort(),
      submitters: submitterRows.map((r) => r.value).filter(Boolean).sort(),
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
