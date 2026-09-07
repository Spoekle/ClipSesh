import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { username, password, roles, status, email } = body;

    const updateData: Record<string, any> = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await hashPassword(password);
    if (roles) updateData.roles = roles;
    if (status) updateData.status = status;
    if (email !== undefined) updateData.email = email;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user in admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
