import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { startProcessingJob } from '@/lib/zipProcessing';

export const POST = authRoute(['admin', 'clipteam'], async (req) => {
  const body = await req.json().catch(() => ({}));
  const { season, year, denyThreshold, clips } = body;

  if (!season || !year) {
    return NextResponse.json(
      { error: 'season and year are required' },
      { status: 400 }
    );
  }

  const jobInfo = await startProcessingJob(
    season,
    Number(year),
    denyThreshold,
    clips
  );

  return NextResponse.json({
    success: true,
    message: 'Processing started',
    ...jobInfo,
  });
}, { exposeErrors: true });
