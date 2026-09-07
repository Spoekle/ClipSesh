import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';

export async function GET() {
  try {
    await connectToDatabase();
    const clips = await Clip.find({ archived: { $ne: true } }, 'streamer submitter').lean();

    const streamers = [...new Set(clips.map((clip: any) => clip.streamer).filter(Boolean))].sort();
    const submitters = [...new Set(clips.map((clip: any) => clip.submitter).filter(Boolean))].sort();

    return NextResponse.json({
      streamers,
      submitters,
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
