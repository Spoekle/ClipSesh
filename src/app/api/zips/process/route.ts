import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { startProcessingJob, getAllProcessingJobs, cancelProcessingJob, dismissProcessingJob } from '@/lib/zipProcessing';

export const GET = authRoute(['admin', 'clipteam'], async (req) => {
  const jobs = getAllProcessingJobs();

  return NextResponse.json({
    success: true,
    jobs,
  });
}, { exposeErrors: true });

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

export const DELETE = authRoute(['admin', 'clipteam'], async (req) => {
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
}, { exposeErrors: true });
