import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute, ANY_ROLE } from '@/lib/route';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { publicUserColumns } from '@/db/queries';

export const GET = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const [user] = await db.select(publicUserColumns).from(users).where(eq(users._id, authUser.id));
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
});
