import { NextResponse } from 'next/server';
import { and, count, desc, isNotNull, isNull, max, or, sql } from 'drizzle-orm';
import { apiRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { clips, zips } from '@/db/schema';
import { getCurrentSeason, requireSeason, type SeasonName } from '@/lib/seasonHelpers';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PREVIEW_THUMBNAILS = 4;
const TOP_STREAMERS = 3;

interface SeasonData {
  season: SeasonName;
  year: number;
  clipCount: number;
  archivedClipsCount: number;
  unarchivedClipsCount: number;
  totalViews: number;
  totalUpvotes: number;
  thumbnails: string[];
  streamerCounts: Map<string, number>;
}

function emptySeasonData(season: SeasonName, year: number): SeasonData {
  return {
    season,
    year,
    clipCount: 0,
    archivedClipsCount: 0,
    unarchivedClipsCount: 0,
    totalViews: 0,
    totalUpvotes: 0,
    thumbnails: [],
    streamerCounts: new Map<string, number>(),
  };
}

export const GET = apiRoute(async (req) => {
  const currentSeasonInfo = getCurrentSeason();
  const currentSeasonCap = requireSeason(currentSeasonInfo.season);
  const currentYear = currentSeasonInfo.year;

  const hasSeason = and(isNotNull(clips.season), isNotNull(clips.year));
  const rankedThumbnails = db.$with('ranked_thumbnails').as(
    db
      .select({
        season: clips.season,
        year: clips.year,
        thumbnail: clips.thumbnail,
        rank: sql<number>`row_number() over (partition by ${clips.season}, ${clips.year} order by ${clips.createdAt} desc)`.as('rank'),
      })
      .from(clips)
      .where(and(hasSeason, isNotNull(clips.thumbnail)))
  );

  const [totals, thumbnails, streamers, unseasonedClips, zipRows] = await Promise.all([
    db
      .select({
        season: clips.season,
        year: clips.year,
        clipCount: count(),
        archivedClipsCount: sql<number>`count(*) filter (where ${clips.archived})`.mapWith(Number),
        totalViews: sql<number>`coalesce(sum(${clips.views}), 0)`.mapWith(Number),
        totalUpvotes: sql<number>`coalesce(sum(${clips.upvotes}), 0)`.mapWith(Number),
      })
      .from(clips)
      .where(hasSeason)
      .groupBy(clips.season, clips.year),
    db
      .with(rankedThumbnails)
      .select()
      .from(rankedThumbnails)
      .where(sql`${rankedThumbnails.rank} <= ${PREVIEW_THUMBNAILS}`)
      .orderBy(rankedThumbnails.rank),
    db
      .select({
        season: clips.season,
        year: clips.year,
        streamer: clips.streamer,
        clipCount: count(),
      })
      .from(clips)
      .where(hasSeason)
      .groupBy(clips.season, clips.year, clips.streamer)
      .orderBy(desc(count()), desc(max(clips.createdAt))),
    // Legacy clips saved without season/year get one inferred from their upload date.
    db
      .select({
        createdAt: clips.createdAt,
        thumbnail: clips.thumbnail,
        streamer: clips.streamer,
        views: clips.views,
        upvotes: clips.upvotes,
        archived: clips.archived,
      })
      .from(clips)
      .where(or(isNull(clips.season), isNull(clips.year)))
      .orderBy(desc(clips.createdAt)),
    db.select().from(zips).orderBy(desc(zips.createdAt)),
  ]);

  const sectionsMap = new Map<string, SeasonData>();
  const getSection = (season: SeasonName, year: number) => {
    const key = `${season}-${year}`;
    let data = sectionsMap.get(key);
    if (!data) {
      data = emptySeasonData(season, year);
      sectionsMap.set(key, data);
    }
    return data;
  };

  let totalClips = 0;
  for (const row of totals) {
    if (!row.season || row.year === null) continue;
    const data = getSection(row.season, row.year);
    data.clipCount += row.clipCount;
    data.archivedClipsCount += row.archivedClipsCount;
    data.unarchivedClipsCount += row.clipCount - row.archivedClipsCount;
    data.totalViews += row.totalViews;
    data.totalUpvotes += row.totalUpvotes;
    totalClips += row.clipCount;
  }
  for (const row of thumbnails) {
    if (!row.season || row.year === null || !row.thumbnail) continue;
    getSection(row.season, row.year).thumbnails.push(row.thumbnail);
  }
  for (const row of streamers) {
    if (!row.season || row.year === null || !row.streamer) continue;
    getSection(row.season, row.year).streamerCounts.set(row.streamer, row.clipCount);
  }
  for (const clip of unseasonedClips) {
    const inferred = getCurrentSeason(clip.createdAt);
    const data = getSection(requireSeason(inferred.season), inferred.year);
    data.clipCount += 1;
    if (clip.archived) {
      data.archivedClipsCount += 1;
    } else {
      data.unarchivedClipsCount += 1;
    }
    data.totalViews += clip.views;
    data.totalUpvotes += clip.upvotes;
    if (clip.thumbnail && data.thumbnails.length < PREVIEW_THUMBNAILS) {
      data.thumbnails.push(clip.thumbnail);
    }
    if (clip.streamer) {
      data.streamerCounts.set(clip.streamer, (data.streamerCounts.get(clip.streamer) || 0) + 1);
    }
    totalClips += 1;
  }

  const zipMap = new Map<string, { name: string; url: string; size: number; clipAmount: number }>();
  zipRows.forEach((z) => {
    const key = `${z.season}-${z.year}`;
    if (!zipMap.has(key)) {
      zipMap.set(key, { name: z.name, url: z.url, size: z.size, clipAmount: z.clipAmount });
    }
    // Also account for any historical zip records where clips might not be in DB
    if (!sectionsMap.has(key)) {
      const data = getSection(z.season, z.year);
      data.clipCount = z.clipAmount || 0;
      data.archivedClipsCount = z.clipAmount || 0;
    }
  });

  // Chronological season order within a year: Spring (1), Summer (2), Fall (3), Winter (4)
  const seasonOrder: Record<string, number> = {
    Spring: 1,
    Summer: 2,
    Fall: 3,
    Winter: 4,
  };

  const user = getAuthUser(req);
  const canAccessZips = Boolean(user?.roles?.some((r) => ['clipteam', 'editor', 'admin'].includes(r)));

  const sections = Array.from(sectionsMap.values()).map((data) => {
    const topStreamers = Array.from(data.streamerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_STREAMERS)
      .map(([name]) => name);

    const zipKey = `${data.season}-${data.year}`;
    const zip = canAccessZips ? (zipMap.get(zipKey) || null) : null;

    const isCurrent = data.season === currentSeasonCap && data.year === currentYear;

    return {
      season: data.season,
      year: data.year,
      clipCount: data.clipCount,
      archivedClipsCount: data.archivedClipsCount || 0,
      unarchivedClipsCount: data.unarchivedClipsCount || 0,
      isArchived: (data.archivedClipsCount || 0) > 0,
      totalViews: data.totalViews,
      totalUpvotes: data.totalUpvotes,
      previewThumbnails: data.thumbnails,
      topStreamers,
      zip,
      isCurrent,
    };
  });

  // Newest period first: Summer 2026, Spring 2026, Winter 2025, Fall 2025, ...
  sections.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return (seasonOrder[b.season] || 0) - (seasonOrder[a.season] || 0);
  });

  return NextResponse.json({
    success: true,
    totalClips,
    currentSeason: {
      season: currentSeasonCap,
      year: currentYear,
    },
    sections,
  });
});
