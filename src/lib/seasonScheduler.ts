import path from 'path';
import fs from 'fs';
import { and, count, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { clips, clipViews, zips } from '@/db/schema';
import {
  getAdminConfig,
  getRatingDocs,
  logSeasonTransition,
  refreshClipCount,
} from '@/db/queries';
import { getSeasonLifecycleStatus, getSeasonToArchive, requireSeason } from '@/lib/seasonHelpers';
import { startProcessingJob, getAllProcessingJobs } from '@/lib/zipProcessing';

let schedulerTimer: NodeJS.Timeout | null = null;
let isEvaluating = false;

/**
 * Perform a Dry Run check for a season archive without altering any database records or files.
 */
export async function runSeasonDryRun(
  seasonName?: string,
  seasonYear?: number,
  customDenyThreshold?: number
): Promise<{
  season: string;
  year: number;
  totalClips: number;
  approvedClips: number;
  deniedClips: number;
  denyThreshold: number;
  clipsToArchive: Array<{
    _id: string;
    title: string;
    streamer: string;
    denyCount: number;
    status: 'approved' | 'denied';
  }>;
}> {
  const adminConfig = await getAdminConfig();
  const denyThreshold =
    customDenyThreshold ??
    adminConfig.seasonAutomation.denyThreshold ??
    adminConfig.denyThreshold ??
    5;

  let season = seasonName;
  let year = seasonYear;

  if (!season || !year) {
    const lifecycle = getSeasonLifecycleStatus(new Date(), {
      seasonEndDay: adminConfig.seasonAutomation.seasonEndDay ?? 20,
      newSeasonStartDay: adminConfig.seasonAutomation.newSeasonStartDay ?? 21,
      zipArchiveDay: adminConfig.seasonAutomation.zipArchiveDay ?? 25,
    });
    season = lifecycle.closingSeason || lifecycle.currentSeason;
    year = lifecycle.closingYear || lifecycle.currentYear;
  }

  const years =
    season.toLowerCase() === 'winter'
      ? [Number(year), Number(year) - 1, Number(year) + 1]
      : [Number(year)];

  const seasonClips = await db
    .select({ _id: clips._id, title: clips.title, streamer: clips.streamer })
    .from(clips)
    .where(
      and(
        eq(clips.season, requireSeason(season)),
        inArray(clips.year, years),
        eq(clips.archived, false)
      )
    );

  const ratingsMap = await getRatingDocs(seasonClips.map((c) => c._id));

  const clipDetails = seasonClips.map((clip) => {
    const denyCount = ratingsMap.get(clip._id)?.ratings.deny.length || 0;
    const isDenied = denyCount >= denyThreshold;
    return {
      _id: clip._id,
      title: clip.title,
      streamer: clip.streamer,
      denyCount,
      status: (isDenied ? 'denied' : 'approved') as 'approved' | 'denied',
    };
  });

  const approvedClips = clipDetails.filter((c) => c.status === 'approved').length;
  const deniedClips = clipDetails.filter((c) => c.status === 'denied').length;

  return {
    season,
    year: Number(year),
    totalClips: seasonClips.length,
    approvedClips,
    deniedClips,
    denyThreshold,
    clipsToArchive: clipDetails,
  };
}

/**
 * Manually force an archive job for a specific season and year.
 */
export async function triggerManualSeasonArchive(
  season: string,
  year: number,
  customDenyThreshold?: number
): Promise<{ jobId: string; total: number; message: string }> {
  const adminConfig = await getAdminConfig();
  const threshold =
    customDenyThreshold ??
    adminConfig.seasonAutomation.denyThreshold ??
    adminConfig.denyThreshold ??
    5;

  const job = await startProcessingJob(season, year, threshold);

  const archivedSeason = requireSeason(season);
  await logSeasonTransition(
    {
      action: 'auto_zip_started',
      season: archivedSeason,
      year: Number(year),
      details: `Manual seasonal archive triggered (Job: ${job.jobId}, clips: ${job.total}).`,
    },
    (current) => ({
      ...current,
      autoArchiveSkips: (current.autoArchiveSkips ?? []).filter(
        (skip) => !(skip.season === archivedSeason && skip.year === Number(year))
      ),
    })
  );

  return {
    jobId: job.jobId,
    total: job.total,
    message: `Processing archive job ${job.jobId} started for ${season} ${year}`,
  };
}

/**
 * Unarchive a season (Undo Archive):
 * Restores all clips belonging to the specified season and year by setting archived = false,
 * recalculates public clip count, optionally removes associated season zip,
 * clears lastArchivedSeason if matching, and records an audit transition log.
 */
export async function unarchiveSeason(
  season: string,
  year: number,
  options: { deleteZip?: boolean } = {}
): Promise<{
  success: boolean;
  season: string;
  year: number;
  unarchivedClipsCount: number;
  zipDeleted: boolean;
  message: string;
}> {
  const capitalizedSeason = requireSeason(season);

  // 1. Unarchive clips matching this season and year
  const restored = await db
    .update(clips)
    .set({ archived: false, archivedAt: null })
    .where(
      and(
        eq(clips.season, capitalizedSeason),
        eq(clips.year, Number(year)),
        eq(clips.archived, true)
      )
    )
    .returning({ _id: clips._id });
  const unarchivedClipsCount = restored.length;

  // 2. Handle associated Zip archive if requested
  let zipDeleted = false;
  if (options.deleteZip) {
    const [existingZip] = await db
      .select()
      .from(zips)
      .where(and(eq(zips.season, capitalizedSeason), eq(zips.year, Number(year))))
      .limit(1);

    if (existingZip) {
      try {
        const downloadDir = path.join(process.cwd(), 'download');
        const zipPath = path.join(downloadDir, existingZip.name);
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
      } catch (err) {
        console.warn(`[unarchiveSeason] Could not remove zip file on disk:`, err);
      }
      await db.delete(zips).where(eq(zips._id, existingZip._id));
      zipDeleted = true;
    }
  }

  // 3. Recalculate and persist active clip count
  await refreshClipCount();

  // 4. Update season automation metadata & log transition history
  await logSeasonTransition(
    {
      action: 'season_unarchived',
      season: capitalizedSeason,
      year: Number(year),
      details: `Season ${capitalizedSeason} ${year} unarchived (undo archive). Restored ${unarchivedClipsCount} clips to active pool.${zipDeleted ? ' Associated ZIP archive removed.' : ''}`,
    },
    (current) => {
      const next = { ...current };
      // If lastArchivedSeason matches this season & year, clear it
      if (
        next.lastArchivedSeason?.season?.toLowerCase() === season.toLowerCase() &&
        Number(next.lastArchivedSeason?.year) === Number(year)
      ) {
        next.lastArchivedSeason = undefined;
      }
      const skips = next.autoArchiveSkips ?? [];
      if (!skips.some((skip) => skip.season === capitalizedSeason && skip.year === Number(year))) {
        next.autoArchiveSkips = [...skips, { season: capitalizedSeason, year: Number(year) }];
      }
      return next;
    }
  );

  // 5. Broadcast WebSocket notifications
  if (global.socketIoInstance) {
    global.socketIoInstance.emit('season:unarchived', {
      season: capitalizedSeason,
      year: Number(year),
      unarchivedClipsCount,
      zipDeleted,
    });
    global.socketIoInstance.emit('clips:updated');
  }

  return {
    success: true,
    season: capitalizedSeason,
    year: Number(year),
    unarchivedClipsCount,
    zipDeleted,
    message: `Successfully unarchived ${capitalizedSeason} ${year}. Restored ${unarchivedClipsCount} clips back to the active pool.`,
  };
}

/**
 * Evaluate the seasonal schedule and trigger automatic zipping/archiving if conditions are met.
 * Idempotent: safe to run repeatedly.
 */
export async function checkAndTriggerSeasonAutomation(
  evalDate: Date = new Date()
): Promise<{
  triggered: boolean;
  reason: string;
  season?: string;
  year?: number;
  jobId?: string;
}> {
  if (isEvaluating) {
    return { triggered: false, reason: 'Evaluation already in progress' };
  }

  isEvaluating = true;
  try {
    const adminConfig = await getAdminConfig();

    const autoConfig = adminConfig.seasonAutomation;
    if (autoConfig.enabled === false) {
      return { triggered: false, reason: 'Season automation is disabled in admin settings' };
    }

    const zipArchiveDay = autoConfig.zipArchiveDay ?? 25;
    const denyThreshold = autoConfig.denyThreshold ?? adminConfig.denyThreshold ?? 5;

    // Check if today qualifies for seasonal auto-archive
    const target = getSeasonToArchive(evalDate, { zipArchiveDay });
    if (!target) {
      return {
        triggered: false,
        reason: 'Current date is not on or after zipArchiveDay in a transition month (Mar, Jun, Sep, Dec)',
      };
    }

    const { season, year, fallbackYears } = target;

    const isSkipped = (autoConfig.autoArchiveSkips ?? []).some(
      (skip) => skip.season === season && fallbackYears.includes(Number(skip.year))
    );
    if (isSkipped) {
      return {
        triggered: false,
        reason: `${season} ${year} was manually unarchived; auto-archive is paused until it is force-archived`,
        season,
        year,
      };
    }

    // Idempotency Check 1: Check if an archive Zip was already generated for this season & year
    const [existingZip] = await db
      .select({ name: zips.name })
      .from(zips)
      .where(and(eq(zips.season, season), inArray(zips.year, fallbackYears)))
      .orderBy(desc(zips.createdAt))
      .limit(1);

    // Idempotency Check 2: Check if unarchived clips remain for this season
    const [{ unarchivedCount }] = await db
      .select({ unarchivedCount: count() })
      .from(clips)
      .where(
        and(
          eq(clips.season, season),
          inArray(clips.year, fallbackYears),
          eq(clips.archived, false)
        )
      );

    if (existingZip && unarchivedCount === 0) {
      return {
        triggered: false,
        reason: `${season} ${year} is already zipped and archived (Zip: ${existingZip.name})`,
        season,
        year,
      };
    }

    // Idempotency Check 3: Check if a job is currently processing this season
    const activeJobs = getAllProcessingJobs();
    const isJobRunning = activeJobs.some(
      (j) =>
        j.status === 'processing' &&
        j.season.toLowerCase() === season.toLowerCase() &&
        fallbackYears.includes(Number(j.year))
    );

    if (isJobRunning) {
      return {
        triggered: false,
        reason: `A processing job is already running for ${season} ${year}`,
        season,
        year,
      };
    }

    console.log(
      `[SeasonScheduler] Auto-archiving milestone reached for ${season} ${year} (Unarchived clips: ${unarchivedCount})`
    );

    // Record transition event in season automation history
    await logSeasonTransition({
      action: 'auto_zip_started',
      season,
      year,
      details: `Automated seasonal archiving triggered on Day ${evalDate.getDate()} for ${season} ${year}.`,
    });

    // Start background processing pipeline
    const jobResult = await startProcessingJob(season, year, denyThreshold);

    // Emit notification to admin WebSocket subscribers
    if (global.socketIoInstance) {
      global.socketIoInstance.emit('season:auto_archive_started', {
        season,
        year,
        jobId: jobResult.jobId,
        totalClips: jobResult.total,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      triggered: true,
      reason: `Automated archiving job started for ${season} ${year}`,
      season,
      year,
      jobId: jobResult.jobId,
    };
  } catch (error) {
    console.error('[SeasonScheduler] Error during automation evaluation:', error);
    return { triggered: false, reason: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    isEvaluating = false;
  }
}

/**
 * Start the seasonal background scheduler.
 * Evaluates immediately on startup (with small delay) and subsequently every hour.
 */
export function startSeasonScheduler(): void {
  if (schedulerTimer) {
    console.log('[SeasonScheduler] Scheduler already active.');
    return;
  }

  console.log('[SeasonScheduler] Initializing 4-Season automated lifecycle scheduler...');

  // Initial check 8 seconds after boot to allow the database connection to settle
  setTimeout(() => {
    checkAndTriggerSeasonAutomation().catch((err) => {
      console.error('[SeasonScheduler] Startup evaluation error:', err);
    });
  }, 8000);

  // Hourly check: 60 * 60 * 1000 ms
  const ONE_HOUR_MS = 60 * 60 * 1000;
  schedulerTimer = setInterval(() => {
    checkAndTriggerSeasonAutomation().catch((err) => {
      console.error('[SeasonScheduler] Periodic evaluation error:', err);
    });
    pruneStaleClipViews().catch((err) => {
      console.error('[SeasonScheduler] Clip view cleanup error:', err);
    });
  }, ONE_HOUR_MS);
}

/**
 * Deletes view-dedup rows past their 2-hour cooldown (Postgres has no TTL indexes).
 */
async function pruneStaleClipViews(): Promise<void> {
  await db.delete(clipViews).where(lt(clipViews.createdAt, sql`now() - interval '2 hours'`));
}

/**
 * Stop the scheduler on graceful server shutdown.
 */
export function stopSeasonScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[SeasonScheduler] Scheduler stopped.');
  }
}
