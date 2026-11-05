import { NextResponse } from 'next/server';
import { apiRoute, authRoute } from '@/lib/route';
import User from '@/models/userModel';
import { hashPassword } from '@/lib/auth';

export const GET = apiRoute<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const user = await User.findById(id).select('-password');
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json(user);
});

export const PUT = authRoute<{ id: string }>([], async (req, { params, user: authUser }) => {
  const { id } = await params;
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.id !== id && !authUser.roles.includes('admin')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const { username, password, discordId, discordUsername, ccId, ccUsername, email } = await req.json();

  const updateData: Record<string, unknown> = {};
  if (username) updateData.username = username;
  if (password) updateData.password = await hashPassword(password);
  if (discordId !== undefined) updateData.discordId = discordId;
  if (discordUsername !== undefined) updateData.discordUsername = discordUsername;
  if (ccId !== undefined) updateData.ccId = ccId;
  if (ccUsername !== undefined) updateData.ccUsername = ccUsername;
  if (email !== undefined) updateData.email = email;

  await User.findByIdAndUpdate(id, updateData);
  return NextResponse.json({ message: 'User updated successfully' });
});

export const DELETE = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
  const { id } = await params;

  await User.findByIdAndDelete(id);
  return NextResponse.json({ message: 'User deleted successfully' });
});
