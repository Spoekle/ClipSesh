import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import Zip from '@/models/zipModel';
import { getCurrentSeason } from '@/lib/seasonHelpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const currentSeasonInfo = getCurrentSeason();
    const currentSeasonCap = (
      currentSeasonInfo.season.charAt(0).toUpperCase() + currentSeasonInfo.season.slice(1)
    ) as 'Winter' | 'Spring' | 'Summer' | 'Fall';
    const currentYear = currentSeasonInfo.year;

    // 1. Fetch all clips with relevant projection to compute season stats
    // Using lean query for performance
    const clips = await Clip.find(
      {},
      {
        season: 1,
        year: 1,
        createdAt: 1,
        thumbnail: 1,
        streamer: 1,
        views: 1,
        upvotes: 1,
        archived: 1
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch all season zip archives
    const zips = await Zip.find({}).sort({ createdAt: -1 }).lean();
    const zipMap = new Map<string, any>();
    zips.forEach((z) => {
      const key = `${z.season?.toLowerCase()}-${z.year}`;
      if (!zipMap.has(key)) {
        zipMap.set(key, {
          name: z.name,
          url: z.url,
          size: z.size,
          clipAmount: z.clipAmount,
        });
      }
    });

    // 3. Group clips by season and year
    interface TempSeasonData {
      season: 'Winter' | 'Spring' | 'Summer' | 'Fall';
      year: number;
      clipCount: number;
      totalViews: number;
      totalUpvotes: number;
      thumbnails: string[];
      streamerCounts: Map<string, number>;
    }

    const sectionsMap = new Map<string, TempSeasonData>();

    const getSeasonFromDate = (date: Date): 'Winter' | 'Spring' | 'Summer' | 'Fall' => {
      const m = date.getMonth() + 1;
      const d = date.getDate();
      if ((m === 3 && d >= 20) || (m > 3 && m < 6) || (m === 6 && d <= 20)) return 'Spring';
      if ((m === 6 && d >= 21) || (m > 6 && m < 9) || (m === 9 && d <= 20)) return 'Summer';
      if ((m === 9 && d >= 21) || (m > 9 && m < 12) || (m === 12 && d <= 20)) return 'Fall';
      return 'Winter';
    };

    clips.forEach((clip) => {
      let season = clip.season;
      let year = clip.year;

      if (!season || !year) {
        const d = clip.createdAt ? new Date(clip.createdAt) : new Date();
        season = getSeasonFromDate(d);
        year = d.getFullYear();
      }

      // Standardize season casing
      const normalizedSeason = (
        season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()
      ) as 'Winter' | 'Spring' | 'Summer' | 'Fall';

      const key = `${normalizedSeason}-${year}`;
      let data = sectionsMap.get(key);
      if (!data) {
        data = {
          season: normalizedSeason,
          year,
          clipCount: 0,
          totalViews: 0,
          totalUpvotes: 0,
          thumbnails: [],
          streamerCounts: new Map<string, number>(),
        };
        sectionsMap.set(key, data);
      }

      data.clipCount += 1;
      data.totalViews += clip.views || 0;
      data.totalUpvotes += clip.upvotes || 0;

      if (clip.thumbnail && data.thumbnails.length < 4) {
        data.thumbnails.push(clip.thumbnail);
      }

      if (clip.streamer) {
        const count = data.streamerCounts.get(clip.streamer) || 0;
        data.streamerCounts.set(clip.streamer, count + 1);
      }
    });

    // 4. Also account for any historical zip records where clips might not be in DB
    zips.forEach((z) => {
      const normalizedSeason = (
        z.season.charAt(0).toUpperCase() + z.season.slice(1).toLowerCase()
      ) as 'Winter' | 'Spring' | 'Summer' | 'Fall';
      const key = `${normalizedSeason}-${z.year}`;

      if (!sectionsMap.has(key)) {
        sectionsMap.set(key, {
          season: normalizedSeason,
          year: z.year,
          clipCount: z.clipAmount || 0,
          totalViews: 0,
          totalUpvotes: 0,
          thumbnails: [],
          streamerCounts: new Map<string, number>(),
        });
      }
    });

    // Chronological season order within a year: Spring (1), Summer (2), Fall (3), Winter (4)
    const seasonOrder: Record<string, number> = {
      Spring: 1,
      Summer: 2,
      Fall: 3,
      Winter: 4,
    };

    const sections = Array.from(sectionsMap.values()).map((data) => {
      const topStreamers = Array.from(data.streamerCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      const zipKey = `${data.season.toLowerCase()}-${data.year}`;
      const zip = zipMap.get(zipKey) || null;

      const isCurrent = data.season === currentSeasonCap && data.year === currentYear;

      return {
        season: data.season,
        year: data.year,
        clipCount: data.clipCount,
        totalViews: data.totalViews,
        totalUpvotes: data.totalUpvotes,
        previewThumbnails: data.thumbnails,
        topStreamers,
        zip,
        isCurrent,
      };
    });

    // Sort in inversed chronological order (newest period first): Summer 2026, Spring 2026, Winter 2025, Fall 2025, Summer 2025, Spring 2025, Winter 2024, Fall 2024
    sections.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return (seasonOrder[b.season] || 0) - (seasonOrder[a.season] || 0);
    });

    return NextResponse.json({
      success: true,
      totalClips: clips.length,
      currentSeason: {
        season: currentSeasonCap,
        year: currentYear,
      },
      sections,
    });
  } catch (error: any) {
    console.error('Error fetching archive seasons:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
