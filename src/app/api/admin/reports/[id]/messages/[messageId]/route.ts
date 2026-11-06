import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { reportMessages } from '@/db/schema';

export const DELETE = authRoute<{ id: string; messageId: string }>(['admin'], async (req, { params }) => {
  const { messageId } = await params;
  const deleted = await db
    .delete(reportMessages)
    .where(eq(reportMessages._id, messageId))
    .returning({ _id: reportMessages._id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Message deleted successfully' });
});
