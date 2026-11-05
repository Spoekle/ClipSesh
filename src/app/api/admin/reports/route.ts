import { NextResponse } from 'next/server';
import { count, desc, eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { REPORT_STATUSES, reports } from '@/db/schema';

export const GET = authRoute(['admin'], async (req) => {
  const statusParam = req.nextUrl.searchParams.get('status');
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10) || 20);

  const status = REPORT_STATUSES.find((s) => s === statusParam);
  const where = status ? eq(reports.status, status) : undefined;

  const [rows, [{ total }], [{ pendingCount }]] = await Promise.all([
    db
      .select()
      .from(reports)
      .where(where)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(reports).where(where),
    db.select({ pendingCount: count() }).from(reports).where(eq(reports.status, 'pending')),
  ]);

  return NextResponse.json({
    reports: rows,
    total,
    page,
    pages: Math.ceil(total / limit),
    pendingCount,
  });
});
