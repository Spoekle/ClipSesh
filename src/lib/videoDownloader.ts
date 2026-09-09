import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { execFile } from 'child_process';

/**
 * Resolves the yt-dlp binary path, checking standard Homebrew / system paths.
 */
function getYtDlpPath(): string {
  if (fs.existsSync('/opt/homebrew/bin/yt-dlp')) return '/opt/homebrew/bin/yt-dlp';
  if (fs.existsSync('/usr/local/bin/yt-dlp')) return '/usr/local/bin/yt-dlp';
  return 'yt-dlp';
}

/**
 * Downloads a video from a supported URL (Twitch, YouTube, Medal, or direct video)
 * using yt-dlp (matching the original Discord bot behavior) with direct stream fallback.
 */
export async function downloadFromUrl(
  url: string,
  tempPath: string
): Promise<{ title: string; streamer: string }> {
  const parsedUrl = new URL(url);
  const isDirectVideo = /\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(url) || url.includes('cdn.discordapp.com/attachments');

  // Direct video file links: stream directly with axios
  if (isDirectVideo) {
    console.log(`[VideoDownloader] 📥 Downloading direct video stream: ${url}`);
    const streamRes = await axios.get(url, {
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
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

  // All platform URLs (Twitch, YouTube, Medal.tv) ingested with yt-dlp like the original bot
  console.log(`[VideoDownloader] 🎬 Ingesting video via yt-dlp from: ${url}`);
  const ytDlpBin = getYtDlpPath();

  return new Promise<{ title: string; streamer: string }>((resolve, reject) => {
    // 1. Fetch metadata first to get accurate title and streamer
    execFile(
      ytDlpBin,
      ['--dump-json', '--no-playlist', url],
      { timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
      (metaErr, stdout) => {
        let detectedTitle = 'Clip';
        let detectedStreamer = 'Unknown';

        if (!metaErr && stdout) {
          try {
            const info = JSON.parse(stdout);
            detectedTitle = info.title || detectedTitle;
            detectedStreamer =
              info.creator ||
              info.channel ||
              info.uploader ||
              (Array.isArray(info.creators) && info.creators[0]) ||
              detectedStreamer;
          } catch (jsonErr: any) {
            console.warn('[VideoDownloader] Failed to parse yt-dlp metadata JSON:', jsonErr.message);
          }
        }

        // 2. Download and merge into mp4 at tempPath
        const downloadArgs = [
          '-f',
          'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best',
          '--merge-output-format',
          'mp4',
          '--no-playlist',
          '--force-overwrites',
          '-o',
          tempPath,
          url,
        ];

        execFile(
          ytDlpBin,
          downloadArgs,
          { timeout: 180000, maxBuffer: 10 * 1024 * 1024 },
          (dlErr, _dlStdout, dlStderr) => {
            if (dlErr) {
              const errMsg = dlStderr ? dlStderr.trim() : dlErr.message;
              console.error(`[VideoDownloader] ❌ yt-dlp download failed: ${errMsg}`);
              return reject(new Error(`yt-dlp download failed: ${errMsg}`));
            }

            if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
              return reject(new Error('Downloaded video file is missing or empty'));
            }

            console.log(
              `[VideoDownloader] ✅ Successfully downloaded "${detectedTitle}" (${detectedStreamer})`
            );
            resolve({
              title: detectedTitle,
              streamer: detectedStreamer,
            });
          }
        );
      }
    );
  });
}
