import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { AdminConfig } from '@/models/configModel';
import Clip from '@/models/clipModel';
import Zip from '@/models/zipModel';
import { getSeasonLifecycleStatus, getCurrentSeason } from '@/lib/seasonHelpers';
import {
  runSeasonDryRun,
  triggerManualSeasonArchive,
  checkAndTriggerSeasonAutomation,
  unarchiveSeason,
} from '@/lib/seasonScheduler';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin', 'clipteam', 'editor']);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const adminConfig = await AdminConfig.findOne().lean();

    const dates = {
      seasonEndDay: adminConfig?.seasonAutomation?.seasonEndDay ?? 20,
      newSeasonStartDay: adminConfig?.seasonAutomation?.newSeasonStartDay ?? 21,
      zipArchiveDay: adminConfig?.seasonAutomation?.zipArchiveDay ?? 25,
    };

    const lifecycle = getSeasonLifecycleStatus(new Date(), dates);

    // Fetch seasons overview for admin dashboard
    const currentSeasonInfo = getCurrentSeason();
    const currentSeasonCap = (
      currentSeasonInfo.season.charAt(0).toUpperCase() + currentSeasonInfo.season.slice(1)
    ) as 'Winter' | 'Spring' | 'Summer' | 'Fall';
    const currentYear = currentSeasonInfo.year;

    const clips = await Clip.find({}, { season: 1, year: 1, archived: 1 }).lean();
    const zips = await Zip.find({}).lean();
    const zipMap = new Map<string, any>();
    zips.forEach((z) => {
      const key = `${z.season?.toLowerCase()}-${z.year}`;
      if (!zipMap.has(key)) {
        zipMap.set(key, { name: z.name, url: z.url, size: z.size, clipAmount: z.clipAmount });
      }
    });

    const seasonsMap = new Map<string, any>();
    clips.forEach((c) => {
      if (!c.season || !c.year) return;
      const normSeason = (c.season.charAt(0).toUpperCase() + c.season.slice(1).toLowerCase()) as string;
      const key = `${normSeason}-${c.year}`;
      let sData = seasonsMap.get(key);
      if (!sData) {
        sData = {
          season: normSeason,
          year: c.year,
          totalClips: 0,
          archivedClips: 0,
          activeClips: 0,
          zip: zipMap.get(`${normSeason.toLowerCase()}-${c.year}`) || null,
          isCurrent: normSeason === currentSeasonCap && c.year === currentYear,
        };
        seasonsMap.set(key, sData);
      }
      sData.totalClips += 1;
      if (c.archived) {
        sData.archivedClips += 1;
      } else {
        sData.activeClips += 1;
      }
    });

    // Also include seasons from Zips that might not have clips anymore
    zips.forEach((z) => {
      const normSeason = (z.season.charAt(0).toUpperCase() + z.season.slice(1).toLowerCase()) as string;
      const key = `${normSeason}-${z.year}`;
      if (!seasonsMap.has(key)) {
        seasonsMap.set(key, {
          season: normSeason,
          year: z.year,
          totalClips: z.clipAmount || 0,
          archivedClips: z.clipAmount || 0,
          activeClips: 0,
          zip: { name: z.name, url: z.url, size: z.size, clipAmount: z.clipAmount },
          isCurrent: normSeason === currentSeasonCap && z.year === currentYear,
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
      seasonAutomation: adminConfig?.seasonAutomation || {
        enabled: true,
        seasonEndDay: 20,
        newSeasonStartDay: 21,
        zipArchiveDay: 25,
        transitionHistory: [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching season status:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

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
  } catch (error: any) {
    console.error('Error handling season action:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
