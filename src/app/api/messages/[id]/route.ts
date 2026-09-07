import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Message from '@/models/messageModel';
import { requireAuth } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, ['clipteam', 'admin']);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const message = await Message.findById(id);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const isAdmin = authUser!.roles.includes('admin');
    if (isAdmin || message.userId.toString() === authUser!.id) {
      await message.deleteOne();
      return NextResponse.json({ message: 'Message deleted' });
    }

    return NextResponse.json(
      { error: 'Unauthorized to delete this message' },
      { status: 403 }
    );
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
