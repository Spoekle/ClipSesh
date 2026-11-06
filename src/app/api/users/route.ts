import { NextResponse } from 'next/server';
import { ne } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { publicUserColumns } from '@/db/queries';

export const GET = authRoute(['admin'], async () => {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const rows = await db
    .select(publicUserColumns)
    .from(users)
    .where(ne(users.username, adminUsername));
  return NextResponse.json(rows);
});
