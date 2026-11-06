import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth';
import { parseRoles } from '@/db/queries';

export const POST = authRoute(['admin'], async (req) => {
  const { username, password, roles, email } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 }
    );
  }

  const [existingUser] = await db.select({ _id: users._id }).from(users).where(eq(users.username, username));
  if (existingUser) {
    return NextResponse.json(
      { error: 'Username already exists' },
      { status: 400 }
    );
  }

  await db.insert(users).values({
    username,
    password: await hashPassword(password),
    roles: parseRoles(roles) ?? ['user'],
    email: typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null,
    status: 'active',
  });
  return NextResponse.json({ message: 'User created successfully' });
});
