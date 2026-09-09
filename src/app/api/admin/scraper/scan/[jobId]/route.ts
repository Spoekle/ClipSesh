import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getScanJob, stopScanJob } from '@/lib/discordScraper';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = getScanJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Scan job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      channelId: job.channelId,
      status: job.status,
      scannedMessages: job.scannedMessages,
      foundClipsCount: job.foundClipsCount,
      error: job.error,
      stats: job.stats,
      clips: job.clips,
      startTime: job.startTime,
      endTime: job.endTime,
    });
  } catch (error: any) {
    console.error('Error fetching scan job status:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const stopped = stopScanJob(jobId);

    return NextResponse.json({
      success: true,
      stopped,
      message: stopped ? 'Scan job stopped' : 'Job not running or not found',
    });
  } catch (error: any) {
    console.error('Error stopping scan job:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
