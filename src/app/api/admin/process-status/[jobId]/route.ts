import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getJobStatus } from '@/lib/zipProcessing';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { errorResponse } = requireAuth(req, ['clipteam', 'admin']);
    if (errorResponse) return errorResponse;

    const { jobId } = await params;
    const status = getJobStatus(jobId);

    if (!status) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error getting job status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
