import { NextResponse } from 'next/server';
import { and, count, isNotNull, sql } from 'drizzle-orm';
import { authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { clips, DEFAULT_SEASON_AUTOMATION, zips } from '@/db/schema';
import { getAdminConfig } from '@/db/queries';
import { getSeasonLifecycleStatus, getCurrentSeason, requireSeason } from '@/lib/seasonHelpers';
import {
  runSeasonDryRun,
  triggerManualSeasonArchive,
  checkAndTriggerSeasonAutomation,
  unarchiveSeason,
} from '@/lib/seasonScheduler';

interface SeasonZipSummary {
  name: string;
  url: string;
  size: number;
  clipAmount: number;
}

interface SeasonOverview {
  season: string;
  year: number;
  totalClips: number;
  archivedClips: number;
  activeClips: number;
  zip: SeasonZipSummary | null;
  isCurrent: boolean;
}

export const GET = authRoute(['admin', 'clipteam', 'editor'], async () => {
  const adminConfig = await getAdminConfig();

  const dates = {
    seasonEndDay: adminConfig.seasonAutomation.seasonEndDay ?? 20,
    newSeasonStartDay: adminConfig.seasonAutomation.newSeasonStartDay ?? 21,
    zipArchiveDay: adminConfig.seasonAutomation.zipArchiveDay ?? 25,
  };

  const lifecycle = getSeasonLifecycleStatus(new Date(), dates);

  const currentSeasonInfo = getCurrentSeason();
  const currentSeasonCap = requireSeason(currentSeasonInfo.season);
  const currentYear = currentSeasonInfo.year;

  const [seasonCounts, zipRows] = await Promise.all([
    db
      .select({
        season: clips.season,
        year: clips.year,
        totalClips: count(),
        archivedClips: sql<number>`count(*) filter (where ${clips.archived})`.mapWith(Number),
      })
      .from(clips)
      .where(and(isNotNull(clips.season), isNotNull(clips.year)))
      .groupBy(clips.season, clips.year),
    db.select().from(zips),
  ]);

  const zipMap = new Map<string, SeasonZipSummary>();
  zipRows.forEach((z) => {
    const key = `${z.season}-${z.year}`;
    if (!zipMap.has(key)) {
      zipMap.set(key, { name: z.name, url: z.url, size: z.size, clipAmount: z.clipAmount });
    }
  });

  const seasonsMap = new Map<string, SeasonOverview>();
  seasonCounts.forEach((row) => {
    if (!row.season || row.year === null) return;
    const key = `${row.season}-${row.year}`;
    seasonsMap.set(key, {
      season: row.season,
      year: row.year,
      totalClips: row.totalClips,
      archivedClips: row.archivedClips,
      activeClips: row.totalClips - row.archivedClips,
      zip: zipMap.get(key) || null,
      isCurrent: row.season === currentSeasonCap && row.year === currentYear,
    });
  });

  // Also include seasons from Zips that might not have clips anymore
  zipRows.forEach((z) => {
    const key = `${z.season}-${z.year}`;
    if (!seasonsMap.has(key)) {
      seasonsMap.set(key, {
        season: z.season,
        year: z.year,
        totalClips: z.clipAmount || 0,
        archivedClips: z.clipAmount || 0,
        activeClips: 0,
        zip: { name: z.name, url: z.url, size: z.size, clipAmount: z.clipAmount },
        isCurrent: z.season === currentSeasonCap && z.year === currentYear,
      });
    }
  });

  const seasonOrder: Record<string, number> = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 };
  const seasonList = Array.from(seasonsMap.values()).map((s) => ({
    ...s,
    isArchived: s.archivedClips > 0 && s.activeClips === 0,
    hasArchivedClips: s.archivedClips > 0,
  }));

  seasonList.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return (seasonOrder[b.season] || 0) - (seasonOrder[a.season] || 0);
  });

  return NextResponse.json({
    success: true,
    lifecycle,
    seasons: seasonList,
    seasonAutomation: adminConfig.seasonAutomation ?? DEFAULT_SEASON_AUTOMATION,
  });
}, { exposeErrors: true });

export const POST = authRoute(['admin'], async (req) => {
  const body = await req.json().catch(() => ({}));
  const { action, season, year, denyThreshold, deleteZip } = body;

  if (action === 'dry-run') {
    const result = await runSeasonDryRun(season, year ? Number(year) : undefined, denyThreshold);
    return NextResponse.json({
      success: true,
      ...result,
    });
  }

  if (action === 'force-archive') {
    if (!season || !year) {
      return NextResponse.json(
        { error: 'season and year are required for force-archive' },
        { status: 400 }
      );
    }
    const result = await triggerManualSeasonArchive(season, Number(year), denyThreshold);
    return NextResponse.json({
      success: true,
      ...result,
    });
  }

  if (action === 'unarchive') {
    if (!season || !year) {
      return NextResponse.json(
        { error: 'season and year are required for unarchive' },
        { status: 400 }
      );
    }
    const result = await unarchiveSeason(season, Number(year), {
      deleteZip: Boolean(deleteZip),
    });
    return NextResponse.json(result);
  }

  if (action === 'trigger-check') {
    const result = await checkAndTriggerSeasonAutomation();
    return NextResponse.json({
      success: true,
      ...result,
    });
  }

  return NextResponse.json(
    { error: 'Invalid action. Supported actions: dry-run, force-archive, unarchive, trigger-check' },
    { status: 400 }
  );
}, { exposeErrors: true });
