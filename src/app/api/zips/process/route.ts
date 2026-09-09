import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { startProcessingJob, getAllProcessingJobs, cancelProcessingJob } from '@/lib/zipProcessing';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin', 'clipteam']);
    if (errorResponse) return errorResponse;

    const jobs = getAllProcessingJobs();

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error: any) {
    console.error('Error fetching all processing jobs:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin', 'clipteam']);
    if (errorResponse) return errorResponse;

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
  } catch (error: any) {
    console.error('Error starting clip processing:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin', 'clipteam']);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter is required' },
        { status: 400 }
      );
    }

    const cancelled = await cancelProcessingJob(jobId);

    return NextResponse.json({
      success: true,
      cancelled,
      message: cancelled ? 'Job cancelled successfully' : 'Job not found or already finished',
    });
  } catch (error: any) {
    console.error('Error cancelling processing job:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
