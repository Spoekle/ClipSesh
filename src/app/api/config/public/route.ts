import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { apiRoute, authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { CONFIG_ROW_ID, publicConfig } from '@/db/schema';
import { getPublicConfig, refreshClipCount } from '@/db/queries';

export const GET = apiRoute(async () => {
  const config = await getPublicConfig();

  if (config.clipAmount === 0) {
    return NextResponse.json({ ...config, clipAmount: await refreshClipCount() });
  }

  return NextResponse.json(config);
});

export const PUT = authRoute(['admin'], async (req) => {
  const { latestVideoLink } = await req.json();

  await getPublicConfig();
  const [updated] = await db
    .update(publicConfig)
    .set({ latestVideoLink: typeof latestVideoLink === 'string' ? latestVideoLink.trim() : '' })
    .where(eq(publicConfig._id, CONFIG_ROW_ID))
    .returning();

  return NextResponse.json(updated);
});
