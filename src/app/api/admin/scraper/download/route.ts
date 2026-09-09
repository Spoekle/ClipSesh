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
  } catch (error: any) {
    console.error('Error fetching all scraper download jobs:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const { clips } = body;

    if (!Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json(
        { error: 'clips array is required and cannot be empty' },
        { status: 400 }
      );
    }

    const job = startScraperDownload(clips as ScrapedClipItem[]);

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      total: job.total,
      status: job.status,
      message: 'Download job started',
    });
  } catch (error: any) {
    console.error('Error starting scraper download job:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
