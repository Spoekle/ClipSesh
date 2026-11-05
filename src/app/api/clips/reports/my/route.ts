import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import Report from '@/models/reportModel';

export const GET = authRoute(['user', 'clipteam', 'editor', 'admin'], async (req, { user: authUser }) => {
  const reports = await Report.find({ reporterId: authUser.id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(reports);
});
