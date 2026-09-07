import fs from 'fs';
import path from 'path';
import * as archiverPkg from 'archiver';
const archiver: any = (archiverPkg as any).default || archiverPkg;
import axios from 'axios';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import Rating from '@/models/ratingModel';
import Zip from '@/models/zipModel';
import { PublicConfig, AdminConfig } from '@/models/configModel';
import { wsManager } from '@/lib/WebSocketManager';

export interface ProcessingJob {
  total: number;
  processed: number;
  status: 'processing' | 'completed' | 'error';
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
  customDenyThreshold?: number
): Promise<{ jobId: string; total: number; supportedEvents: string[] }> {
  await connectToDatabase();
  cleanupOldJobs();

  let denyThreshold = customDenyThreshold;
  if (!denyThreshold) {
    const adminConfig = await AdminConfig.findOne().lean();
    denyThreshold = adminConfig?.denyThreshold || 5;
  }

  const clips = await Clip.find({
    season: { $regex: new RegExp(`^${season}$`, 'i') },
    year,
    archived: { $ne: true },
  }).select('-comments').lean();

  const clipIds = clips.map((c) => c._id);
  const ratings = await Rating.find({ clipId: { $in: clipIds } }).lean();
  const ratingsMap = new Map<string, any>(ratings.map((r) => [r.clipId.toString(), r]));

  const allowedClips: any[] = [];
  for (const clip of clips) {
    const ratingsDoc = ratingsMap.get(clip._id.toString());
    const denyCount = ratingsDoc?.ratings?.deny?.length || 0;
    if (denyCount < (denyThreshold || 5)) {
      allowedClips.push(clip);
    }
  }

  const jobId = `job-${Date.now()}`;
  const totalClips = allowedClips.length;

  processingJobs[jobId] = {
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

  const backendUrl = process.env.BACKEND_URL || '';
  const zipFilename = `${year}-${season}-processed-${Date.now()}.zip`;
  const zipPath = path.join(downloadDir, zipFilename);

  const logAndEmit = (message: string, level: string = 'info', phase: string | null = null) => {
    job.logs.push({ time: Date.now(), message, level });
    if (phase && phase !== job.phase) {
      job.phase = phase;
      wsManager.emitJobPhaseChange(jobId, phase, message);
    }
    console.log(`[Job ${jobId}] ${message}`);
  };

  try {
    logAndEmit('Starting clip processing task', 'info', 'starting');

    const zipStream = fs.createWriteStream(zipPath, {
      highWaterMark: 16 * 1024 * 1024,
    });

    const archive = archiver('zip', {
      zlib: { level: 3 },
      forceLocalTime: true,
      highWaterMark: 16 * 1024 * 1024,
    });

    const zipFinalized = new Promise<void>((resolve, reject) => {
      zipStream.on('close', async () => {
        try {
          logAndEmit('Zip stream closed. Finalizing...', 'info', 'finalizing');
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
          const allClipIds = allClips.map((c) => c._id);
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

          await updateClipCount();

          job.zipFilename = zipFilename;
          job.zipId = seasonZip._id;
          job.status = 'completed';
          job.phase = 'completed';
          job.endTime = Date.now();
          job.processed = job.total;

          const totalProcessingTime = job.endTime - job.startTime;
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
          logAndEmit(`Error in finalize: ${err.message}`, 'error');
          job.status = 'error';
          job.error = err.message;
          wsManager.emitJobError(jobId, err.message);
          reject(err);
        }
      });

      zipStream.on('error', (err) => {
        job.status = 'error';
        job.error = err.message;
        wsManager.emitJobError(jobId, err.message);
        reject(err);
      });
    });

    archive.pipe(zipStream);

    // Process clips
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      wsManager.emitClipProcessing(jobId, i, clip, Math.round((i / clips.length) * 100));

      try {
        if (clip.url.startsWith('http')) {
          const response = await axios.get(clip.url, { responseType: 'stream', timeout: 15000 });
          const ext = path.extname(clip.url.split('?')[0]) || '.mp4';
          const entryName = `${i + 1}-${clip.streamer || 'streamer'}-${clip.title.replace(/[^a-zA-Z0-9.-]/g, '_')}${ext}`;
          archive.append(response.data, { name: entryName });
        } else {
          // Local file
          const cleanUrl = clip.url.replace(/^\/?uploads\//, '');
          const localPath = path.join(process.cwd(), 'uploads', cleanUrl);
          if (fs.existsSync(localPath)) {
            const ext = path.extname(localPath) || '.mp4';
            const entryName = `${i + 1}-${clip.streamer || 'streamer'}-${clip.title.replace(/[^a-zA-Z0-9.-]/g, '_')}${ext}`;
            archive.file(localPath, { name: entryName });
          }
        }

        job.processed++;
        wsManager.emitClipProcessed(jobId, i, clip, 0);
        wsManager.emitJobProgress(jobId, job.processed, job.total);
      } catch (clipErr: any) {
        logAndEmit(`Error downloading clip ${clip.title}: ${clipErr.message}`, 'warning');
        wsManager.emitClipError(jobId, i, clip, clipErr.message);
        job.processed++;
      }
    }

    logAndEmit('Finalizing zip archive...', 'info', 'archiving');
    await archive.finalize();
    await zipFinalized;
    logAndEmit('Clip processing job fully completed', 'info', 'completed');
  } catch (error: any) {
    logAndEmit(`Fatal job error: ${error.message}`, 'error');
    job.status = 'error';
    job.error = error.message;
    wsManager.emitJobError(jobId, error.message);
  }
}

export function getJobStatus(jobId: string): any {
  const job = processingJobs[jobId];
  if (!job) return null;

  const progress = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
  return {
    jobId,
    total: job.total,
    processed: job.processed,
    status: job.status,
    progress,
    season: job.season,
    year: job.year,
    startTime: job.startTime,
    endTime: job.endTime || null,
    zipFilename: job.zipFilename || null,
    zipId: job.zipId || null,
    error: job.error || null,
    elapsedTime: Date.now() - job.startTime,
  };
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
  job.endTime = Date.now();

  return job;
}
