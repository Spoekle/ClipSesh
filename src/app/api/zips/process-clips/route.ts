import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { startProcessingJob } from '@/lib/zipProcessing';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin', 'clipteam']);
    if (errorResponse) return errorResponse;

    const { season, year, denyThreshold } = await req.json();

    if (!season || !year) {
      return NextResponse.json(
        { error: 'season and year are required' },
        { status: 400 }
      );
    }

    const jobInfo = await startProcessingJob(season, Number(year), denyThreshold);

    return NextResponse.json({
      success: true,
      message: 'Processing started',
      ...jobInfo,
    });
  } catch (error: any) {
    console.error('Error starting clip processing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
