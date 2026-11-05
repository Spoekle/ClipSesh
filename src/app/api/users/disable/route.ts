import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { users } from '@/db/schema';

export const POST = authRoute(['admin'], async (req) => {
  const { userId } = await req.json();
  const updated = await db
    .update(users)
    .set({ status: 'disabled' })
    .where(eq(users._id, String(userId)))
    .returning({ _id: users._id });
  if (updated.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'User disabled successfully' });
});
