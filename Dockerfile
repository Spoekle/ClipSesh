# ==========================================
# ClipSesh Unified Production Dockerfile
# Next.js 16.3.4 + Socket.IO + Discord Bot
# ==========================================

FROM node:22-bookworm-slim

# Install system dependencies:
# - ffmpeg: required for video compression and thumbnail generation
# - python3, make, g++: required for native node-gyp builds (e.g. bcrypt)
# - ca-certificates: required for secure external API and Discord calls
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (leveraging Docker layer cache)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy application source
COPY tsconfig.json next.config.ts postcss.config.mjs ./
COPY public ./public
COPY server.ts ./
COPY src ./src

# Create media directories for persistent mounts
RUN mkdir -p uploads profilePictures download/tmp

# Build Next.js production bundle
RUN npm run build

# Default environment configuration
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Expose web server port
EXPOSE 3000

# Start unified server (Next.js + Socket.IO + Discord Bot)
CMD ["npm", "run", "start"]
