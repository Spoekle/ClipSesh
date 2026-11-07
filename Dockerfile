# ==========================================
# ClipSesh Unified Production Dockerfile
# Next.js + Socket.IO + Discord Bot
# ==========================================

# ---------- Build stage ----------
FROM node:22-bookworm-slim AS builder

# python3, make, g++: native node-gyp builds (bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY tsconfig.json next.config.ts postcss.config.mjs ./
COPY public ./public
COPY server.ts ./
COPY src ./src
COPY drizzle ./drizzle

RUN npm run build \
    && rm -rf .next/cache \
    && npm prune --omit=dev --legacy-peer-deps

# ---------- Runtime stage ----------
FROM node:22-bookworm-slim

# ffmpeg: video compression and thumbnails; ca-certificates: outbound TLS (Discord, APIs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    python3 \
    curl \
    && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get purge -y curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/package.json /app/tsconfig.json /app/next.config.ts /app/server.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle

RUN mkdir -p uploads profilePictures download/tmp

EXPOSE 3000

# Run tsx directly (not via npm) so SIGTERM reaches the server's shutdown handler
CMD ["node_modules/.bin/tsx", "server.ts"]
