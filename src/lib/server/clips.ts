import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { clips, type ClipRow } from '@/db/schema';
import { getClipWithComments, getPublicConfig, type ClipWithComments } from '@/db/queries';
import { isValidId } from '@/lib/ids';
import { Clip as ClipType } from '@/types/adminTypes';

/**
 * Converts a clip row into the client `Clip` shape. Round-trips through JSON so dates become
 * ISO strings, exactly as they arrive from the API routes.
 *
 * @example
 * const clip = serializeClip(row);
 */
function serializeClip(clip: ClipRow | ClipWithComments): ClipType {
  const plain: ClipType = JSON.parse(JSON.stringify({ comments: [], ...clip }));
  return plain;
}

/**
 * Fetch a single clip directly from the database on the server
 */
export async function getClipByIdServer(id: string): Promise<ClipType | null> {
  if (!isValidId(id)) return null;

  try {
    const clip = await getClipWithComments(id);
    return clip ? serializeClip(clip) : null;
  } catch (error) {
    console.error(`[Server DB] Error fetching clip by ID (${id}):`, error);
    return null;
  }
}

/**
 * Fetch the latest unarchived clips directly on the server
 */
export async function getLatestClipsServer(limit = 4): Promise<ClipType[]> {
  try {
    const rows = await db
      .select()
      .from(clips)
      .where(eq(clips.archived, false))
      .orderBy(desc(clips.createdAt))
      .limit(limit);
    return rows.map(serializeClip);
  } catch (error) {
    console.error('[Server DB] Error fetching latest clips:', error);
    return [];
  }
}

/**
 * Fetch public configuration directly on the server
 */
export async function getPublicConfigServer(): Promise<{
  latestVideoLink?: string;
  clipAmount?: number;
} | null> {
  try {
    const { latestVideoLink, clipAmount } = await getPublicConfig();
    return { latestVideoLink, clipAmount };
  } catch (error) {
    console.error('[Server DB] Error fetching public config:', error);
    return null;
  }
}
