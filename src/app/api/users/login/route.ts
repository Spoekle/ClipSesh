import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import { comparePassword, signToken } from '@/lib/auth';

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

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 400 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const isPasswordValid = await comparePassword(password, user.password || '');
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 400 }
      );
    }

    const token = signToken({
      id: user._id,
      username: user.username,
      roles: user.roles,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
