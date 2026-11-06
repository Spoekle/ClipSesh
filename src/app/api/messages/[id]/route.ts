import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { deleteTeamMessage } from '@/db/queries';
import { wsManager } from '@/lib/WebSocketManager';

export const DELETE = authRoute<{ id: string }>(['clipteam', 'admin'], async (req, { params, user: authUser }) => {
  const { id } = await params;
  const result = await deleteTeamMessage(id, authUser);

  if (result === 'not_found') {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }
  if (result === 'forbidden') {
    return NextResponse.json(
      { error: 'Unauthorized to delete this message' },
      { status: 403 }
    );
  }

  wsManager.emitMessageDeleted(result.clipId, id);
  return NextResponse.json({ message: 'Message deleted' });
});
