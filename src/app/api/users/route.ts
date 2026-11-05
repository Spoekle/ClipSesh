import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import User from '@/models/userModel';

export const GET = authRoute(['admin'], async (req) => {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const users = await User.find({ username: { $ne: adminUsername } }).select('-password').lean();
  return NextResponse.json(users);
});
