import fs from 'fs';
import path from 'path';
import * as archiverPkg from 'archiver';
import axios from 'axios';

function createZipArchive(options: any = {}) {
  const pkg: any = archiverPkg;
  if (typeof pkg.ZipArchive === 'function') {
    return new pkg.ZipArchive(options);
  }
  if (pkg.default && typeof pkg.default.ZipArchive === 'function') {
    return new pkg.default.ZipArchive(options);
  }
  if (typeof pkg.default === 'function') {
    return pkg.default('zip', options);
  }
  if (typeof pkg === 'function') {
    return pkg('zip', options);
  }
  throw new Error('Could not initialize Archiver / ZipArchive');
}
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import Rating from '@/models/ratingModel';
import Zip from '@/models/zipModel';
import { PublicConfig, AdminConfig } from '@/models/configModel';
import { wsManager } from '@/lib/WebSocketManager';

export interface ProcessingJob {
  jobId?: string;
  total: number;
  processed: number;
  status: 'processing' | 'completed' | 'error' | 'cancelled';
  phase: string;
  zipFilename: string;
  zipId?: any;
  season: string;
  year: number;
  startTime: number;
  endTime?: number | null;
  error?: string | null;
  clips: any[];
  logs: Array<{ time: number; message: string; level: string }>;
}

const activeJobCleanups = new Map<string, () => void>();

declare global {
  // eslint-disable-next-line no-var
  var processingJobsStore: Record<string, ProcessingJob> | undefined;
}

const processingJobs: Record<string, ProcessingJob> =
  global.processingJobsStore || (global.processingJobsStore = {});

function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function updateClipCount(): Promise<number> {
  try {
    const count = await Clip.countDocuments({ archived: { $ne: true } });
    await PublicConfig.findOneAndUpdate(
      {},
      { clipAmount: count },
      { upsert: true, new: true }
    );
    return count;
  } catch (error) {
    console.error('Error updating clip count:', error);
    return 0;
  }
}

function cleanupOldJobs() {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  for (const id of Object.keys(processingJobs)) {
    const job = processingJobs[id];
    if (job.status !== 'processing' && job.endTime && now - job.endTime > ONE_DAY_MS) {
      delete processingJobs[id];
    }
  }
}

export async function startProcessingJob(
  season: string,
  year: number,
  customDenyThreshold?: number,
  providedClips?: any[]
): Promise<{ jobId: string; total: number; supportedEvents: string[] }> {
  await connectToDatabase();
  cleanupOldJobs();

  let denyThreshold = customDenyThreshold;
  if (!denyThreshold) {
    const adminConfig = await AdminConfig.findOne().lean();
    denyThreshold = adminConfig?.denyThreshold || 5;
  }

  const clips = await Clip.find({
    season: { $regex: new RegExp(`^${season}$`, 'i') } as any,
    year: Number(year),
    archived: { $ne: true },
  }).select('-comments').lean();

  let allowedClips: any[] = [];
  if (Array.isArray(providedClips) && providedClips.length > 0) {
    allowedClips = providedClips;
  } else {
    const clipIds = clips.map((c) => c._id);
    const ratings = await Rating.find({ clipId: { $in: clipIds } }).lean();
    const ratingsMap = new Map<string, any>(ratings.map((r) => [r.clipId.toString(), r]));

    for (const clip of clips) {
      const ratingsDoc = ratingsMap.get(clip._id.toString());
      const denyCount = ratingsDoc?.ratings?.deny?.length || 0;
      if (denyCount < (denyThreshold || 5)) {
        allowedClips.push(clip);
      }
    }
  }

  const jobId = `job-${Date.now()}`;
  const totalClips = allowedClips.length;

  processingJobs[jobId] = {
    jobId,
    total: totalClips,
    processed: 0,
    status: 'processing',
    phase: 'initializing',
    zipFilename: '',
    season,
    year,
    startTime: Date.now(),
    clips: allowedClips.map((clip, index) => ({
      ...clip,
      index,
      status: 'pending',
      startTime: null,
      endTime: null,
      error: null,
    })),
    logs: [
      {
        time: Date.now(),
        message: 'Job initialization started',
        level: 'info',
      },
    ],
  };

  const supportedEvents = [
    `job:started:${jobId}`,
    `job:clip:processing:${jobId}`,
    `job:clip:processed:${jobId}`,
    `job:clip:error:${jobId}`,
    `job:progress:${jobId}`,
    `job:phase:${jobId}`,
    `job:completed:${jobId}`,
    `job:error:${jobId}`,
  ];

  wsManager.emitJobStarted(jobId, totalClips, season, year);

  // Run in background without blocking response
  processClipsAsync(jobId, allowedClips, clips, season, year).catch((err) => {
    console.error(`Background processing error for ${jobId}:`, err);
  });

  return { jobId, total: totalClips, supportedEvents };
}

async function processClipsAsync(
  jobId: string,
  clips: any[],
  allClips: any[],
  season: string,
  year: number
) {
  const job = processingJobs[jobId];
  if (!job) return;

  const downloadDir = path.join(process.cwd(), 'download');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const zipFilename = `${year}-${season}-processed-${Date.now()}.zip`;
  const zipPath = path.join(downloadDir, zipFilename);

  let isCancelled = false;
  let currentAxiosController: AbortController | null = null;
  let archive: any = null;
  let zipStream: any = null;

  activeJobCleanups.set(jobId, () => {
    isCancelled = true;
    if (currentAxiosController) {
      try {
        currentAxiosController.abort();
      } catch {}
    }
    try {
      if (archive && typeof (archive as any).destroy === 'function') {
        (archive as any).destroy();
      }
      if (zipStream && typeof zipStream.destroy === 'function') {
        zipStream.destroy();
      }
      if (fs.existsSync(zipPath)) {
        try {
          fs.unlinkSync(zipPath);
        } catch {}
      }
    } catch (cleanErr) {
      console.error(`[Job ${jobId}] Error cleaning up cancelled archive:`, cleanErr);
    }
  });

  const logAndEmit = (message: string, level: string = 'info', phase: string | null = null) => {
    job.logs.push({ time: Date.now(), message, level });
    if (phase && phase !== job.phase) {
      job.phase = phase;
      wsManager.emitJobPhaseChange(jobId, phase, message);
    }
    console.log(`[Job ${jobId}] ${message}`);
  };

  try {
    logAndEmit('Starting clip processing pipeline', 'info', 'starting');

    if (!clips || clips.length === 0) {
      logAndEmit('No clips to process for this season and year', 'warning', 'completed');
      job.status = 'completed';
      job.phase = 'completed';
      job.endTime = Date.now();
      job.processed = 0;
      wsManager.emitJobCompleted(
        jobId,
        {
          zipFilename: '',
          zipId: null,
          size: '0 Bytes',
          url: '',
        },
        0
      );
      return;
    }

    zipStream = fs.createWriteStream(zipPath, {
      highWaterMark: 16 * 1024 * 1024,
    });

    archive = createZipArchive({
      zlib: { level: 3 },
      forceLocalTime: true,
      highWaterMark: 16 * 1024 * 1024,
    });

    archive.on('error', (err: any) => {
      if (isCancelled || (job.status as string) === 'cancelled') return;
      logAndEmit(`Archive error: ${err.message}`, 'error', 'error');
      job.status = 'error';
      job.phase = 'error';
      job.error = err.message;
      wsManager.emitJobError(jobId, err.message);
    });

    archive.on('warning', (err: any) => {
      if (isCancelled || (job.status as string) === 'cancelled') return;
      logAndEmit(`Archive warning: ${err.message}`, 'warning');
    });

    const zipFinalized = new Promise<void>((resolve, reject) => {
      zipStream.on('close', async () => {
        if (isCancelled || (job.status as string) === 'cancelled') {
          try {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
          } catch {}
          return resolve();
        }

        try {
          logAndEmit('Zip stream closed. Saving archive metadata...', 'info', 'finalizing');
          const stats = fs.statSync(zipPath);
          const size = stats.size;

          const capitalizedSeason = (season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()) as any;
          const seasonZip = new Zip({
            url: `/download/${zipFilename}`,
            season: capitalizedSeason,
            year: Number(year),
            name: zipFilename,
            size,
            clipAmount: clips.length,
          });

          await seasonZip.save();

          // Archive all clips from this season
          const clipsToArchive = allClips && allClips.length > 0 ? allClips : clips;
          const allClipIds = clipsToArchive.map((c) => c._id);
          if (allClipIds.length > 0) {
            await Clip.updateMany(
              { _id: { $in: allClipIds } },
              {
                $set: {
                  archived: true,
                  archivedAt: new Date(),
                  season,
                  year: Number(year),
                },
              }
            );
          }

          await updateClipCount();

          job.zipFilename = zipFilename;
          job.zipId = seasonZip._id;
          job.status = 'completed';
          job.phase = 'completed';
          job.endTime = Date.now();
          job.processed = job.total;

          const totalProcessingTime = job.endTime - job.startTime;
          logAndEmit(`Archive created successfully: ${zipFilename} (${formatBytes(size)})`, 'info', 'completed');
          wsManager.emitJobCompleted(
            jobId,
            {
              zipFilename,
              zipId: seasonZip._id,
              size: formatBytes(size),
              url: `/download/${zipFilename}`,
            },
            totalProcessingTime
          );

          resolve();
        } catch (err: any) {
          logAndEmit(`Error in finalize: ${err.message}`, 'error', 'error');
          job.status = 'error';
          job.phase = 'error';
          job.error = err.message;
          wsManager.emitJobError(jobId, err.message);
          reject(err);
        }
      });

      zipStream.on('error', (err) => {
        if (isCancelled || (job.status as string) === 'cancelled') return;
        logAndEmit(`Zip stream write error: ${err.message}`, 'error', 'error');
        job.status = 'error';
        job.phase = 'error';
        job.error = err.message;
        wsManager.emitJobError(jobId, err.message);
        reject(err);
      });
    });

    archive.pipe(zipStream);

    logAndEmit(`Packaging ${clips.length} clips into ZIP archive...`, 'info', 'processing');

    // Process clips sequentially
    for (let i = 0; i < clips.length; i++) {
      if (isCancelled || (job.status as string) === 'cancelled') {
        logAndEmit('Processing cancelled by user. Partial archive discarded.', 'warn', 'cancelled');
        return;
      }

      const clip = clips[i];
      const clipStart = Date.now();
      wsManager.emitClipProcessing(jobId, i, clip, Math.round((i / clips.length) * 100));

      const ratingPart = clip.rating ? `${clip.rating}-` : '';
      const streamerPart = clip.streamer ? `${clip.streamer}-` : '';
      const safeTitle = (clip.title || 'clip').replace(/[^a-zA-Z0-9.-]/g, '_');

      try {
        if (clip.url && clip.url.startsWith('http')) {
          logAndEmit(`[${i + 1}/${clips.length}] Downloading and packing "${clip.title || 'clip'}"...`, 'info', 'processing');
          const abortController = new AbortController();
          currentAxiosController = abortController;

          const response = await axios.get(clip.url, {
            responseType: 'stream',
            timeout: 30000,
            signal: abortController.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          currentAxiosController = null;

          if (isCancelled || (job.status as string) === 'cancelled') {
            try {
              if (response.data && typeof response.data.destroy === 'function') {
                response.data.destroy();
              }
            } catch {}
            return;
          }

          const ext = path.extname(clip.url.split('?')[0]) || '.mp4';
          const entryName = `${i + 1}-${ratingPart}${streamerPart}${safeTitle}${ext}`;

          await new Promise<void>((resolveEntry, rejectEntry) => {
            let settled = false;
            const timeoutTimer = setTimeout(() => {
              if (!settled) {
                settled = true;
                cleanup();
                rejectEntry(new Error(`Timed out streaming clip "${clip.title}"`));
              }
            }, 60000);

            const onEntry = (e: any) => {
              if (e.name === entryName) {
                if (!settled) {
                  settled = true;
                  cleanup();
                  resolveEntry();
                }
              }
            };
            const onError = (err: any) => {
              if (!settled) {
                settled = true;
                cleanup();
                rejectEntry(err);
              }
            };
            const cleanup = () => {
              clearTimeout(timeoutTimer);
              archive.off('entry', onEntry);
              archive.off('error', onError);
              if (response.data && typeof response.data.off === 'function') {
                response.data.off('error', onError);
              }
            };

            archive.on('entry', onEntry);
            archive.on('error', onError);
            if (response.data && typeof response.data.on === 'function') {
              response.data.on('error', onError);
            }
            archive.append(response.data, { name: entryName });
          });
        } else if (clip.url) {
          // Local file
          const cleanUrl = clip.url.replace(/^\/?uploads\//, '');
          let localPath = path.join(process.cwd(), 'uploads', cleanUrl);
          if (!fs.existsSync(localPath)) {
            localPath = path.join(process.cwd(), clip.url.replace(/^\//, ''));
          }
          if (fs.existsSync(localPath)) {
            logAndEmit(`[${i + 1}/${clips.length}] Packing local clip "${clip.title || 'clip'}"...`, 'info', 'processing');
            const ext = path.extname(localPath) || '.mp4';
            const entryName = `${i + 1}-${ratingPart}${streamerPart}${safeTitle}${ext}`;

            await new Promise<void>((resolveEntry, rejectEntry) => {
              let settled = false;
              const timeoutTimer = setTimeout(() => {
                if (!settled) {
                  settled = true;
                  cleanup();
                  rejectEntry(new Error(`Timed out packing local clip "${clip.title}"`));
                }
              }, 30000);

              const onEntry = (e: any) => {
                if (e.name === entryName) {
                  if (!settled) {
                    settled = true;
                    cleanup();
                    resolveEntry();
                  }
                }
              };
              const onError = (err: any) => {
                if (!settled) {
                  settled = true;
                  cleanup();
                  rejectEntry(err);
                }
              };
              const cleanup = () => {
                clearTimeout(timeoutTimer);
                archive.off('entry', onEntry);
                archive.off('error', onError);
              };

              archive.on('entry', onEntry);
              archive.on('error', onError);
              archive.file(localPath, { name: entryName });
            });
          } else {
            logAndEmit(`Local file not found for ${clip.title}: ${localPath}`, 'warning');
          }
        }

        const processingDuration = Date.now() - clipStart;
        job.processed++;
        wsManager.emitClipProcessed(jobId, i, clip, processingDuration);
        wsManager.emitJobProgress(jobId, job.processed, job.total);
      } catch (clipErr: any) {
        if (isCancelled || (job.status as string) === 'cancelled') {
          return;
        }
        logAndEmit(`Error packing clip ${clip.title}: ${clipErr.message}`, 'warning');
        wsManager.emitClipError(jobId, i, clip, clipErr.message);
        job.processed++;
        wsManager.emitJobProgress(jobId, job.processed, job.total);
      }
    }

    if (isCancelled || (job.status as string) === 'cancelled') {
      logAndEmit('Processing cancelled by user. Discarding archive...', 'warn', 'cancelled');
      return;
    }

    logAndEmit('Finalizing zip archive stream...', 'info', 'archiving');
    await archive.finalize();
    await zipFinalized;
    logAndEmit('Clip processing pipeline fully completed', 'info', 'completed');
  } catch (error: any) {
    if (isCancelled || (job.status as string) === 'cancelled') {
      logAndEmit('Job was cancelled by administrator', 'warn', 'cancelled');
      return;
    }
    logAndEmit(`Fatal job error: ${error.message}`, 'error', 'error');
    job.status = 'error';
    job.phase = 'error';
    job.error = error.message;
    wsManager.emitJobError(jobId, error.message);
  } finally {
    activeJobCleanups.delete(jobId);
  }
}

export function getJobStatus(jobId: string): any {
  const job = processingJobs[jobId];
  if (!job) return null;

  const progress = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
  return {
    jobId: job.jobId || jobId,
    total: job.total,
    processed: job.processed,
    status: job.status,
    phase: job.phase,
    progress,
    season: job.season,
    year: job.year,
    startTime: job.startTime,
    endTime: job.endTime || null,
    zipFilename: job.zipFilename || null,
    zipId: job.zipId || null,
    error: job.error || null,
    logs: job.logs || [],
    elapsedTime: Date.now() - job.startTime,
  };
}

export function getAllProcessingJobs(): any[] {
  return Object.entries(processingJobs)
    .map(([id, job]) => {
      const progress = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
      return {
        jobId: job.jobId || id,
        total: job.total,
        processed: job.processed,
        status: job.status,
        phase: job.phase,
        progress,
        season: job.season,
        year: job.year,
        startTime: job.startTime,
        endTime: job.endTime || null,
        zipFilename: job.zipFilename || null,
        zipId: job.zipId || null,
        error: job.error || null,
        logs: job.logs || [],
        elapsedTime: Date.now() - job.startTime,
      };
    })
    .sort((a, b) => b.startTime - a.startTime);
}

export async function forceCompleteJob(jobId: string): Promise<any> {
  const job = processingJobs[jobId];
  if (!job) return null;

  const zipFilename = `manual-processed-${Date.now()}.zip`;
  const seasonZip = new Zip({
    url: `/download/${zipFilename}`,
    season: job.season as any,
    year: Number(job.year),
    name: zipFilename,
    size: 0,
    clipAmount: job.total,
  });

  await seasonZip.save();

  job.zipFilename = zipFilename;
  job.zipId = seasonZip._id;
  job.status = 'completed';
  job.phase = 'completed';
  job.endTime = Date.now();
  job.processed = job.total;

  wsManager.emitJobCompleted(
    jobId,
    {
      zipFilename,
      zipId: seasonZip._id,
      size: '0 Bytes',
      url: `/download/${zipFilename}`,
    },
    Date.now() - job.startTime
  );

  return job;
}

export async function cancelProcessingJob(jobId: string): Promise<boolean> {
  const job = processingJobs[jobId];
  if (!job) return false;

  if (job.status !== 'processing') {
    return false;
  }

  job.status = 'cancelled';
  job.phase = 'cancelled';
  job.endTime = Date.now();
  job.logs.push({
    time: Date.now(),
    message: 'Job cancelled by administrator.',
    level: 'warn',
  });

  const cleanup = activeJobCleanups.get(jobId);
  if (cleanup) {
    cleanup();
    activeJobCleanups.delete(jobId);
  }

  wsManager.emitJobCancelled(jobId, 'Job cancelled by administrator');

  return true;
}
