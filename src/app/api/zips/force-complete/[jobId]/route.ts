import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { forceCompleteJob } from '@/lib/zipProcessing';

export const POST = authRoute<{ jobId: string }>(['admin'], async (req, { params }) => {
  const { jobId } = await params;
  const job = await forceCompleteJob(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Job manually completed',
    job,
  });
});
