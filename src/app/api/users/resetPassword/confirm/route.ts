import { NextResponse } from 'next/server';
import { apiRoute } from '@/lib/route';
import User from '@/models/userModel';
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

  const user = await User.findById(decoded.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  user.password = await hashPassword(password);
  await user.save();

  return NextResponse.json({
    success: true,
    message: 'Password has been reset successfully. Redirecting...',
  });
});
