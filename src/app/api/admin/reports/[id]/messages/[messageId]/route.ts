import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ReportMessage from '@/models/reportMessageModel';
import { requireAuth } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { messageId } = await params;
    const deletedMessage = await ReportMessage.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
