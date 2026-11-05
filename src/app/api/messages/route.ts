import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { messages } from '@/db/schema';
import { createTeamMessage } from '@/db/queries';
import { wsManager } from '@/lib/WebSocketManager';

export const GET = authRoute(['clipteam', 'editor', 'uploader', 'admin'], async (req) => {
  const clipId = req.nextUrl.searchParams.get('clipId');
  if (!clipId) {
    return NextResponse.json({ error: 'clipId parameter required' }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.clipId, clipId))
    .orderBy(asc(messages.timestamp));
  return NextResponse.json(rows);
});

export const POST = authRoute(['admin', 'clipteam', 'editor', 'uploader'], async (req, { user: authUser }) => {
  const { clipId, message, profilePicture } = await req.json();
  if (!clipId || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'clipId and message are required' }, { status: 400 });
  }

  const newMessage = await createTeamMessage({
    clipId: String(clipId),
    message,
    profilePicture: typeof profilePicture === 'string' ? profilePicture : '',
    author: authUser,
  });

  wsManager.emitNewMessage(newMessage.clipId, newMessage);
  return NextResponse.json(newMessage, { status: 201 });
});
