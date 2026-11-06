import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { adminConfig, CONFIG_ROW_ID } from '@/db/schema';
import { getAdminConfig, updateSeasonAutomation } from '@/db/queries';

export const GET = authRoute(['admin', 'clipteam', 'editor'], async () => {
  const config = await getAdminConfig();
  return NextResponse.json({
    ...config,
    admin: config,
  });
});

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

export const PUT = authRoute(['admin'], async (req) => {
  const {
    denyThreshold,
    clipChannelIds,
    blacklistedSubmitters,
    blacklistedStreamers,
    seasonAutomation,
  } = await req.json();

  const seasonAutomationUpdate: { enabled?: boolean; zipArchiveDay?: number } = {};
  if (seasonAutomation !== undefined) {
    if (!seasonAutomation || typeof seasonAutomation !== 'object') {
      return NextResponse.json({ error: 'seasonAutomation must be an object' }, { status: 400 });
    }
    const { enabled, zipArchiveDay } = seasonAutomation;
    if (enabled !== undefined) {
      if (typeof enabled !== 'boolean') {
        return NextResponse.json({ error: 'seasonAutomation.enabled must be a boolean' }, { status: 400 });
      }
      seasonAutomationUpdate.enabled = enabled;
    }
    if (zipArchiveDay !== undefined) {
      // Seasons always start on the 21st (see getCurrentSeason), so archiving can't happen earlier.
      if (!Number.isInteger(zipArchiveDay) || zipArchiveDay < 21 || zipArchiveDay > 28) {
        return NextResponse.json(
          { error: 'seasonAutomation.zipArchiveDay must be a whole number between 21 and 28' },
          { status: 400 }
        );
      }
      seasonAutomationUpdate.zipArchiveDay = zipArchiveDay;
    }
  }

  const update: Partial<typeof adminConfig.$inferInsert> = {};

  if (denyThreshold !== undefined) update.denyThreshold = Math.max(1, Number(denyThreshold) || 1);
  if (isStringArray(clipChannelIds)) update.clipChannelIds = clipChannelIds;
  if (Array.isArray(blacklistedSubmitters)) {
    update.blacklistedSubmitters = blacklistedSubmitters.map((s) => ({
      username: typeof s?.username === 'string' ? s.username.trim() : '',
      userId: typeof s?.userId === 'string' ? s.userId.trim() : '',
    }));
  }
  if (isStringArray(blacklistedStreamers)) update.blacklistedStreamers = blacklistedStreamers;

  if (Object.keys(update).length > 0) {
    await getAdminConfig();
    await db.update(adminConfig).set(update).where(eq(adminConfig._id, CONFIG_ROW_ID));
  }
  // Row-locked so a concurrent scheduler history write isn't lost; history and skips stay server-owned.
  if (Object.keys(seasonAutomationUpdate).length > 0) {
    await updateSeasonAutomation((current) => ({ ...current, ...seasonAutomationUpdate }));
  }

  return NextResponse.json(await getAdminConfig());
});
