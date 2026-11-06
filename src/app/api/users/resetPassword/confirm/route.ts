import { NextResponse } from 'next/server';
import { apiRoute } from '@/lib/route';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { verifyAuthToken, hashPassword } from '@/lib/auth';

export const POST = apiRoute(async (req) => {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: 'Token and new password are required.' },
      { status: 400 }
    );
  }

  const decoded = verifyAuthToken(token);
  if (!decoded || !decoded.id) {
    return NextResponse.json(
      { error: 'Invalid or expired token.' },
      { status: 400 }
    );
  }

  const updated = await db
    .update(users)
    .set({ password: await hashPassword(password) })
    .where(eq(users._id, decoded.id))
    .returning({ _id: users._id });
  if (updated.length === 0) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Password has been reset successfully. Redirecting...',
  });
});
