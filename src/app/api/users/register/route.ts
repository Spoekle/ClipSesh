import { NextResponse } from 'next/server';
import { apiRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { hashPassword, signToken } from '@/lib/auth';

export const POST = apiRoute(async (req) => {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 }
    );
  }

  const [newUser] = await db
    .insert(users)
    .values({
      username,
      password: await hashPassword(password),
      roles: ['user'],
      status: 'active',
    })
    .onConflictDoNothing({ target: users.username })
    .returning();
  if (!newUser) {
    return NextResponse.json(
      { error: 'Username already exists' },
      { status: 400 }
    );
  }

  const token = signToken({
    id: newUser._id,
    username: newUser.username,
    roles: newUser.roles,
  });

  return NextResponse.json({ token });
});
