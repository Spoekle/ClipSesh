import { NextResponse } from 'next/server';
import { apiRoute } from '@/lib/route';
import User from '@/models/userModel';
import { hashPassword, signToken } from '@/lib/auth';

export const POST = apiRoute(async (req) => {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 }
    );
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return NextResponse.json(
      { error: 'Username already exists' },
      { status: 400 }
    );
  }

  const hashedPassword = await hashPassword(password);
  const newUser = new User({
    username,
    password: hashedPassword,
    roles: ['user'],
    status: 'active',
  });
  await newUser.save();

  const token = signToken({
    id: newUser._id,
    username: newUser.username,
    roles: newUser.roles,
  });

  return NextResponse.json({ token });
});
