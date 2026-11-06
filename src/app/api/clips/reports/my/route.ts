import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { reports } from '@/db/schema';

export const GET = authRoute(['user', 'clipteam', 'editor', 'admin'], async (req, { user: authUser }) => {
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.reporterId, authUser.id))
    .orderBy(desc(reports.createdAt));

  return NextResponse.json(rows);
});
