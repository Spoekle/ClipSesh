import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import Report from '@/models/reportModel';

export const GET = authRoute(['admin'], async (req) => {
  const status = req.nextUrl.searchParams.get('status');
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  const [reports, total, pendingCount] = await Promise.all([
    Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Report.countDocuments(query),
    Report.countDocuments({ status: 'pending' }),
  ]);

  const pages = Math.ceil(total / limit);

  return NextResponse.json({
    reports,
    total,
    page,
    pages,
    pendingCount,
  });
});
