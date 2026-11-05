import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import User from '@/models/userModel';
import { hashPassword } from '@/lib/auth';

export const PUT = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
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
});
