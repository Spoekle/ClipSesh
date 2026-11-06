import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth';
import { parseRoles, publicUserColumns } from '@/db/queries';

export const PUT = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();
  const { username, password, roles, status, email } = body;

  const update: Partial<typeof users.$inferInsert> = {};
  if (username) update.username = username;
  if (password) update.password = await hashPassword(password);
  const parsedRoles = parseRoles(roles);
  if (parsedRoles) update.roles = parsedRoles;
  if (status === 'active' || status === 'disabled') update.status = status;
  if (email !== undefined) update.email = email ? String(email).trim().toLowerCase() : null;

  const [updatedUser] =
    Object.keys(update).length > 0
      ? await db.update(users).set(update).where(eq(users._id, id)).returning(publicUserColumns)
      : await db.select(publicUserColumns).from(users).where(eq(users._id, id));
  if (!updatedUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
});
