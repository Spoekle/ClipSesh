'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaDiscord } from 'react-icons/fa';
import { Search, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScraperChannelScannerProps {
  channelId: string;
  setChannelId: (val: string) => void;
  isScanning: boolean;
  scanProgress: {
    scannedMessages: number;
    foundClipsCount: number;
  };
  configuredChannels: string[];
  onStartScan: () => void;
  onCancelScan: () => void;
}

export const ScraperChannelScanner: React.FC<ScraperChannelScannerProps> = ({
  channelId,
  setChannelId,
  isScanning,
  scanProgress,
  configuredChannels,
  onStartScan,
  onCancelScan,
}) => {
  return (
    <div className="bg-cc-card p-5 sm:p-6 rounded-xl border border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/25 flex items-center justify-center shrink-0">
            <FaDiscord size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Discord Channel Scraper & Ingestion</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scrape historical clip links from Discord channels, preview by season/timestamp, and import into seasonal storage
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Enter Discord Channel ID"
              disabled={isScanning}
              className="bg-cc-ground border-border text-xs text-white placeholder-muted-foreground/60 font-mono"
            />
          </div>

          {isScanning ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="default"
                size="default"
                disabled
                className="gap-1.5 bg-primary text-white"
              >
                <Loader2 className="size-3.5 animate-spin" />
                <span>Scanning Channel...</span>
              </Button>
              <Button
                variant="destructive"
                size="default"
                onClick={onCancelScan}
                className="gap-1.5"
                title="Cancel channel scan"
              >
                <Square className="size-3" />
                <span>Cancel Scan</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="default"
              onClick={onStartScan}
              disabled={!channelId.trim()}
              className="gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold"
            >
              <Search className="size-3.5" />
              <span>Scan Channel Clips</span>
            </Button>
          )}
        </div>

        {configuredChannels.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-muted-foreground font-medium">Configured Ingest Channels:</span>
            {configuredChannels.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setChannelId(id)}
                disabled={isScanning}
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-sm border transition-colors cursor-pointer ${
                  channelId.trim() === id
                    ? 'bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/40 font-semibold'
                    : 'bg-cc-ground text-muted-foreground border-border hover:text-white hover:border-border/80'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        )}
      </div>

      {isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-4 rounded-xl bg-cc-ground border border-border flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Loader2 className="size-4 animate-spin text-primary" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">
                Scraping Discord Channel Message History...
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Scanned {scanProgress.scannedMessages.toLocaleString()} messages • Discovered{' '}
                <strong className="text-white">{scanProgress.foundClipsCount}</strong> valid clips
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-cc-card text-muted-foreground border border-border">
              Respecting Discord Rate Limits
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onCancelScan}
              className="gap-1.5"
            >
              <Square className="size-3" />
              <span>Cancel Scan</span>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ScraperChannelScanner;
