import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDownloadJob, stopDownloadJob } from '@/lib/discordScraper';

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

    const job = getDownloadJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Download job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      total: job.total,
      processed: job.processed,
      currentClip: job.currentClip,
      successCount: job.successCount,
      errorCount: job.errorCount,
      skippedCount: job.skippedCount,
      startTime: job.startTime,
      endTime: job.endTime,
      error: job.error,
      logs: job.logs,
      results: job.results,
    });
  } catch (error: any) {
    console.error('Error fetching download job status:', error);
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

    const stopped = stopDownloadJob(jobId);

    return NextResponse.json({
      success: true,
      stopped,
      message: stopped ? 'Download job stopped' : 'Job not running or not found',
    });
  } catch (error: any) {
    console.error('Error stopping download job:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
