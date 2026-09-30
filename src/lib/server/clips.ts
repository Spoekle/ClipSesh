import 'server-only';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import { PublicConfig } from '@/models/configModel';
import { Clip as ClipType } from '@/types/adminTypes';

function serializeClip(doc: any): ClipType {
  const plain = JSON.parse(JSON.stringify(doc));
  if (plain._id && typeof plain._id === 'object') {
    plain._id = plain._id.toString();
  }
  return plain as ClipType;
}

/**
 * Fetch a single clip directly from the database on the server
 */
export async function getClipByIdServer(id: string): Promise<ClipType | null> {
  if (!id || typeof id !== 'string') return null;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  try {
    await connectToDatabase();
    const doc = await Clip.findById(id).lean();
    if (!doc) return null;
    return serializeClip(doc);
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
    await connectToDatabase();
    const docs = await Clip.find({ archived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map(serializeClip);
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
    await connectToDatabase();
    const config = await PublicConfig.findOne().lean();
    if (!config) return null;
    return JSON.parse(JSON.stringify(config));
  } catch (error) {
    console.error('[Server DB] Error fetching public config:', error);
    return null;
  }
}
