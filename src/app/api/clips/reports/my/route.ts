import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Report from '@/models/reportModel';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, [
      'user',
      'clipteam',
      'editor',
      'admin',
    ]);
    if (errorResponse) return errorResponse;

    const reports = await Report.find({ reporterId: authUser!.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
