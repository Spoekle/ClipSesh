import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import ReportMessage from '@/models/reportMessageModel';

export const DELETE = authRoute<{ id: string; messageId: string }>(['admin'], async (req, { params }) => {
  const { messageId } = await params;
  const deletedMessage = await ReportMessage.findByIdAndDelete(messageId);

  if (!deletedMessage) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Message deleted successfully' });
});
