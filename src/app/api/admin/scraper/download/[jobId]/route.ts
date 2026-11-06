import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDownloadJob, stopDownloadJob, dismissDownloadJob } from '@/lib/discordScraper';

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
      activeClips: job.activeClips,
      concurrency: job.concurrency,
      successCount: job.successCount,
      errorCount: job.errorCount,
      skippedCount: job.skippedCount,
      startTime: job.startTime,
      endTime: job.endTime,
      error: job.error,
      logs: job.logs,
      results: job.results,
    });
  } catch (error: unknown) {
    console.error('Error fetching download job status:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: msg },
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
  } catch (error: unknown) {
    console.error('Error stopping download job:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const dismissed = dismissDownloadJob(jobId);

    return NextResponse.json({
      success: true,
      dismissed,
      message: dismissed ? 'Download job dismissed' : 'Job not found or actively downloading',
    });
  } catch (error: unknown) {
    console.error('Error dismissing download job:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

