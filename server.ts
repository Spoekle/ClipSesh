import http from 'http';
import path from 'path';
import fs from 'fs';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { connectToDatabase } from './src/lib/db';
import { createOrUpdateAdminUser } from './src/lib/createAdmin';
import { startDiscordBot, stopDiscordBot } from './src/bot/discordBot';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Ensure media directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const profilePicturesDir = path.join(process.cwd(), 'profilePictures');
const downloadDir = path.join(process.cwd(), 'download');
const tmpChunksDir = path.join(process.cwd(), 'download', 'tmp');

[uploadsDir, profilePicturesDir, downloadDir, tmpChunksDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Ensured directory exists: ${dir}`);
  }
});

const legacyProfiles = path.join(process.cwd(), 'legacy', 'backend', 'src', 'profilePictures');

if (fs.existsSync(legacyProfiles)) {
  const defaultPlaceholder = path.join(legacyProfiles, 'profile_placeholder.png');
  const targetPlaceholder = path.join(profilePicturesDir, 'profile_placeholder.png');
  if (fs.existsSync(defaultPlaceholder) && !fs.existsSync(targetPlaceholder)) {
    try {
      fs.copyFileSync(defaultPlaceholder, targetPlaceholder);
    } catch {}
  }
}

// Helper to stream static media with Range requests, ETag caching, and security checks
async function serveStaticFile(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  relative: string,
  baseDir: string
): Promise<boolean> {
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(baseDir, relative);

  // Path traversal guard
  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    res.writeHead(403);
    res.end('Forbidden');
    return true;
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(resolvedPath);
    if (!stat.isFile()) return false;
  } catch {
    return false;
  }

  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(resolvedPath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const lastModified = stat.mtime.toUTCString();
  const cacheControl = 'public, max-age=86400, stale-while-revalidate=604800';

  // Check conditional request headers (ETag and If-Modified-Since)
  const clientEtag = req.headers['if-none-match'];
  const clientModifiedSince = req.headers['if-modified-since'];

  if (
    (clientEtag && clientEtag === etag) ||
    (clientModifiedSince && new Date(clientModifiedSince).getTime() >= Math.floor(stat.mtimeMs / 1000) * 1000)
  ) {
    res.writeHead(304, {
      'ETag': etag,
      'Last-Modified': lastModified,
      'Cache-Control': cacheControl,
    });
    res.end();
    return true;
  }

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'ETag': etag,
      'Last-Modified': lastModified,
      'Cache-Control': cacheControl,
    });

    const fileStream = fs.createReadStream(resolvedPath, { start, end });
    fileStream.on('error', () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'ETag': etag,
      'Last-Modified': lastModified,
      'Cache-Control': cacheControl,
    });

    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.on('error', () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    fileStream.pipe(res);
  }

  return true;
}

async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    await createOrUpdateAdminUser();

    // Prepare Next.js app
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();
    await app.prepare();

    // Create unified HTTP server
    const server = http.createServer(async (req, res) => {
      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
      const pathname = decodeURIComponent(parsedUrl.pathname);

      // Handle static file directories: /uploads, /profilePictures, /download
      if (pathname.startsWith('/uploads/')) {
        const relative = pathname.replace(/^\/uploads\//, '');
        if (await serveStaticFile(req, res, relative, uploadsDir)) return;
      } else if (pathname.startsWith('/profilePictures/')) {
        const relative = pathname.replace(/^\/profilePictures\//, '');
        if (await serveStaticFile(req, res, relative, profilePicturesDir)) return;
      } else if (pathname.startsWith('/download/')) {
        const relative = pathname.replace(/^\/download\//, '');
        if (await serveStaticFile(req, res, relative, downloadDir)) return;
      }

      // Delegate all other routes to Next.js handler
      handle(req, res);
    });

    // Attach Socket.IO
    const io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    global.socketIoInstance = io;

    io.on('connection', (socket) => {
      console.log('[Socket.IO] Client connected:', socket.id);

      socket.on('authenticate', (token) => {
        console.log('[Socket.IO] Client authenticated:', socket.id);
        socket.join('authenticated');
      });

      socket.on('disconnect', () => {
        console.log('[Socket.IO] Client disconnected:', socket.id);
      });
    });

    server.listen(port, async () => {
      console.log(`> Ready on http://${hostname}:${port} as ${dev ? 'development' : 'production'}`);
      // Start Discord Bot service if configured
      await startDiscordBot();
    });

    // Graceful shutdown handlers
    const shutdown = async () => {
      console.log('Shutting down server and services...');
      await stopDiscordBot();
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start Next.js unified server:', err);
    process.exit(1);
  }
}

startServer();
