import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import User from '@/models/userModel';
import { hashPassword } from '@/lib/auth';

export const POST = authRoute(['admin'], async (req) => {
  const { username, password, roles, email } = await req.json();

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
    roles: roles || ['user'],
    email,
    status: 'active',
    createdAt: new Date(),
  });

  await newUser.save();
  return NextResponse.json({ message: 'User created successfully' });
});
