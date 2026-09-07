import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
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
  } catch (error) {
    console.error('Error in register:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
