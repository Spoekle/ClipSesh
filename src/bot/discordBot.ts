import { Client, GatewayIntentBits, ActivityType, Message } from 'discord.js';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import ytdl from '@distube/ytdl-core';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import { AdminConfig, PublicConfig } from '@/models/configModel';
import { getCurrentSeason, getClipPath } from '@/lib/seasonHelpers';

// Semaphore for limiting concurrent video processing
class AsyncSemaphore {
  private max: number;
  private current: number = 0;
  private queue: (() => void)[] = [];

  constructor(max: number) {
    this.max = max;
  }

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.current++;
  }

  release(): void {
    this.current--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

const processingSemaphore = new AsyncSemaphore(2);
let discordClient: Client | null = null;

/**
 * Downloads a video from a supported URL (YouTube, Twitch, Medal, or direct video)
 */
async function downloadFromUrl(
  url: string,
  tempPath: string
): Promise<{ title: string; streamer: string }> {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.toLowerCase();

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    console.log(`[DiscordBot] Downloading YouTube video from: ${url}`);
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highest',
      filter: 'audioandvideo',
    });

    await new Promise<void>((resolve, reject) => {
      const stream = ytdl(url, { format });
      const writeStream = fs.createWriteStream(tempPath);
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
      stream.on('error', (err) => reject(err));
    });

    return {
      title: info.videoDetails.title || 'YouTube Clip',
      streamer: info.videoDetails.author?.name || 'YouTube Streamer',
    };
  }

  if (hostname.includes('twitch.tv')) {
    console.log(`[DiscordBot] Scraping Twitch clip: ${url}`);
    const res = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });
    const html = res.data as string;
    const mp4Match = html.match(/(https:\/\/[^"]+\.mp4[^"]*)/);
    if (!mp4Match || !mp4Match[1]) {
      throw new Error('Could not find Twitch mp4 download link');
    }

    const downloadUrl = mp4Match[1];
    const streamRes = await axios.get(downloadUrl, {
      responseType: 'stream',
      timeout: 30000,
    });
    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(tempPath);
      streamRes.data.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err: any) => reject(err));
    });

    const slug = url.split('/').pop() || 'Clip';
    return {
      title: `Twitch Clip ${slug}`,
      streamer: 'Twitch Streamer',
    };
  }

  if (hostname.includes('medal.tv')) {
    console.log(`[DiscordBot] Scraping Medal clip: ${url}`);
    const res = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });
    const html = res.data as string;
    const mp4Match = html.match(/(https:\/\/[^"]+\.mp4[^"]*)/);
    if (!mp4Match || !mp4Match[1]) {
      throw new Error('Could not find Medal.tv mp4 link');
    }

    const downloadUrl = mp4Match[1];
    const streamRes = await axios.get(downloadUrl, {
      responseType: 'stream',
      timeout: 30000,
    });
    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(tempPath);
      streamRes.data.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err: any) => reject(err));
    });

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Medal.tv Clip';
    return {
      title,
      streamer: 'Medal.tv User',
    };
  }

  // Fallback: Direct video URL download
  console.log(`[DiscordBot] Downloading direct video from: ${url}`);
  const streamRes = await axios.get(url, {
    responseType: 'stream',
    timeout: 30000,
  });
  await new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(tempPath);
    streamRes.data.pipe(writeStream);
    writeStream.on('finish', () => resolve());
    writeStream.on('error', (err: any) => reject(err));
  });

  return {
    title: path.basename(parsedUrl.pathname) || 'Direct Video',
    streamer: 'Unknown',
  };
}

/**
 * Handles incoming Discord messages for clip ingestion
 */
async function handleMessage(message: Message): Promise<void> {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Verify database connection
  await connectToDatabase();

  // Fetch admin configuration
  const adminConfig = await AdminConfig.findOne().lean();
  const clipChannels = adminConfig?.clipChannelIds || [];

  // Check if channel is monitored
  if (!clipChannels.includes(message.channelId)) {
    return;
  }

  // Check if submitter is blacklisted
  const blacklistedSubmitters = adminConfig?.blacklistedSubmitters || [];
  const isSubmitterBlocked = blacklistedSubmitters.some(
    (s) => s.userId && s.userId.trim() === message.author.id
  );
  if (isSubmitterBlocked) {
    console.log(
      `[DiscordBot] 🚫 Blocked submitter: ${message.author.username} (${message.author.id})`
    );
    return;
  }

  // Check for attachments or URLs
  const videoExtRegex = /\.(mp4|mov|webm|m4v)$/i;
  const attachment = message.attachments.find((att) =>
    videoExtRegex.test(att.name || att.url)
  );

  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matchedUrls = message.content ? message.content.match(urlRegex) : null;
  const targetUrl = matchedUrls && matchedUrls.length > 0 ? matchedUrls[0] : null;

  if (!attachment && !targetUrl) {
    return;
  }

  // Process clip in background with concurrency throttle
  processingSemaphore.runExclusive(async () => {
    const uploadsBaseDir = path.join(process.cwd(), 'uploads');
    const tmpDir = path.join(process.cwd(), 'download', 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = Date.now();
    const tempDownloadedPath = path.join(tmpDir, `raw_${timestamp}.mp4`);

    try {
      console.log(`[DiscordBot] 🎬 Ingesting clip from ${message.author.username}...`);

      let detectedTitle = 'Discord Clip';
      let detectedStreamer = message.author.displayName || message.author.username;
      let clipLink = message.url;

      if (attachment) {
        // Download attachment
        console.log(`[DiscordBot] Downloading attachment: ${attachment.name}`);
        const streamRes = await axios.get(attachment.url, {
          responseType: 'stream',
          timeout: 60000,
        });
        await new Promise<void>((resolve, reject) => {
          const writeStream = fs.createWriteStream(tempDownloadedPath);
          streamRes.data.pipe(writeStream);
          writeStream.on('finish', () => resolve());
          writeStream.on('error', (err: any) => reject(err));
        });

        // Use content as title if present, otherwise default
        const contentText = message.content?.trim();
        if (contentText) {
          detectedTitle = contentText;
        }
      } else if (targetUrl) {
        // Download from URL
        clipLink = targetUrl;
        const result = await downloadFromUrl(targetUrl, tempDownloadedPath);
        detectedTitle = result.title || detectedTitle;
        if (result.streamer && result.streamer !== 'Unknown') {
          detectedStreamer = result.streamer;
        }
      }

      // Check if streamer is blacklisted
      const blacklistedStreamers = adminConfig?.blacklistedStreamers || [];
      const isStreamerBlocked = blacklistedStreamers.some(
        (s) => s.trim().toLowerCase() === detectedStreamer.trim().toLowerCase()
      );
      if (isStreamerBlocked) {
        console.log(
          `[DiscordBot] 🚫 Blocked streamer: '${detectedStreamer}' is on the streamer blacklist.`
        );
        return;
      }

      // Prepare target destination in uploads/
      const finalFilename = `${timestamp}_clip.mp4`;
      const uploadDate = new Date();
      const { fullPath, relativePath, directory } = getClipPath(
        uploadsBaseDir,
        finalFilename,
        uploadDate
      );

      // Compress video using ffmpeg
      console.log(`[DiscordBot] Compressing video to: ${fullPath}`);
      await new Promise<void>((resolve) => {
        ffmpeg(tempDownloadedPath)
          .outputOptions(['-vcodec', 'libx264', '-crf', '23'])
          .output(fullPath)
          .on('end', () => {
            console.log('[DiscordBot] Video compression completed');
            resolve();
          })
          .on('error', (err) => {
            console.warn('[DiscordBot] FFmpeg compression warning (fallback to copy):', err.message);
            try {
              fs.copyFileSync(tempDownloadedPath, fullPath);
            } catch (copyErr) {
              console.error('[DiscordBot] Failed to copy fallback file:', copyErr);
            }
            resolve();
          })
          .run();
      });

      // Generate thumbnail
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
        console.warn('[DiscordBot] Thumbnail generation error:', thumbErr);
      }

      const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
      const thumbRelative = path.relative(uploadsBaseDir, thumbnailFullPath);
      const thumbnailUrl = fs.existsSync(thumbnailFullPath)
        ? `/uploads/${thumbRelative.replace(/\\/g, '/')}`
        : undefined;

      const { season, year } = getCurrentSeason(uploadDate);
      const capitalizedSeason = (season.charAt(0).toUpperCase() + season.slice(1)) as any;

      // Save clip document to MongoDB
      const newClip = new Clip({
        url: fileUrl,
        thumbnail: thumbnailUrl,
        streamer: detectedStreamer,
        submitter: message.author.displayName || message.author.username,
        title: detectedTitle,
        link: clipLink,
        discordSubmitterId: message.author.id,
        season: capitalizedSeason,
        year,
      });

      await newClip.save();

      // Update public clip amount
      const count = await Clip.countDocuments({ archived: { $ne: true } });
      await PublicConfig.findOneAndUpdate(
        {},
        { clipAmount: count },
        { upsert: true, new: true }
      );

      // Emit live notification if Socket.IO is initialized
      if (global.socketIoInstance) {
        global.socketIoInstance.emit('newClip', newClip);
      }

      // React to the original message to confirm successful ingestion
      try {
        await message.react('✅');
      } catch (reactErr) {
        console.warn('[DiscordBot] Could not add reaction to Discord message:', reactErr);
      }

      console.log(`[DiscordBot] 🚀 Clip successfully saved: "${detectedTitle}" by ${detectedStreamer}`);
    } catch (err: any) {
      console.error('[DiscordBot] ❌ Error processing clip:', err);
    } finally {
      // Clean up temporary downloaded file
      if (fs.existsSync(tempDownloadedPath)) {
        try {
          fs.unlinkSync(tempDownloadedPath);
        } catch {}
      }
    }
  });
}

/**
 * Starts the Discord bot if DISCORD_BOT_TOKEN is present
 */
export async function startDiscordBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token || token.trim() === '') {
    console.log(
      '[DiscordBot] ℹ️ DISCORD_BOT_TOKEN is not configured in environment. Skipping Discord bot startup.'
    );
    return;
  }

  try {
    console.log('[DiscordBot] 🤖 Initializing Discord bot client...');
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    discordClient.on('ready', () => {
      console.log(`[DiscordBot] ✅ Bot logged in as ${discordClient?.user?.tag}`);
      discordClient?.user?.setActivity('for clips', {
        type: ActivityType.Watching,
      });
    });

    discordClient.on('messageCreate', (message) => {
      handleMessage(message).catch((err) => {
        console.error('[DiscordBot] Unhandled error in messageCreate:', err);
      });
    });

    await discordClient.login(token);
  } catch (err: any) {
    console.error('[DiscordBot] ❌ Failed to start Discord bot:', err?.message || err);
  }
}

/**
 * Gracefully shuts down the Discord bot client
 */
export async function stopDiscordBot(): Promise<void> {
  if (discordClient) {
    console.log('[DiscordBot] Shutting down Discord bot client...');
    try {
      await discordClient.destroy();
      discordClient = null;
      console.log('[DiscordBot] Discord bot stopped.');
    } catch (err) {
      console.error('[DiscordBot] Error during shutdown:', err);
    }
  }
}
