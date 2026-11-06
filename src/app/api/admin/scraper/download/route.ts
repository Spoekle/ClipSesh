import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { startScraperDownload, getAllDownloadJobs, ScrapedClipItem } from '@/lib/discordScraper';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const jobs = getAllDownloadJobs();

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error: unknown) {
    console.error('Error fetching all scraper download jobs:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const { clips, concurrency } = body;

    if (!Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json(
        { error: 'clips array is required and cannot be empty' },
        { status: 400 }
      );
    }

    const parsedConcurrency =
      typeof concurrency === 'number' && Number.isFinite(concurrency) && concurrency > 0
        ? Math.min(Math.max(1, Math.floor(concurrency)), 10)
        : 3;

    const job = startScraperDownload(clips as ScrapedClipItem[], parsedConcurrency);

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      total: job.total,
      concurrency: job.concurrency,
      status: job.status,
      message: `Download job started (${job.concurrency} concurrent tasks)`,
    });
  } catch (error: unknown) {
    console.error('Error starting scraper download job:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
