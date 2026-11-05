import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { getJobStatus } from '@/lib/zipProcessing';

export const GET = authRoute<{ jobId: string }>(['clipteam', 'admin'], async (req, { params }) => {
  const { jobId } = await params;
  const status = getJobStatus(jobId);

  if (!status) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(status);
});
