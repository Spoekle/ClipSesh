import path from 'path';
import fs from 'fs';
import { connectToDatabase } from '@/lib/db';
import { AdminConfig, PublicConfig, ISeasonTransitionLog } from '@/models/configModel';
import Clip from '@/models/clipModel';
import Rating from '@/models/ratingModel';
import Zip from '@/models/zipModel';
import {
  getSeasonLifecycleStatus,
  getSeasonToArchive,
  SeasonName,
} from '@/lib/seasonHelpers';
import { startProcessingJob, getAllProcessingJobs } from '@/lib/zipProcessing';
import { wsManager } from '@/lib/WebSocketManager';

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
  await connectToDatabase();
  const adminConfig = await AdminConfig.findOne().lean();
  const denyThreshold =
    customDenyThreshold ??
    adminConfig?.seasonAutomation?.denyThreshold ??
    adminConfig?.denyThreshold ??
    5;

  let season = seasonName;
  let year = seasonYear;

  if (!season || !year) {
    const lifecycle = getSeasonLifecycleStatus(new Date(), {
      seasonEndDay: adminConfig?.seasonAutomation?.seasonEndDay ?? 20,
      newSeasonStartDay: adminConfig?.seasonAutomation?.newSeasonStartDay ?? 21,
      zipArchiveDay: adminConfig?.seasonAutomation?.zipArchiveDay ?? 25,
    });
    season = lifecycle.closingSeason || lifecycle.currentSeason;
    year = lifecycle.closingYear || lifecycle.currentYear;
  }

  const yearQuery =
    season.toLowerCase() === 'winter'
      ? { $in: [Number(year), Number(year) - 1, Number(year) + 1] }
      : Number(year);

  const clips = await Clip.find({
    season: { $regex: new RegExp(`^${season}$`, 'i') } as any,
    year: yearQuery,
    archived: { $ne: true },
  })
    .select('title streamer url createdAt')
    .lean();

  const clipIds = clips.map((c) => c._id);
  const ratings = await Rating.find({ clipId: { $in: clipIds } }).lean();
  const ratingsMap = new Map<string, any>(ratings.map((r) => [r.clipId.toString(), r]));

  const clipDetails = clips.map((clip) => {
    const rDoc = ratingsMap.get(clip._id.toString());
    const denyCount = rDoc?.ratings?.deny?.length || 0;
    const isDenied = denyCount >= denyThreshold;
    return {
      _id: clip._id.toString(),
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
    totalClips: clips.length,
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
  await connectToDatabase();
  const adminConfig = await AdminConfig.findOne();
  const threshold =
    customDenyThreshold ??
    adminConfig?.seasonAutomation?.denyThreshold ??
    adminConfig?.denyThreshold ??
    5;

  const job = await startProcessingJob(season, year, threshold);

  if (adminConfig) {
    const historyEntry: ISeasonTransitionLog = {
      timestamp: new Date(),
      action: 'auto_zip_started',
      season: (season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()) as SeasonName,
      year: Number(year),
      details: `Manual seasonal archive triggered (Job: ${job.jobId}, clips: ${job.total}).`,
    };
    if (!adminConfig.seasonAutomation) {
      adminConfig.seasonAutomation = {
        enabled: true,
        seasonEndDay: 20,
        newSeasonStartDay: 21,
        zipArchiveDay: 25,
        transitionHistory: [],
      };
    }
    if (!adminConfig.seasonAutomation.transitionHistory) {
      adminConfig.seasonAutomation.transitionHistory = [];
    }
    adminConfig.seasonAutomation.transitionHistory.unshift(historyEntry);
    if (adminConfig.seasonAutomation.transitionHistory.length > 50) {
      adminConfig.seasonAutomation.transitionHistory.pop();
    }
    await adminConfig.save();
  }

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
  await connectToDatabase();

  const seasonRegex = new RegExp(`^${season}$`, 'i');
  const capitalizedSeason = (
    season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()
  ) as SeasonName;

  // 1. Unarchive clips matching this season and year
  const updateResult = await Clip.updateMany(
    {
      season: { $regex: seasonRegex },
      year: Number(year),
      archived: true,
    },
    {
      $set: { archived: false },
      $unset: { archivedAt: 1 },
    }
  );

  // 2. Handle associated Zip archive if requested
  let zipDeleted = false;
  if (options.deleteZip) {
    const existingZip = await Zip.findOne({
      season: { $regex: seasonRegex },
      year: Number(year),
    });

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
      await Zip.deleteOne({ _id: existingZip._id });
      zipDeleted = true;
    }
  }

  // 3. Recalculate and persist active clip count
  const activeCount = await Clip.countDocuments({ archived: { $ne: true } });
  await PublicConfig.findOneAndUpdate(
    {},
    { clipAmount: activeCount },
    { upsert: true, new: true }
  );

  // 4. Update AdminConfig metadata & log transition history
  const adminConfig = await AdminConfig.findOne();
  if (adminConfig) {
    if (!adminConfig.seasonAutomation) {
      adminConfig.seasonAutomation = {
        enabled: true,
        seasonEndDay: 20,
        newSeasonStartDay: 21,
        zipArchiveDay: 25,
        transitionHistory: [],
      };
    }
    if (!adminConfig.seasonAutomation.transitionHistory) {
      adminConfig.seasonAutomation.transitionHistory = [];
    }

    // If lastArchivedSeason matches this season & year, clear it
    if (
      adminConfig.seasonAutomation.lastArchivedSeason?.season?.toLowerCase() ===
        season.toLowerCase() &&
      Number(adminConfig.seasonAutomation.lastArchivedSeason?.year) === Number(year)
    ) {
      adminConfig.seasonAutomation.lastArchivedSeason = undefined;
    }

    const historyEntry: ISeasonTransitionLog = {
      timestamp: new Date(),
      action: 'season_unarchived',
      season: capitalizedSeason,
      year: Number(year),
      details: `Season ${capitalizedSeason} ${year} unarchived (undo archive). Restored ${updateResult.modifiedCount} clips to active pool.${zipDeleted ? ' Associated ZIP archive removed.' : ''}`,
    };

    adminConfig.seasonAutomation.transitionHistory.unshift(historyEntry);
    if (adminConfig.seasonAutomation.transitionHistory.length > 50) {
      adminConfig.seasonAutomation.transitionHistory.pop();
    }
    await adminConfig.save();
  }

  // 5. Broadcast WebSocket notifications
  if (global.socketIoInstance) {
    global.socketIoInstance.emit('season:unarchived', {
      season: capitalizedSeason,
      year: Number(year),
      unarchivedClipsCount: updateResult.modifiedCount,
      zipDeleted,
    });
    global.socketIoInstance.emit('clips:updated');
  }

  return {
    success: true,
    season: capitalizedSeason,
    year: Number(year),
    unarchivedClipsCount: updateResult.modifiedCount,
    zipDeleted,
    message: `Successfully unarchived ${capitalizedSeason} ${year}. Restored ${updateResult.modifiedCount} clips back to the active pool.`,
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
    await connectToDatabase();
    const adminConfig = await AdminConfig.findOne();

    if (!adminConfig) {
      return { triggered: false, reason: 'Admin configuration not found' };
    }

    const autoConfig = adminConfig.seasonAutomation;
    if (autoConfig && autoConfig.enabled === false) {
      return { triggered: false, reason: 'Season automation is disabled in admin settings' };
    }

    const seasonEndDay = autoConfig?.seasonEndDay ?? 20;
    const newSeasonStartDay = autoConfig?.newSeasonStartDay ?? 21;
    const zipArchiveDay = autoConfig?.zipArchiveDay ?? 25;
    const denyThreshold = autoConfig?.denyThreshold ?? adminConfig.denyThreshold ?? 5;

    // Check if today qualifies for seasonal auto-archive
    const target = getSeasonToArchive(evalDate, { zipArchiveDay });
    if (!target) {
      return {
        triggered: false,
        reason: 'Current date is not on or after zipArchiveDay in a transition month (Mar, Jun, Sep, Dec)',
      };
    }

    const { season, year, fallbackYears } = target;

    // Idempotency Check 1: Check if an archive Zip was already generated for this season & year
    const existingZip = await Zip.findOne({
      season: { $regex: new RegExp(`^${season}$`, 'i') },
      year: { $in: fallbackYears },
    });

    // Idempotency Check 2: Check if unarchived clips remain for this season
    const unarchivedCount = await Clip.countDocuments({
      season: { $regex: new RegExp(`^${season}$`, 'i') },
      year: { $in: fallbackYears },
      archived: { $ne: true },
    });

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
      `[SeasonScheduler] 🚀 Auto-archiving milestone reached for ${season} ${year} (Unarchived clips: ${unarchivedCount})`
    );

    // Record transition event in AdminConfig history
    const historyEntry: ISeasonTransitionLog = {
      timestamp: new Date(),
      action: 'auto_zip_started',
      season,
      year,
      details: `Automated seasonal archiving triggered on Day ${evalDate.getDate()} for ${season} ${year}.`,
    };

    if (!adminConfig.seasonAutomation) {
      adminConfig.seasonAutomation = {
        enabled: true,
        seasonEndDay,
        newSeasonStartDay,
        zipArchiveDay,
        transitionHistory: [],
      };
    }
    if (!adminConfig.seasonAutomation.transitionHistory) {
      adminConfig.seasonAutomation.transitionHistory = [];
    }
    adminConfig.seasonAutomation.transitionHistory.unshift(historyEntry);
    await adminConfig.save();

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
  } catch (error: any) {
    console.error('[SeasonScheduler] Error during automation evaluation:', error);
    return { triggered: false, reason: error.message || 'Unknown error' };
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

  console.log('[SeasonScheduler] ⏱️ Initializing 4-Season automated lifecycle scheduler...');

  // Initial check 8 seconds after boot to allow MongoDB connection to settle
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
  }, ONE_HOUR_MS);
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
