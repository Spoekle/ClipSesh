import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { startProcessingJob, getAllProcessingJobs, cancelProcessingJob, dismissProcessingJob } from '@/lib/zipProcessing';

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
    const action = searchParams.get('action');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter is required' },
        { status: 400 }
      );
    }

    if (action === 'dismiss') {
      const dismissed = dismissProcessingJob(jobId);
      return NextResponse.json({
        success: true,
        dismissed,
        message: dismissed ? 'Job dismissed successfully' : 'Job not found or actively processing',
      });
    }

    const cancelled = await cancelProcessingJob(jobId);
    if (!cancelled) {
      // If it wasn't actively processing, dismiss/remove from memory
      const dismissed = dismissProcessingJob(jobId);
      return NextResponse.json({
        success: true,
        dismissed,
        cancelled: false,
        message: dismissed ? 'Finished job dismissed' : 'Job not found or could not be cancelled',
      });
    }

    return NextResponse.json({
      success: true,
      cancelled,
      message: 'Job cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling or dismissing processing job:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
