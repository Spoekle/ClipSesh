import { NextResponse } from 'next/server';
import { authRoute, ANY_ROLE } from '@/lib/route';
import User from '@/models/userModel';

export const GET = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const user = await User.findById(authUser.id).select('-password');
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
});
