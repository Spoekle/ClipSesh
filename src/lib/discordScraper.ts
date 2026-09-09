import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import { PublicConfig, AdminConfig } from '@/models/configModel';
import { getCurrentSeason, getClipPath, getDailyDirectory } from '@/lib/seasonHelpers';
import { downloadFromUrl } from '@/lib/videoDownloader';

export interface ScrapedClipItem {
  id: string;
  link: string;
  origin: 'youtube' | 'twitch' | 'medal' | 'direct_video';
  author: string;
  authorId?: string;
  timestamp: string; // ISO date string from Discord
  messageId: string;
  content?: string;
  title: string;
  streamer: string;
  season: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  year: number;
  destinationFolder: string;
  alreadyExists: boolean;
}

export interface ChannelScanJob {
  jobId: string;
  channelId: string;
  status: 'scanning' | 'ready' | 'error' | 'stopped';
  scannedMessages: number;
  foundClipsCount: number;
  error?: string;
  startTime: number;
  endTime?: number;
  clips: ScrapedClipItem[];
  stats: {
    totalMessages: number;
    totalClips: number;
    newClips: number;
    existingClips: number;
    origins: {
      youtube: number;
      twitch: number;
      medal: number;
      direct_video: number;
    };
    seasons: Record<string, number>;
  };
}

export interface ScraperDownloadJob {
  jobId: string;
  status: 'downloading' | 'completed' | 'error' | 'stopped';
  total: number;
  processed: number;
  currentClip?: string;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  startTime: number;
  endTime?: number;
  error?: string;
  logs: Array<{
    time: number;
    message: string;
    level: 'info' | 'success' | 'warn' | 'error';
  }>;
  results: Array<{
    link: string;
    title: string;
    season: string;
    year: number;
    status: 'saved' | 'skipped' | 'failed';
    error?: string;
  }>;
}

declare global {
  // eslint-disable-next-line no-var
  var discordScanJobsStore: Record<string, ChannelScanJob> | undefined;
  // eslint-disable-next-line no-var
  var discordDownloadJobsStore: Record<string, ScraperDownloadJob> | undefined;
}

const scanJobs: Record<string, ChannelScanJob> =
  global.discordScanJobsStore || (global.discordScanJobsStore = {});

const downloadJobs: Record<string, ScraperDownloadJob> =
  global.discordDownloadJobsStore || (global.discordDownloadJobsStore = {});

const URL_REGEX = /https?:\/\/[^\s<>"')]+[^\s<>"'.,;:!?)\]]/gi;
const VIDEO_EXT_REGEX = /\.(mp4|mov|webm|m4v)$/i;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Validates and identifies clip origins matching the bot's supported platforms:
 * - YouTube Clips (youtube.com/clip/...) - Full YouTube videos (/watch, youtu.be, /shorts, /live, etc.) are excluded
 * - Twitch (accepts all Twitch URLs: clips, streams, vods)
 * - Medal (accepts all Medal.tv URLs)
 * - Direct video files (.mp4, .mov, .webm, .m4v)
 */
export function getClipOrigin(rawUrl: string): 'youtube' | 'twitch' | 'medal' | 'direct_video' | null {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // 1. YouTube - Only allow dedicated clips (youtube.com/clip/...)
    // Full YouTube videos (/watch?v=..., youtu.be/..., /shorts/..., /live/..., etc.) are excluded
    if (host.includes('youtube.com')) {
      if (pathname.startsWith('/clip/') || pathname === '/clip' || parsed.searchParams.has('clip')) {
        return 'youtube';
      }
      return null;
    }
    if (host.includes('youtu.be')) {
      // youtu.be links are shortlinks to full videos, never clips
      return null;
    }

    // 2. Twitch
    if (host.includes('twitch.tv')) {
      return 'twitch';
    }

    // 3. Medal
    if (host.includes('medal.tv')) {
      return 'medal';
    }

    // 4. Direct video attachments or URLs (.mp4, .mov, .webm, .m4v)
    if (VIDEO_EXT_REGEX.test(pathname)) {
      return 'direct_video';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches Discord messages in batches of 100 with rate limit handling
 */
async function fetchDiscordMessages(
  channelId: string,
  botToken: string,
  beforeId: string | null = null
): Promise<any[]> {
  const url = new URL(`https://discord.com/api/v10/channels/${channelId}/messages`);
  url.searchParams.set('limit', '100');
  if (beforeId) {
    url.searchParams.set('before', beforeId);
  }

  while (true) {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bot ${botToken}`,
        'User-Agent': 'DiscordBot (ClipSeshScraper, 1.0.0)',
      },
    });

    if (res.status === 429) {
      const retryData = await res.json().catch(() => ({}));
      const retryAfter = (retryData.retry_after || 1) * 1000;
      await sleep(retryAfter + 200);
      continue;
    }

    if (res.status === 403) {
      throw new Error(
        'HTTP 403 Forbidden: The bot does not have permission to view or read history in this channel. Make sure the bot has "View Channel" and "Read Message History" in this channel.'
      );
    }

    if (res.status === 404) {
      throw new Error('HTTP 404 Not Found: Channel not found or bot does not have access.');
    }

    if (res.status === 401) {
      throw new Error('HTTP 401 Unauthorized: Invalid DISCORD_BOT_TOKEN.');
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Discord API error ${res.status}: ${errText}`);
    }

    return await res.json();
  }
}

/**
 * Scans a Discord channel for all clips and registers job state
 */
export function startChannelScan(channelId: string, botToken: string): ChannelScanJob {
  const jobId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const job: ChannelScanJob = {
    jobId,
    channelId,
    status: 'scanning',
    scannedMessages: 0,
    foundClipsCount: 0,
    startTime: Date.now(),
    clips: [],
    stats: {
      totalMessages: 0,
      totalClips: 0,
      newClips: 0,
      existingClips: 0,
      origins: {
        youtube: 0,
        twitch: 0,
        medal: 0,
        direct_video: 0,
      },
      seasons: {},
    },
  };

  scanJobs[jobId] = job;

  // Run scan in background
  (async () => {
    try {
      await connectToDatabase();
      const uploadsBaseDir = path.join(process.cwd(), 'uploads');
      const uniqueLinks = new Set<string>();
      const rawRecords: Array<{
        link: string;
        origin: 'youtube' | 'twitch' | 'medal' | 'direct_video';
        author: string;
        authorId?: string;
        timestamp: string;
        messageId: string;
        content?: string;
      }> = [];

      let beforeId: string | null = null;

      while (true) {
        if (job.status === 'stopped') {
          job.error = 'Scan cancelled by user';
          job.endTime = Date.now();
          return;
        }

        const messages = await fetchDiscordMessages(channelId, botToken, beforeId);
        if (!messages || messages.length === 0) {
          break;
        }

        job.scannedMessages += messages.length;

        for (const msg of messages) {
          const candidates: string[] = [];

          // 1. Message content URLs
          if (msg.content) {
            const matches = msg.content.match(URL_REGEX);
            if (matches) {
              candidates.push(...matches);
            }
          }

          // 2. Video attachments
          if (Array.isArray(msg.attachments)) {
            for (const att of msg.attachments) {
              if (
                att.url &&
                (VIDEO_EXT_REGEX.test(att.name || '') ||
                  VIDEO_EXT_REGEX.test(att.url.split('?')[0]))
              ) {
                candidates.push(att.url);
              }
            }
          }

          // 3. Embeds
          if (Array.isArray(msg.embeds)) {
            for (const emb of msg.embeds) {
              if (emb.url) candidates.push(emb.url);
            }
          }

          const authorName =
            msg.author?.global_name ||
            (msg.author?.username
              ? `${msg.author.username}${
                  msg.author.discriminator && msg.author.discriminator !== '0'
                    ? `#${msg.author.discriminator}`
                    : ''
                }`
              : 'Unknown Submitter');

          for (const link of candidates) {
            const origin = getClipOrigin(link);
            if (!origin) continue;

            if (!uniqueLinks.has(link)) {
              uniqueLinks.add(link);
              rawRecords.push({
                link,
                origin,
                author: authorName,
                authorId: msg.author?.id,
                timestamp: msg.timestamp,
                messageId: msg.id,
                content: msg.content?.trim(),
              });
              job.foundClipsCount = rawRecords.length;
            }
          }
        }

        beforeId = messages[messages.length - 1].id;
        // Polite delay
        await sleep(200);
      }

      // Check existing clips in MongoDB
      const existingClips = await Clip.find({
        link: { $in: Array.from(uniqueLinks) },
      })
        .select('link')
        .lean();

      const existingLinkSet = new Set(existingClips.map((c) => c.link));

      const finalClips: ScrapedClipItem[] = [];
      const origins = {
        youtube: 0,
        twitch: 0,
        medal: 0,
        direct_video: 0,
      };
      const seasons: Record<string, number> = {};
      let newClipsCount = 0;
      let existingClipsCount = 0;

      for (const rec of rawRecords) {
        const msgDate = new Date(rec.timestamp);
        const { season, year } = getCurrentSeason(msgDate);
        const capitalizedSeason = (season.charAt(0).toUpperCase() +
          season.slice(1)) as 'Winter' | 'Spring' | 'Summer' | 'Fall';

        const seasonKey = `${capitalizedSeason} ${year}`;
        seasons[seasonKey] = (seasons[seasonKey] || 0) + 1;
        origins[rec.origin] = (origins[rec.origin] || 0) + 1;

        const alreadyExists = existingLinkSet.has(rec.link);
        if (alreadyExists) {
          existingClipsCount++;
        } else {
          newClipsCount++;
        }

        const targetDailyDir = getDailyDirectory(uploadsBaseDir, msgDate);
        const destinationFolder = path.relative(process.cwd(), targetDailyDir).replace(/\\/g, '/');

        let title = rec.content || `${rec.origin.toUpperCase()} Clip`;
        if (title.length > 80) {
          title = title.substring(0, 77) + '...';
        }

        finalClips.push({
          id: `${rec.messageId}_${Math.random().toString(36).substring(2, 6)}`,
          link: rec.link,
          origin: rec.origin,
          author: rec.author,
          authorId: rec.authorId,
          timestamp: rec.timestamp,
          messageId: rec.messageId,
          content: rec.content,
          title,
          streamer: rec.author,
          season: capitalizedSeason,
          year,
          destinationFolder,
          alreadyExists,
        });
      }

      job.clips = finalClips;
      job.stats = {
        totalMessages: job.scannedMessages,
        totalClips: finalClips.length,
        newClips: newClipsCount,
        existingClips: existingClipsCount,
        origins,
        seasons,
      };
      job.status = 'ready';
      job.endTime = Date.now();
    } catch (err: any) {
      console.error('[DiscordScraper] Scan error:', err);
      job.status = 'error';
      job.error = err?.message || 'Failed to scan Discord channel';
      job.endTime = Date.now();
    }
  })();

  return job;
}

export function getScanJob(jobId: string): ChannelScanJob | null {
  return scanJobs[jobId] || null;
}

export function getAllScanJobs(): ChannelScanJob[] {
  return Object.values(scanJobs).sort((a, b) => b.startTime - a.startTime);
}

export function stopScanJob(jobId: string): boolean {
  const job = scanJobs[jobId];
  if (job && job.status === 'scanning') {
    job.status = 'stopped';
    job.error = 'Scan cancelled by user';
    job.endTime = Date.now();
    return true;
  }
  return false;
}

/**
 * Downloads and ingests scraped clips using the message timestamp
 * as dateCreated, season, year, and seasonal directory path.
 */
export function startScraperDownload(clipsToDownload: ScrapedClipItem[]): ScraperDownloadJob {
  const jobId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const job: ScraperDownloadJob = {
    jobId,
    status: 'downloading',
    total: clipsToDownload.length,
    processed: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    startTime: Date.now(),
    logs: [
      {
        time: Date.now(),
        message: `Starting download of ${clipsToDownload.length} clips...`,
        level: 'info',
      },
    ],
    results: [],
  };

  downloadJobs[jobId] = job;

  (async () => {
    await connectToDatabase();
    const uploadsBaseDir = path.join(process.cwd(), 'uploads');
    const tmpDir = path.join(process.cwd(), 'download', 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const adminConfig = await AdminConfig.findOne().lean();
    const blacklistedStreamers = adminConfig?.blacklistedStreamers || [];
    const blacklistedSubmitters = adminConfig?.blacklistedSubmitters || [];

    for (let i = 0; i < clipsToDownload.length; i++) {
      if (job.status === 'stopped') {
        job.logs.push({
          time: Date.now(),
          message: 'Download job cancelled by user.',
          level: 'warn',
        });
        break;
      }

      const clip = clipsToDownload[i];
      job.currentClip = clip.title || clip.link;
      const msgDate = new Date(clip.timestamp);
      const timestamp = msgDate.getTime();
      const tempDownloadedPath = path.join(tmpDir, `raw_scrape_${Date.now()}_${i}.mp4`);

      try {
        // Check submitter blacklist
        const isSubmitterBlocked =
          clip.authorId &&
          blacklistedSubmitters.some((s) => s.userId && s.userId.trim() === clip.authorId);
        if (isSubmitterBlocked) {
          job.skippedCount++;
          job.logs.push({
            time: Date.now(),
            message: `Skipped: Submitter ${clip.author} is blacklisted.`,
            level: 'warn',
          });
          job.results.push({
            link: clip.link,
            title: clip.title,
            season: clip.season,
            year: clip.year,
            status: 'skipped',
            error: 'Blacklisted submitter',
          });
          job.processed = i + 1;
          continue;
        }

        // Check if clip already exists
        const existing = await Clip.findOne({ link: clip.link }).lean();
        if (existing) {
          job.skippedCount++;
          job.logs.push({
            time: Date.now(),
            message: `Skipped: "${clip.title}" already exists in database.`,
            level: 'info',
          });
          job.results.push({
            link: clip.link,
            title: clip.title,
            season: clip.season,
            year: clip.year,
            status: 'skipped',
            error: 'Already exists',
          });
          job.processed = i + 1;
          continue;
        }

        job.logs.push({
          time: Date.now(),
          message: `Downloading [${i + 1}/${clipsToDownload.length}]: ${clip.title}...`,
          level: 'info',
        });

        // 1. Download video
        let detectedTitle = clip.title;
        let detectedStreamer = clip.streamer || clip.author;

        if (clip.origin === 'direct_video') {
          const streamRes = await axios.get(clip.link, {
            responseType: 'stream',
            timeout: 60000,
          });
          await new Promise<void>((resolve, reject) => {
            const writeStream = fs.createWriteStream(tempDownloadedPath);
            streamRes.data.pipe(writeStream);
            writeStream.on('finish', () => resolve());
            writeStream.on('error', (err: any) => reject(err));
          });
        } else {
          const dlResult = await downloadFromUrl(clip.link, tempDownloadedPath);
          if (dlResult.title && dlResult.title !== 'YouTube Clip') {
            detectedTitle = dlResult.title;
          }
          if (dlResult.streamer && dlResult.streamer !== 'Unknown') {
            detectedStreamer = dlResult.streamer;
          }
        }

        // Check streamer blacklist
        const isStreamerBlocked = blacklistedStreamers.some(
          (s) => s.trim().toLowerCase() === detectedStreamer.trim().toLowerCase()
        );
        if (isStreamerBlocked) {
          job.skippedCount++;
          job.logs.push({
            time: Date.now(),
            message: `Skipped: Streamer ${detectedStreamer} is blacklisted.`,
            level: 'warn',
          });
          job.results.push({
            link: clip.link,
            title: detectedTitle,
            season: clip.season,
            year: clip.year,
            status: 'skipped',
            error: 'Blacklisted streamer',
          });
          job.processed = i + 1;
          continue;
        }

        // 2. Prepare target destination using messageDate timestamp
        const finalFilename = `${timestamp}_${Math.random().toString(36).substring(2, 8)}_clip.mp4`;
        const { fullPath, relativePath, directory } = getClipPath(
          uploadsBaseDir,
          finalFilename,
          msgDate
        );

        // 3. Compress video via ffmpeg
        await new Promise<void>((resolve) => {
          ffmpeg(tempDownloadedPath)
            .outputOptions(['-vcodec', 'libx264', '-crf', '23'])
            .output(fullPath)
            .on('end', () => resolve())
            .on('error', (err) => {
              console.warn('[DiscordScraper] FFmpeg compression warning (fallback to copy):', err.message);
              try {
                fs.copyFileSync(tempDownloadedPath, fullPath);
              } catch (copyErr) {
                console.error('[DiscordScraper] Failed to copy fallback file:', copyErr);
              }
              resolve();
            })
            .run();
        });

        // 4. Generate thumbnail via ffmpeg
        const thumbnailFilename = `${path.parse(finalFilename).name}_thumbnail.png`;
        const thumbnailFullPath = path.join(directory, thumbnailFilename);
        try {
          await new Promise<void>((resolve, reject) => {
            ffmpeg(fullPath)
              .screenshots({
                timestamps: ['00:00:00.001'],
                filename: thumbnailFilename,
                folder: directory,
                size: '640x360',
              })
              .on('end', () => resolve())
              .on('error', (err) => reject(err));
          });
        } catch (thumbErr) {
          console.warn('[DiscordScraper] Thumbnail generation warning:', thumbErr);
        }

        const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
        const thumbRelative = path.relative(uploadsBaseDir, thumbnailFullPath);
        const thumbnailUrl = fs.existsSync(thumbnailFullPath)
          ? `/uploads/${thumbRelative.replace(/\\/g, '/')}`
          : undefined;

        // 5. Save Clip with message timestamp as createdAt
        const newClip = new Clip({
          url: fileUrl,
          thumbnail: thumbnailUrl,
          streamer: detectedStreamer,
          submitter: clip.author,
          title: detectedTitle,
          link: clip.link,
          discordSubmitterId: clip.authorId,
          season: clip.season,
          year: clip.year,
          createdAt: msgDate,
          updatedAt: msgDate,
        });

        await newClip.save();
        job.successCount++;

        job.logs.push({
          time: Date.now(),
          message: `Saved: "${detectedTitle}" (${clip.season} ${clip.year}) to ${fileUrl}`,
          level: 'success',
        });

        job.results.push({
          link: clip.link,
          title: detectedTitle,
          season: clip.season,
          year: clip.year,
          status: 'saved',
        });

        // Emit Socket.IO notification if online
        if (global.socketIoInstance) {
          global.socketIoInstance.emit('newClip', newClip);
        }
      } catch (clipErr: any) {
        console.error('[DiscordScraper] Error downloading clip:', clipErr);
        job.errorCount++;
        job.logs.push({
          time: Date.now(),
          message: `Failed to ingest "${clip.title}": ${clipErr?.message || clipErr}`,
          level: 'error',
        });
        job.results.push({
          link: clip.link,
          title: clip.title,
          season: clip.season,
          year: clip.year,
          status: 'failed',
          error: clipErr?.message || 'Download error',
        });
      } finally {
        // Clean up temporary downloaded file
        if (fs.existsSync(tempDownloadedPath)) {
          try {
            fs.unlinkSync(tempDownloadedPath);
          } catch {}
        }
        job.processed = i + 1;
      }
    }

    // Update public clip count
    try {
      const count = await Clip.countDocuments({ archived: { $ne: true } });
      await PublicConfig.findOneAndUpdate(
        {},
        { clipAmount: count },
        { upsert: true, new: true }
      );
    } catch {}

    if (job.status !== 'stopped') {
      job.status = 'completed';
    }
    job.endTime = Date.now();
    job.logs.push({
      time: Date.now(),
      message: `Finished! Ingested ${job.successCount} clips, skipped ${job.skippedCount}, errors ${job.errorCount}.`,
      level: 'info',
    });
  })();

  return job;
}

export function getDownloadJob(jobId: string): ScraperDownloadJob | null {
  return downloadJobs[jobId] || null;
}

export function getAllDownloadJobs(): ScraperDownloadJob[] {
  return Object.values(downloadJobs).sort((a, b) => b.startTime - a.startTime);
}

export function stopDownloadJob(jobId: string): boolean {
  const job = downloadJobs[jobId];
  if (job && job.status === 'downloading') {
    job.status = 'stopped';
    job.endTime = Date.now();
    job.logs.push({
      time: Date.now(),
      message: 'Download job cancelled by user.',
      level: 'warn',
    });
    return true;
  }
  return false;
}
