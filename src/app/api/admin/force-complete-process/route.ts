import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { forceCompleteJob } from '@/lib/zipProcessing';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { jobId } = await req.json();
    const job = await forceCompleteJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Job manually completed',
      job,
    });
  } catch (error: any) {
    console.error('Error force-completing job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
