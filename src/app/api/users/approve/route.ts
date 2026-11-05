import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import User from '@/models/userModel';

export const POST = authRoute(['admin'], async (req) => {
  const { userId } = await req.json();
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  user.status = 'active';
  await user.save();

  return NextResponse.json({ message: 'User approved successfully' });
});
