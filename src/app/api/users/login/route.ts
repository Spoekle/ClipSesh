import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { apiRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { comparePassword, signToken } from '@/lib/auth';

export const POST = apiRoute(async (req) => {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 }
    );
  }

  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 400 }
    );
  }

  if (user.status !== 'active') {
    return NextResponse.json({ error: 'Account not active' }, { status: 403 });
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 400 }
    );
  }

  const token = signToken({
    id: user._id,
    username: user.username,
    roles: user.roles,
  });

  return NextResponse.json({ token });
});
