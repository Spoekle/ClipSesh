import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const user = await User.findById(id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user by id:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { user: authUser, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    if (authUser!.id !== id && !authUser!.roles.includes('admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { username, password, discordId, discordUsername, email } = await req.json();

    const updateData: Record<string, any> = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await hashPassword(password);
    if (discordId !== undefined) updateData.discordId = discordId;
    if (discordUsername !== undefined) updateData.discordUsername = discordUsername;
    if (email !== undefined) updateData.email = email;

    await User.findByIdAndUpdate(id, updateData);
    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
