import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { apiRoute, authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth';
import { publicUserColumns } from '@/db/queries';

export const GET = apiRoute<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const [user] = await db.select(publicUserColumns).from(users).where(eq(users._id, id));
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json(user);
});

export const PUT = authRoute<{ id: string }>([], async (req, { params, user: authUser }) => {
  const { id } = await params;

  if (authUser.id !== id && !authUser.roles.includes('admin')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const { username, password, discordId, discordUsername, ccId, ccUsername, email } = await req.json();

  const update: Partial<typeof users.$inferInsert> = {};
  if (username) update.username = username;
  if (password) update.password = await hashPassword(password);
  if (discordId !== undefined) update.discordId = discordId || null;
  if (discordUsername !== undefined) update.discordUsername = discordUsername || null;
  if (ccId !== undefined) update.ccId = ccId || null;
  if (ccUsername !== undefined) update.ccUsername = ccUsername || null;
  if (email !== undefined) update.email = email ? String(email).trim().toLowerCase() : null;

  if (Object.keys(update).length > 0) {
    await db.update(users).set(update).where(eq(users._id, id));
  }
  return NextResponse.json({ message: 'User updated successfully' });
});

export const DELETE = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
  const { id } = await params;

  await db.delete(users).where(eq(users._id, id));
  return NextResponse.json({ message: 'User deleted successfully' });
});
